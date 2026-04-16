# Rhema - Product Roadmap & Enhancements

This document tracks feature requests, competitive analysis (e.g., Pewbeam), technical enhancements, and customer feedback to help systematically improve the Rhema application.

## 🚀 Near-Term Enhancements

### 1. Real-Time Offline Whisper STT (Streaming Mode)
Currently, Rhema's local Whisper integration uses "chunked" processing (waits for a pause in speech to transcribe). To achieve Deepgram-level real-time responsiveness fully offline:
- **Implement a Sliding Window:** Modify `crates/stt/src/whisper.rs` to send audio buffer clones every 500ms to Whisper while catching active speech, emitting `TranscriptEvent::Partial`.
- **Use Faster Models:** Switch from `large-v3-turbo` to `ggml-small.en-q8_0` or `base.en` in `data/download-whisper-model.ts` so that 500ms sliding windows can process continuously without lagging your CPU.
- **Stateful Prompting:** Use `whisper_full_with_state` to reuse context tokens across partial loops for maximum efficiency.

### 2. AI Sermon Notes & Export (`rhema-notes`)
Address the placeholder `rhema-notes` crate to capture value similar to paid church presentation tools (closing a major gap with Pewbeam's $14/mo tier).
- **Auto-Summarization:** At the conclusion of a session, send the compiled transcript buffer to a fast local AI (like LLaMA) or a secure cloud fallback.
- **Structured Outputs:** Automatically generate a 3-paragraph summary, bulleted key takeaways, and a chronological ordered list of all referenced verses.
- **Export Capability:** Allow quick 1-click PDF or Markdown export from the dashboard.

### 3. Dual Broadcast Output (Main + Alternate)
Provide greater flexibility for church media teams managing both a physical auditorium and a YouTube livestream simultaneously.
- **Multiple Video Senders:** Refactor `rhema-broadcast` to establish two concurrent NDI streaming instances.
- **Theme Variants:** 
   - `Feed 1`: Full-screen layout with large text for physical projectors.
   - `Feed 2`: Lower Thirds layout with a transparent background for livestream overlays.

### 4. Cinematic Verse Presentations (Swell Animations)
Move beyond instantaneous verse popping to provide a highly polished, TV-quality feel.
- **NDI Frame Tweening:** Implement programmatic frame-by-frame opacity fading (0 -> 1 over 300ms).
- **Scale Animation:** Gradual background scaling (`scale 1.0` to `1.05`) to keep a cinematic motion feel on-screen while the verse is actively being read.

---

## 📊 Competitive Gaps Addressed
*A gap analysis against Pewbeam & similar Church Presentation SaaS*
- [x] Real-time Speech-to-text (Via Deepgram)
- [x] Semantic / AI Verse Contextual Matching 
- [ ] True Offline Reliability / Zero-Cloud dependency (Requires the Whisper Streaming enhancement)
- [ ] Automated AI Sermon Notes (Requires `rhema-notes` crate buildout)

---

## 💬 Customer Feedback & Concerns
*(Use this section to append user feedback, friction points, or new feature requests from the community)*

- **Feedback (Setup Experience):** Initial data setup (`bun run setup:all`) takes a significant amount of time depending on internet speeds and CPU (particularly Phase 3 copyrighted Bible downloading, and Phase 7 precomputing embeddings). 
  - *Mitigation:* Ensure setup scripts provide clear progress tracking. A future setup Wizard UI within Tauri instead of a terminal script might provide a significantly better user onboarding experience.
- **Feedback (Windows Compatibility):** A Windows user encountered a crash during the download sequence due to legacy `cp1252` encoding.
  - *Status:* Resolved in PR #19 by forcing `UTF-8` on Python data processes.
