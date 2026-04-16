# Rhema Knowledge Bank

This document serves as a growing collection of architectural explanations, engineering challenges, Q&As, and problem-solving strategies for the Rhema application.

---

## 1. How does the Audio-to-Verse pipeline work?

**Q: From listening to the input, what happens, how much time does it take, how does it pick the verse, what makes it slow, and what causes pauses or missed words?**

Here is the "Life Cycle" of a spoken sentence inside Rhema:

### Step 1: Listening (The Ear)
The Rust backend (`rhema_audio` via `cpal` / CoreAudio) constantly streams audio bytes from your microphone in small packets 50 times every second.
*   **Latency:** < 5 milliseconds.

### Step 2: Speech-to-Text (The Brain's Interpreter)
Raw sound waves are turned into written words.
*   **Deepgram (Cloud):** Streams audio packets continuously over WebSockets. Deepgram responds with "interim" (partial) transcripts almost instantly.
    *   *Latency:* ~100 - 200ms.
    *   *Pros:* Extremely fluid, word-by-word real-time output.
    *   *Cons:* Pauses only happen if the internet connection drops or stutters.
*   **Whisper Local (`large-v3-turbo`):** Uses Voice Activity Detection (VAD) to wait until the speaker pauses or takes a breath. It records that entire "chunk" (e.g., 3 seconds) and feeds it to the local GPU.
    *   *Latency:* 2 - 4 seconds.
    *   *Cons:* If the speaker talks fast without breathing, the chunk gets too long. The engine is forced to chop the audio awkwardly, which makes the AI lose the context of the sentence, resulting in missed words or stuttering.

### Step 3: Detecting the Verse (The Detective)
Once the app has a text sentence, it fires it through three filters simultaneously (`rhema_detection`):
1.  **Direct Matcher:** Looks for obvious numbers and book names (e.g., "John 3 16"). *(Speed: 1ms)*
2.  **Quotation Matcher:** Searches an SQLite FTS5 database to see if 5+ words perfectly match a verse. *(Speed: 10ms)*
3.  **Semantic AI Matcher:** Feeds the sentence into the `Qwen3` ONNX model, turning it into a mathematical vector of 1,024 numbers. It compares these numbers against the 31,000 pre-calculated verse vectors. *(Speed: 30-50ms)*

### Step 4: Displaying to the Screen
If a match is found and confidence is high (`auto_queued = true`), the Rust backend sends the data to the React UI. The UI instantly updates the Broadcast / NDI output.
*   *Latency:* ~16ms (1 frame update).

---

## 2. Solving the Local Whisper "Pausing / Missed Words" Problem

**Q: How do we find the best solution for Whisper awkwardly chopping audio when someone speaks fast without breathing?**

Currently, Rhema handles local Whisper linearly: `Listen -> Wait for Silence -> Process -> Output`. To solve the "long chunk" problem, we must shift to a **Streaming / Sliding Window** approach. There are three major solutions to implement this:

### Solution A: The "Sliding Window" Algorithm (Code Architecture Fix)
Instead of waiting for a pause, we maintain a continuous rolling buffer of the last 3-to-4 seconds of audio. Every 500 milliseconds, you feed that *entire* 4-second buffer to Whisper.
*   *How it works:* Because the transcriptions overlap, your code compares the new text to the old text, ignores the duplicates, and instantly pushes the *new* words to the screen. 
*   *Why it solves it:* It forces Whisper to output word-by-word "interim" results exactly like Deepgram does, completely eliminating the need to wait for the speaker to take a breath.

### Solution B: Switch to Distil-Whisper (Model Optimization)
The `large-v3-turbo` model is highly accurate but computationally heavy for chunking. 
*   *How it works:* Switch the local model download to `distil-whisper-small.en`.
*   *Why it solves it:* Distil models are 6x faster and 50% smaller. It can process a 3-second chunk of audio in less than 100 milliseconds. When the processing is that fast, the VAD can be tuned to chop sentences aggressively (even during micro-pauses like a comma space) without causing massive CPU lag.

