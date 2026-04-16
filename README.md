# Rhema 📖

Welcome to **Rhema**! 

Whether you're a developer, a technical director at a church, or just curious about real-time AI, you've come to the right place. Rhema is a desktop application built for live sermons and church broadcasts. Its primary job is to **listen to a speaker in real-time, instantly figure out if they are quoting or referencing a Bible verse, and format that verse so it can be pushed as a visual graphic overlay to live video production software.**

Instead of a media operator scrambling to type out a verse a preacher suddenly references, Rhema automates this by listening to their voice and instantly identifying the scriptures using AI and text matching!

---

## ✨ Features

- **Real-time speech-to-text** via Deepgram (WebSocket streaming + REST fallback).
- **Multi-strategy verse detection**:
  - Direct reference parsing (Aho-Corasick automaton + fuzzy matching).
  - Semantic search (Qwen3-0.6B ONNX embeddings + HNSW vector index).
  - Quotation matching against known verse text.
  - Sermon context tracking and sentence buffering.
- **SQLite Bible database** with FTS5 full-text search.
- **Multiple translations** included automatically (KJV, NIV, ESV, NASB, NKJV, NLT, AMP + Spanish, French, Portuguese).
- **Cross-reference lookup** (340k+ refs from openbible.info).
- **NDI broadcast output** for live video production integration.
- **Theme designer** — visual canvas editor for verse overlays with backgrounds (solid, gradient, image), text styling, positioning, shadows, and outlines.
- **Verse queue** with drag-and-drop ordering.
- **Live UI** — Audio level metering, session timers, and a fuzzy contextual search for manual operation.

- **Speech-to-Text Engines**:
  - **Cloud:** Deepgram continuous WebSockets for ultra-low latency.
  - **Local (Streaming):** Sherpa-ONNX Zipformer support for true word-by-word offline streaming with zero latency.
  - **Local (Offline):** Whisper (large-v3-turbo) fully on-device processing via Apple Metal.

---

## 🧠 How Data Flows (The Core Loop)

If a preacher says *"As it says in John chapter 1 verse 1, in the beginning was the Word"*, here is what Rhema does under the hood:

1. **Audio Capture**: The app captures the live microphone or audio feed.
2. **Speech-to-Text**: The audio is streamed to your chosen engine (Deepgram, Sherpa, or Whisper) and transcribed.
3. **Verse Detection**: Rust analyzes the incoming transcribed words. It looks for direct citations ("John 1:1") or contextual quotes (using a locally run ONNX AI model). 
4. **Database Lookup**: Once a verse is detected, Rhema pulls the exact translation texts (KJV, NIV, NASB, etc.) from the bundled local SQLite database.
5. **User Interface**: The verse pops up in the React dashboard. The operator sees it in the "Preview Panel" and can push it into a queue or send it live.
6. **Broadcast Output**: When set to live, Rhema renders the styled text on a customized image background and pushes it out to your local network using **NDI**. Software like OBS Studio or vMix intercepts the NDI feed and lays it over the live camera feed.

---

## 🛠️ The Tech Stack

Rhema is a **Tauri v2** application, meaning it uses web technologies for its user interface and Rust for its system-level backend.

| Layer | Technologies |
|---|---|
| **Frontend UI** | React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Zustand, Vite 7 |
| **Backend Engine** | Tauri v2, Rust (workspace with 7 crates) |
| **AI/ML Detection** | ONNX Runtime (Qwen3-0.6B embeddings), Aho-Corasick, Fuse.js |
| **Local Database** | SQLite via rusqlite (bundled) with FTS5 search |
| **Live Broadcast** | NDI 6 SDK via dynamic loading (libloading FFI) |
| **Speech to Text** | Deepgram WebSocket + REST (tokio-tungstenite) |

### Rust Project Structure (Back-End)

The backend heavy lifting is divided into **7 custom crates** (sub-projects) within `src-tauri/crates/`:
- `rhema-audio`: Microphone and audio device input.
- `rhema-stt`: Deepgram STT (Speech to Text) connection.
- `rhema-bible`: Local SQLite database searches and FTS5 optimization.
- `rhema-detection`: The complex AI, NLP, and text-matching verse logic.
- `rhema-broadcast`: Rendering and sending the NDI video feed.
- `rhema-api`: Commands bridging frontend React events to backend Rust logic.

---

## 🚀 Step-by-Step Installation

Because Rhema relies on external AI models and copyrighted translation downloads, we provide a unified script that fetches everything for you. 

### 1. Install Prerequisites

You will need the following tools installed on your computer before starting:

*   **Bun**: Fast JavaScript runtime & package manager. 
    *(Mac/Linux users can install by running: `curl -fsSL https://bun.sh/install | bash` in the terminal)*
*   **Rust**: For compiling the backend. 
    *(Install via: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)*
*   **Python 3**: For downloading ML models and compiling dependencies.
*   **Tauri Prerequisites**: Depending on your OS, you may need additional build tools. Check the [Tauri Setup Guide](https://v2.tauri.app/start/prerequisites/).

### 2. Environment Variables

You need a Speech-To-Text API key. We use Deepgram for blazing-fast transcription.
Create a file named `.env` in the root of the project folder:

```
DEEPGRAM_API_KEY=your_key_here
```

### 3. Setup and Download Data

Open your terminal in the `rhema` folder and run:

```bash
# 1. Install all frontend Javascript dependencies
bun install

# 2. Run the master data setup pipeline
bun run setup:all
```

**What does `bun run setup:all` do?**
It automatically runs a sequence of scripts that:
1. Sets up a local Python virtual environment (`.venv`).
2. Downloads open-source databases (KJV, cross-references, Spanish, French, Portuguese).
3. Downloads specific copyrighted translations from BibleGateway (NIV, ESV, NASB, NKJV, NLT, AMP).
4. Compiles all these texts into your local SQLite `rhema.db`.
5. Downloads the Qwen3-0.6B ONNX embedding model.
6. Exports verses to JSON and locally precomputes vectors so your AI searching is blazingly fast.

*(Note: Step 3 and 7 might take quite a long time depending on your internet connection and CPU!).*

### 4. Optional: Download NDI SDK
If you want to use the NDI Broadcast feature to output graphics to OBS/vMix:
```bash
bun run download:ndi-sdk
```

---

## 🏃 Running The Application

### Development Mode

To start the app while developing or testing:

```bash
bun run tauri dev
```
*This starts the frontend Vite server and compiles the Rust backend.*

### Building for Production

To create a final installable App/Exe:

```bash
bun run tauri build
```

---

## 📜 All Scripts Reference

For advanced users or if a setup phase failed, you can run individual scripts:

| Script | Description |
|---|---|
| `dev` | Start Vite dev server |
| `build` | TypeScript check + Vite production build |
| `tauri` | Run Tauri CLI commands |
| `test` | Run Vitest tests |
| `setup:all` | **Full setup** — runs all data/model/embedding phases (idempotent) |
| `download:bible-data` | Download public domain Bible translations + cross-references |
| `build:bible` | Build SQLite Bible database from JSON sources |
| `download:model` | Export Qwen3-Embedding-0.6B to ONNX + quantize to INT8 |
| `export:verses` | Export verses to JSON for embedding precomputation |
| `precompute:embeddings` | Precompute embeddings via Rust ONNX binary |
| `download:ndi-sdk` | Download NDI 6 SDK headers and platform libraries |