### Solution C: Prompting Context (Context Retention)
Whisper supports a feature called "Initial Prompt".
*   *How it works:* When the audio is awkwardly chopped in half, you pass the text of the *first half* of the chopped sentence into the "Initial Prompt" field of the next chunk.
*   *Why it solves it:* Even though the audio is split, the AI receives context of what was just said, allowing it to accurately guess fragmented words on the boundaries, preventing "lost words".

---

## 3. Comparing Whisper Solutions & Non-Destructive Addition

**Q: Considering Option 1 (Sliding Window) and Option 2 (Distil-Whisper), what is the exact time difference? Can I add these without removing the existing code?**

### The Time Differences:
1. **Current Code (Large-v3-Turbo + VAD):** 
   - Latency: **2.0 to 4.0 seconds.** 
   - Behavior: Delays the rendering until the speaker naturally stops talking, then posts a mega-chunk of text.
2. **Option 1: Sliding Window:**
   - Latency: **~500 milliseconds (0.5 seconds).** 
   - Behavior: Streams words to the screen almost exactly like Deepgram does. It NEVER waits for the user to breathe. Every 500ms, whatever was spoken magically appears on screen.
3. **Option 2: Distil-Whisper Model:**
   - Latency: **~400 - 800 milliseconds** (if we aggressively tune the pauses).
   - Behavior: Reduces the processing time massively, but *still requires the user to pause*. If the user never breathes, the chunk will still get too long, but it recovers 6x faster when they finally do pause.

### Can we add these as features without removing the existing one?
**Absolutely.** You never have to delete what "already works." We can implement these as **Toggle Features**. 

**How we would do it:**
1. **The UI (React):** We would go into your Settings Dialog (`settings-dialog.tsx`) and add a new section called *Local Whisper Preferences*. We would add a dropdown for **Model Selection** (`Large-v3-Turbo` vs `Distil-Whisper`) and a toggle switch for **Enable Real-Time Streaming (Sliding Window)**.
2. **The Logic (Rust):** Inside your audio processing code (`crates/stt/src/whisper.rs`), we would pass these settings down. If "Real-Time Streaming" is toggled **Off**, it instantly reverts to your current, secure, Voice-Activity-Detection method. If it's toggled **On**, it switches to the overlapping-buffer algorithm. 
3. **The Benefit:** You can A/B test them live during a service. If the streaming method ever glitches out, you just un-check the box in Settings, and it instantly falls back to your original code!

---

## 4. Replicating Deepgram Exactly (The "Holy Grail" of Local STT)

**Q: Is it not possible to have it EXACTLY like Deepgram? If yes, how exactly?**

Yes, it is possible, but it requires a fundamental shift in how the engine processes audio. 

Deepgram feels like magic because it doesn't wait. It gives you "interim" (guessing as you speak) and "final" (corrected when you finish) results. Standard Whisper was programmed by OpenAI to ingest 30-second blocks of audio all at once—it is not natively built to stream like Deepgram. 

To make your local model behave **exactly** like Deepgram, we must build a **Streaming Wrapper with a Word-Diff Algorithm**, or adopt a true streaming architecture.

### How we build it (The Deepgram Clone Algorithm):
If we want to stick with Whisper, we have to fake the streaming. Here is exactly how we write the Rust code to do it:
1.  **Continuous Flow:** We never use VAD to stop the microphone. The microphone records continuously into a rolling 3-second buffer.
2.  **The 300ms Loop:** Every 300 milliseconds, the Rust backend grabs the current audio buffer and forces Whisper to transcribe it extremely fast (this is why we *must* use Option 2: Distil-Whisper, because `large-v3` cannot compute every 300ms without catching on fire).
3.  **The Diff Engine (The Secret Sauce):** 
    - At `0.3s`, Whisper says: *"For God so"*
    - At `0.6s`, Whisper says: *"For God so loved the"*
    - At `0.9s`, Whisper says: *"For God so loved the world"*
    We write a "Diff" algorithm that compares the new text to the old text. It realizes the word *"loved"* and *"the"* was just added. It instantly fires exactly those words to the React UI as an `is_final: false` (interim) event—*exactly the identical payload that Deepgram sends over websockets.*
4.  **The Commit:** Once VAD detects you actually took a breath, the engine fires an `is_final: true` event to lock in the sentence, completely mimicking Deepgram's API.

### Alternative Option (The True Streaming Model):
If rewriting Whisper to fake a stream is too glitchy, we can rip out Whisper entirely for local use and replace it with a model natively built for streaming (called RNN-T architectures).
*   **Sherpa-ONNX (Next-gen Kaldi):** This is a local, open-source AI engine specifically built for live streaming. It runs locally in Rust, computes instantly on CPU, and spits out word-by-word interim results out-of-the-box identically to Deepgram.

---

## 5. The Ultimate Open-Source Streaming Engines (Beating Deepgram Locally)

**Q: Can you compare all highly-optimized, open-source AI engines specifically built for live streaming, and explain how to swap them in?**

To be "better than Deepgram" locally is the ultimate challenge. Deepgram runs on clusters of massive A100 GPUs using proprietary "Nova 2" models. Overcoming Deepgram in *latency* locally is very possible, but matching their word-error-rate (WER) accuracy requires elite models.

Here are the top 3 open-source engines natively built for real-time streaming, completely bypassing the "chunking" problem:

### 1. Sherpa-ONNX (The Undisputed King of Local Streaming)
Built by the Next-Gen Kaldi community, this is currently the holy grail for what we want.
*   **Architecture:** Zipformer / RNN-T.
*   **How it streams:** Unlike Whisper, it is specifically trained to read audio sequentially. You don't give it blocks of sound; you literally "pour" audio into it continuously, and it spits back words instantly.
*   **Latency:** **< 50ms.** It is genuinely faster than Deepgram because there is zero network travel time.
*   **Accuracy:** Extremely high. It uses massive datasets and rivals Whisper Base/Small.
*   **Verdict:** This is the ONLY local model that will organically give you the exact Deepgram Websocket experience without having to write hacky "Diff Algorithms."

### 2. Vosk
The grandfather of offline, real-time STT. 
*   **Architecture:** Classic Kaldi (TDNN).
*   **How it streams:** Similar to Sherpa, accepts constant `PCM` audio bytes and returns interim results instantly.
*   **Latency:** Very fast (~100ms).
*   **Accuracy:** Moderate. It is older and doesn't handle heavy accents or complex Biblical names (like *Nebuchadnezzar*) as elegantly as modern AI models.
*   **Verdict:** A great fallback if you have weak computers, but slightly outdated for 2026 standards.

### 3. Whisper-Streaming (Whisper.cpp + Overlap Algorithm)
This keeps the core Whisper brain (which has the absolute highest accuracy for Biblical text) but wraps it in a highly-optimized C++ streaming library.
*   **Architecture:** Transformer (Standard Whisper).
*   **Latency:** ~400ms - 600ms.
*   **Accuracy:** Flawless (Best-in-class).
*   **Verdict:** It uses the "Deepgram Clone Algorithm" I mentioned earlier. Higher latency than Sherpa-ONNX, but the absolute highest text accuracy.

### How to "Swap It In" to Rhema
The beautiful thing about the Rhema codebase is that your backend (`crates/stt/`) was built modularly. Right now, it has `deepgram.rs` and `whisper.rs`. To swap the engine, we:
1.  **Dependencies:** We open your Rust `Cargo.toml` file and add the binding crate (e.g., `sherpa-rs` or `vosk-rs`).
2.  **Create the Provider:** We create a new file called `crates/stt/src/sherpa.rs`.
3.  **The Hookup:** Instead of waiting for Voice Activity (VAD) to trigger, we wire the raw Microphone feed (`cpal`) directly into Sherpa's `AcceptWaveform()` function.
4.  **The Event Loop:** We write a tiny loop that asks Sherpa every 50 milliseconds: *"Do you have new words?"* If yes, it fires the React event instantly.
5.  **The Dropdown:** We add "Sherpa-ONNX" to the React Settings UI alongside Deepgram and Whisper, allowing you to instantly hot-swap engines with a single click.

---

## 6. Engine Behavior, Accents, and Mispronunciations

**Q: What are the differences noticed when switching between engines? Why does Sherpa sometimes pick the wrong verse? What happens if a verse is mispronounced or the STT gets it completely wrong?**

### The Physical Differences You Notice Switching Engines:
1.  **Deepgram:** The scrolling text on the screen feels buttery smooth. Word-by-word appears magically. The accuracy of obscure Bible names (like *Habakkuk*) is flawless because the API allows us to pass "Keyword Boosting" dictionaries.
2.  **Whisper:** The text feels "blocky." You speak a sentence, wait 2 seconds, and then a massive chunk of perfectly translated text slams onto the screen at once. It handles heavy accents the best, but lacks the visual smoothness.
3.  **Sherpa-ONNX:** The scrolling text is buttery smooth like Deepgram, but occasionally you notice it spells obscure words weirdly (e.g., spelling *Philemon* as *file mon*). 

### How to Fix Sherpa-ONNX (UI Lag & Accuracy)
If Sherpa is struggling to pick the right verse or the UI feels laggy, there are two fixes:
1.  **Fixing Accuracy (Hotwords/Context Biasing):** Sherpa's model is much smaller than Deepgram's massive servers. To fix it mishearing Bible books, we must program **"Hotwords"** into the Sherpa Rust configuration. We pass an array of all 66 Bible books to Sherpa's `hotwords_file` setting and apply a massive weight `+10.0`. This forces the AI engine to aggressively favor translating words as Biblical books rather than random English phrases.
2.  **Fixing UI Visual Lag (Debouncing):** If Sherpa's stream feels visually stuttering, it's because the Rust backend is firing Web-Events to the React UI *too fast* (e.g., 60 times a second), causing the UI thread to choke. We must add a `debounce` timer in Rust so it only updates the React UI every ~100ms.

### What happens when STT mishears or the speaker mispronounces?
If the speaker has a heavy accent, or the microphone catches a pop, and the translation says *"Jon chapter tree verse tree"* or *"For Dog so loved the world"*:
1.  **Fuzzy String Matching (Rescue Level 1):** The Rust Direct Matcher (`rhema_detection`) uses advanced "Levenshtein distance" (Fuzzy matching). It mathematically realizes that "Jon" and "tree" are phonetically identical spelling distance to "John" and "3". It fixes the typo automatically.
2.  **Semantic Vectors (Rescue Level 2):** If it mishears a whole sentence (e.g., *"For Dog so loved the world"*), the AI Embedding Model (Qwen-3) converts that sentence into a mathematical shape. The "shape" of that sentence matches John 3:16 in the vector database almost flawlessly despite the typos. The AI forgives the exact spelling and forces the correct verse up anyway.
3.  **The Failsafe (What is displayed?):** If the sentence is so wildly mispronounced that both the Fuzzy Matcher and Vector Engine score below the `0.80` Confidence Threshold, **nothing is displayed**. Rhema is explicitly designed to silently drop bad detections to ensure you never accidentally project garbage text or a wrong scripture onto the church screens.

---

## 7. Comparative Roadmap: EasyWorship vs. Rhema AI

**Q: What features from EasyWorship can we integrate into Rhema, and how do the two apps compare?**

### The Core Comparison
*   **EasyWorship (Manual & Linear):** A traditional presentation software where a media operator builds a rigorous pre-service schedule (songs, announcements, exact scriptures) and manually clicks the "Next" arrow during the service. It is highly stable for media mapping but fails entirely if the preacher acts spontaneously off-script.
*   **Rhema AI (Automated & Spontaneous):** Real-time broadcast automation. There is no pre-built schedule. The AI simply listens and serves content mathematically. It captures spontaneous moves of the Spirit instantly but currently lacks linear media structures (like a song lyric manager or video library).

### Top 5 EasyWorship Features We Can Supercharge with AI in Rhema:

1.  **Stage Display / Foldback Screen (Real-time Teleprompter)**
    *   *Concept:* EasyWorship has a musicians' monitor showing the next slide. In Rhema, we can map a browser route (`localhost:3000/stage`) pointing to a back-wall TV. 
    *   *AI Supercharge:* Aside from showing the detected scripture, it streams the transcription in high-contrast text, serving as a live teleprompter for the Pastor or a closed-captioning screen for the hearing-impaired.
2.  **CCLI / SongSelect Integration (Automated Lyrics)**
    *   *Concept:* Manual lyric importing.
    *   *AI Supercharge:* When the Worship Leader starts singing, Rhema's STT engine hears the words, searches the imported SongSelect database instantly, and **automatically advances the lyric slides line-by-line**. Ultimate hands-free worship projection.
3.  **Hardware Automation (MIDI / ATEM API)**
    *   *Concept:* Triggering slides via MIDI keys.
    *   *AI Supercharge:* When Rhema detects a Scripture, it secretly sends an HTTP or MIDI command to the church's video switcher (like Blackmagic ATEM or OBS). The cameras automatically fade to the "Scripture Layout", and when the pastor stops talking for 5 seconds, it fades back to the wide shot. Zero-operator broadcasting.
4.  **Motion Background Library**
    *   *Concept:* MP4 looping video backgrounds behind text.
    *   *AI Supercharge:* Update the Rhema `theme-designer` to accept `.mp4` transparent loops instead of just static gradients, elevating the NDI broadcast output visual quality to industry standard.
5.  **Smart Sermon Notes**
    *   *AI Supercharge:* The pastor drops their `.txt`/PDF sermon notes into Rhema. As they preach, Rhema reads context. When they physically speak the bullet point out loud, Rhema recognizes it semantically and throws the styled bullet point on the screen automatically.

---

## 8. The Autonomous Sermon Architect (Presentations & Live Notes)

**Q: How exactly can Presentation Slides, Sermon Notes Integration, and Live Note-Taking be integrated? What is the exact plan and what is needed?**

To completely eliminate the need for software like EasyWorship or PowerPoint, Rhema needs a feature ecosystem we will call the **Autonomous Sermon Architect**. 

Here is exactly how it will work, step-by-step, the technology needed, and the engineering plan:

### Feature 1: Presentation Slides & Sermon Notes Triggering
Instead of a human operator waiting to press the "Right Arrow Key" on a PowerPoint slide, the AI will trigger slides automatically using Vector Embeddings.

*   **How it works (The Magic):**
    1.  **The Upload:** Before the service, the prep team pastes the pastor's 10 main sermon notes/bullet points into the new Rhema "Sermon Flow" panel.
    2.  **The Vectorization (Pre-computation):** As soon as they hit save, Rhema secretly takes those 10 bullet points and feeds them into the local `Qwen3-0.6B` ONNX model. The model computes the 1,024-dimension mathematical vector for each bullet point and temporarily stores them in the vector database alongside the Bible verses, tagged as `source: sermon_note`.
    3.  **The Live Trigger:** 45 minutes into the sermon, the STT (Sherpa/Deepgram) transcribes the pastor's spoken sentence. The Semantic Engine checks the live text against the database. It realizes the mathematical "meaning" of the pastor's current verbal rant is a 95% match for *Bullet Point #4* in the notes!
    4.  **The Output:** The system instantly triggers a beautifully styled graphic of Bullet Point #4 to the NDI broadcast screen automatically.
*   **What is needed (Dependencies):**
    *   **Frontend:** A new React panel (`sermon-notes-panel.tsx`) that acts as a text editor to write or paste points.
    *   **Backend:** Rust crates like `pdf-extract` or `docx-rs` if we want to extract text from a file natively. Updating the `HNSW` vector index logic to hold "dynamic/temporary" vectors that get wiped cleanly after Sunday service.

### Feature 2: Congregational Live Note-Taking (The Interactive Feed)
EasyWorship pushes pixels to a projector. Rhema will push data directly to the congregation's smartphones.

*   **How it works:**
    1.  **The Broadcast:** Rhema generates a localized QR code on the church projector before the service.
    2.  **The Connection:** The congregation scans the QR code. It opens a clean, minimalist web app served directly from the Rhema MacBook over the local church WiFi.
    3.  **The Live Feed:** Because Rhema is already transcribing EVERYTHING the pastor says via the STT engine, the congregation sees a live "Teleprompter / Transcript Block" filling up on their phones natively in real-time. (This is brilliant for accessibility or deaf congregants).
    4.  **Auto-Notes Integration:** Every time the Rhema AI detects a Bible Verse or triggers an Autonomous Sermon Slide, that specific graphic drops directly into the congregation's phone feed timeline.
    5.  **Personal Notes:** Parishioners can click on any Bible verse or AI-triggered note on their phone and physically type their own private diary notes underneath it. At the end of the service, they hit "Export to PDF" and save their church notes forever.
*   **What is needed (Dependencies):**
    *   **Frontend Web Route:** Add a new lightweight React route (`/mobile-live-feed`) optimized specifically for mobile phone screens.

---

## 9. Rhema Global: The Open-Source Execution Plan

**Q: Give me a proper, actual execution plan using the best open-source tools (from Hugging Face) without depending on paid APIs. How do we break down the steps?**

To build this purely open-source and run it locally on your machine (saving thousands of dollars in API costs), we must heavily utilize Hugging Face's elite models. Because Rhema is written in Rust, we can run all of these locally via the `Candle` AI framework you are already using.

Here is the exact 3-phase execution playbook:

### Phase 1: Real-Time Translation (The NLLB Implementation)
We cannot rely on Google Translate. We need a neural network running locally that understands theological context in hundreds of languages.

*   **The Open-Source Tool:** **NLLB-200 (No Language Left Behind)** by Meta (available on Hugging Face). Specifically, the `nllb-200-distilled-600M` model. It natively supports over 200 languages, including Swahili, Arabic, Hausa, and Yoruba, and is lightweight enough to run rapidly on a Mac CPU/GPU.
*   **The Execution Plan:**
    1.  Add the Hugging Face `Candle` pipeline for NLLB into the Rust backend.
    2.  When Sherpa-ONNX finalizes an English sentence from the mic, Rust immediately shoves that sentence into the local NLLB model.
    3.  NLLB translates it locally and outputs the Arabic/Swahili text in less than 200ms.
    4.  **Optional Paid Fallback:** A UI toggle to use the DeepL API or GPT-4o API if the church prefers maximum theological nuance.

### Phase 2: Zero-Shot Voice Cloning (The Voice Dubbing)
We must synthetically speak the Arabic text using the Pastor's exact voice, natively on the Mac.

*   **The Open-Source Tool:** **XTTS-v2** by Coqui (or **OpenVoice** by MyShell). XTTS-v2 is the undisputed king of open-source voice cloning on Hugging Face. It inherently understands 17 languages (including Arabic). 
*   **The Execution Plan:**
    1.  The media team uploads a 5-second `.wav` file of the Pastor speaking normally into the Rhema settings.
    2.  Rust executes the local XTTS-v2 model, feeding it the 5-second `pastor.wav` and the translated Arabic text from Phase 1.
    3.  XTTS-v2 mathematically copies the Pastor's emotional tone and spits out an Arabic audio buffer instantly.
    4.  Rhema pipes this audio buffer to a local WebSocket Server (`localhost:3000/listen`). The congregation puts in AirPods, connects to the WiFi, and hears the localized voice.
    5.  **Optional Paid Fallback:** A UI toggle to route the text to the ElevenLabs API instead.

### Phase 3: The Digital Twin (Real-Time Lip-Sync)
We take the live camera feed of the Pastor and dynamically mutate his lips to match the newly generated Arabic audio.

*   **The Open-Source Tool:** **Wav2Lip** or **SadTalker** (available on Hugging Face). Wav2Lip is specifically optimized to warp a speaker's mouth to an audio track frame-by-frame.
*   **The Execution Plan (The Heaviest Step):**
    *   *Note: This step is intensely heavy and requires an Apple M-series Max/Ultra GPU to run smoothly in real-time.*
    1.  Rhema captures the raw live camera feed of the Pastor using **NDI** (or a capture card).
    2.  For every video frame, the Rust/C++ backend passes the visual frame of the Pastor's face + the generated Arabic XTTS-v2 audio buffer into the local Wav2Lip ONNX model.
    3.  Wav2Lip repaints the Pastor's mouth pixels to match the Arabic syllables and outputs the new video frame in real-time.
    4.  Rhema broadcasts this mutated video feed out via NDI to the network as "Rhema Arabic Video Feed," which the AV team can pipe straight to the Arabic YouTube stream!
    5.  **Optional Paid Fallback:** A UI toggle to stream the raw camera frame + audio to `SyncLabs API` or `HeyGen API` to offload the heavy deepfake generation to the cloud.
