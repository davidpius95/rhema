# Rhema

Real-time AI-powered Bible verse detection for live sermons and broadcasts. A Tauri v2 desktop app with a React frontend and Rust backend.

Rhema listens to a live sermon audio feed, transcribes speech in real time, detects Bible verse references (both explicit citations and quoted passages), and renders them as broadcast-ready overlays via NDI for live production.

## Features

- **Real-time speech-to-text** via local Whisper or cloud Deepgram (WebSocket streaming + REST fallback)
  - Whisper runs locally with no API costs; Deepgram streams via WebSocket with REST fallback
- **Voice-controlled translation switching** — say "read in NIV" or "switch to ESV" to change translations instantly during a sermon
- **Multi-strategy verse detection**
  - Direct reference parsing (Aho-Corasick automaton + fuzzy matching)
  - Semantic search (Qwen3-0.6B ONNX embeddings + HNSW vector index)
  - Quotation matching against known verse text
  - Cloud booster (optional, OpenAI/Claude)
  - Reading mode — locks to book/chapter as soon as it's mentioned, with voice navigation ("next chapter", "chapter 5")
  - Sermon context tracking and sentence buffering
- **SQLite Bible database** with FTS5 full-text search and BM25 ranking
- **Multiple translations** — KJV, NIV, ESV, NASB, NKJV, NLT, AMP + Spanish, French, Portuguese
- **Cross-reference lookup** (340k+ refs from openbible.info)
- **NDI broadcast output** for live production integration
- **Theme designer** — visual canvas editor for verse overlays with backgrounds (solid, gradient, image), text styling, positioning, shadows, and outlines
- **Verse queue** with drag-and-drop ordering and duplicate prevention (flash-highlight on duplicates)
- **Quick navigation** — keyboard-driven verse entry with autocomplete (e.g., type "J" → Joshua, Tab through book → chapter → verse)
- **Fuzzy contextual search** (Fuse.js client-side)
- **Audio level metering**, live indicator, and session timer
- **Interactive onboarding tutorial** — 11-step guided tour covering all panels, auto-launches on first startup
- **Light/dark mode** with system theme detection (light, dark, or follow OS)
- **Settings persistence** — all preferences auto-saved to disk across restarts
- **Cross-platform** — Windows, macOS, and Linux
- **Remote control** via OSC and HTTP API for hardware controllers and automation
  - [Remote control guide](documentation/remote-control.md) — Stream Deck, TouchOSC, REST API integration

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Zustand, Vite 7 |
| **Backend** | Tauri v2, Rust (workspace with 7 crates) |
| **AI/ML** | ONNX Runtime (Qwen3-0.6B embeddings), Aho-Corasick, Fuse.js |
| **Database** | SQLite via rusqlite (bundled) with FTS5 |
| **Broadcast** | NDI 6 SDK via dynamic loading (libloading FFI) |
| **STT** | Deepgram WebSocket + REST (tokio-tungstenite) |

### Rust Crates

| Crate | Purpose |
|---|---|
| `rhema-audio` | Audio device enumeration, capture, VAD (cpal) |
| `rhema-stt` | Deepgram STT streaming + REST fallback |
| `rhema-bible` | SQLite Bible DB, FTS5 search, cross-references |
| `rhema-detection` | Verse detection pipeline: direct, semantic, quotation, ensemble merger, sentence buffer, sermon context, reading mode |
| `rhema-broadcast` | NDI video frame output via FFI |
| `rhema-api` | Tauri command API layer |
| `rhema-notes` | (placeholder) |

## Prerequisites

- [Bun](https://bun.sh/) (runtime for scripts + package manager)
- [Rust](https://rustup.rs/) toolchain (stable, 1.77.2+)
- [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/) (platform-specific system dependencies)
- [Python 3](https://www.python.org/) (for downloading copyrighted translations and embedding model export)
- [CMake](https://cmake.org/) (for Whisper local transcription) — install via `brew install cmake`
- [Deepgram API key](https://deepgram.com/) (optional, for cloud speech-to-text instead of Whisper)

## Getting Started

```bash
git clone <repo-url>
cd rhema
bun install
```

### Quick Setup (recommended)

One command sets up everything — Python virtual environment, Bible data, copyrighted translations, database, ONNX model, and precomputed embeddings:

```bash
bun run setup:all
```

This runs 7 phases in sequence, skipping any that are already complete:

1. Python environment setup (`.venv` + all pip dependencies)
2. Download open-source Bible data (KJV, Spanish, French, Portuguese + cross-references)
3. Download copyrighted translations from BibleGateway (NIV, ESV, NASB, NKJV, NLT, AMP)
4. Build SQLite Bible database (`data/rhema.db` with FTS5 + cross-references)
5. Download & export ONNX model (Qwen3-Embedding-0.6B) + INT8 quantization
6. Export KJV verses to JSON for embedding
7. Precompute verse embeddings (auto-selects GPU if available, falls back to ONNX CPU)

### Environment

#### Speech-to-Text Options

Rhema supports two speech-to-text engines:

**Option 1: Whisper (Local, Free)**
No setup required! Whisper runs locally on your machine with no API costs or internet dependency.
- Requires CMake: `brew install cmake`
- Model downloads automatically on first use

**Option 2: Deepgram (Cloud, Paid)**
Create a `.env` file in the project root:

```
DEEPGRAM_API_KEY=your_key_here
```

Get your API key at [deepgram.com](https://deepgram.com/)

### NDI SDK (optional)

For broadcast output via NDI:

```bash
bun run download:ndi-sdk
```

### Running individual setup steps

Each phase can also be run independently:

```bash
bun run download:bible-data          # Public domain translations + cross-refs
python3 data/download-biblegateway.py  # Copyrighted translations (needs .venv)
bun run build:bible                  # Build SQLite database
bun run download:model               # Download & export ONNX model
bun run export:verses                # Export verses to JSON
python3 data/precompute-embeddings.py  # Precompute embeddings (GPU or ONNX fallback)
```

### Run in development

```bash
bun run tauri dev
```

In development the app reads resources directly from your working tree (`models/`, `embeddings/`, `data/`). Make sure you have run `bun run setup:all` first.

### Build for production

```bash
bun run tauri build
```

### Supported Platforms

| Platform | Architecture | Installer | Notes |
|----------|-------------|-----------|-------|
| **macOS** | Universal (Apple Silicon + Intel) | `.dmg` | Single binary for M1/M2/M3/M4 and Intel Macs. Requires macOS 11.0+ |
| **Windows** | x64 | `.msi` | 64-bit installer for Windows 10/11. Includes WebView2 bootstrapper |

### Native Offline Seeding / Air-gapped Builds

Rhema supports an internal fallback cache designed for enterprise or restrictive network environments where internet scraping or remote model downloads are blocked.

1. **Populate the Models Cache**
   Download the ONNX models (`Qwen3...`) and the Whisper model via a USB drive on an internet-connected machine. Paste the raw binaries inside `offline-cache/models/whisper/`, `offline-cache/models/qwen3-embedding-0.6b/`, and `offline-cache/models/qwen3-embedding-0.6b-int8/`. Note: Binaries inside this folder are explicitly `.gitignore`'d so they will never accidentally push to Git.
   *(All text Bible translations are already firmly committed to `offline-cache/bibles/` and require no configuration).*

2. **Trigger the Offline Pipeline**
   ```bash
   bun run setup:offline
   ```
   This command internally synchronizes the offline backups into the active production hierarchy. `setup:all` automatically bypasses web-scrapers internally when files are detected, guaranteeing zero API interactions.

### What Ships in the Installer

The CI pipeline automatically downloads and bundles these resources:

| Resource | Size | Purpose |
|----------|------|---------|
| `rhema.db` | ~103 MB | Bible database with **10 translations** (KJV, NIV, ESV, NASB, NKJV, NLT, AMP + Spanish, French, Portuguese), FTS5 full-text search, 340k+ cross-references |
| `models/whisper/` | ~394 MB | Whisper large-v3-turbo Q8 model for local speech-to-text |
| `models/qwen3-embedding-0.6b/` | ~2.4 GB | ONNX embedding model (FP32) for semantic verse search |
| `models/qwen3-embedding-0.6b-int8/` | ~571 MB | INT8 quantized embedding model (preferred on ARM/Apple Silicon) |
| `sdk/ndi/` | ~2 MB | NDI SDK for broadcast output |
| `embeddings/` | ~122 MB | Pre-computed verse embeddings for vector search |

> **Note:** The full installer is ~3.5 GB due to the bundled AI models and all Bible translations. This ensures every feature works offline out of the box with zero setup required.

### macOS First Launch

The app is **unsigned** (no Apple Developer certificate). On first launch:
1. **Right-click** the app → **Open** → click **Open** in the dialog
2. Or: System Settings → Privacy & Security → scroll down → click **Open Anyway**
3. Grant **Microphone** permission when prompted

## Project Structure

```
rhema/
├── src/                          # React frontend
│   ├── components/
│   │   ├── broadcast/            # Theme designer, NDI settings
│   │   ├── controls/             # Transport bar
│   │   ├── layout/               # Dashboard layout
│   │   ├── panels/               # Transcript, preview, live output, queue, search, detections
│   │   └── ui/                   # shadcn/ui + custom components
│   ├── hooks/                    # useAudio, useTranscription, useDetection, useBible, useBroadcast
│   ├── stores/                   # Zustand stores (audio, transcript, bible, queue, detection, broadcast, settings)
│   ├── types/                    # TypeScript type definitions
│   └── lib/                      # Context search (Fuse.js), verse renderer (Canvas 2D), builtin themes
├── src-tauri/                    # Rust backend (Tauri v2)
│   ├── crates/
│   │   ├── audio/                # Audio capture & metering (cpal)
│   │   ├── stt/                  # Deepgram STT (WebSocket + REST)
│   │   ├── bible/                # SQLite Bible DB, search, cross-references
│   │   ├── detection/            # Verse detection pipeline
│   │   │   ├── direct/           # Aho-Corasick + fuzzy reference parsing
│   │   │   └── semantic/         # ONNX embeddings, HNSW index, cloud booster, ensemble
│   │   ├── broadcast/            # NDI output (FFI)
│   │   ├── api/                  # Tauri command layer
│   │   └── notes/                # (placeholder)
│   └── tauri.conf.json
├── data/                         # Bible data pipeline
│   ├── prepare-embeddings.ts     # Unified setup orchestrator (bun run setup:all)
│   ├── lib/python-env.ts         # Shared Python venv management utilities
│   ├── download-sources.ts       # Download public domain translations + cross-refs
│   ├── download-biblegateway.py  # Download copyrighted translations (NIV, ESV, etc.)
│   ├── build-bible-db.ts         # Build SQLite DB from JSON sources
│   ├── compute-embeddings.ts     # Export verses to JSON for embedding
│   ├── precompute-embeddings.py  # Precompute embeddings (GPU auto-detect, ONNX fallback)
│   ├── download-model.ts         # Export & quantize Qwen3 ONNX model
│   ├── download-ndi-sdk.ts       # Download NDI SDK libraries
│   └── schema.sql                # Database schema
├── models/                       # ML models (gitignored)
├── embeddings/                   # Precomputed vectors (gitignored)
├── sdk/ndi/                      # NDI SDK files (downloaded)
└── build/                        # Vite build output
```

## Scripts

| Script | Description |
|---|---|
| `setup:all` | **Full setup** — runs all data/model/embedding phases (idempotent) |
| `dev` | Start Vite dev server (port 3000) |
| `build` | TypeScript check + Vite production build |
| `tauri` | Run Tauri CLI commands |
| `test` | Run Vitest tests |
| `lint` | ESLint |
| `format` | Prettier formatting |
| `typecheck` | TypeScript type checking |
| `preview` | Preview production build |
| `download:bible-data` | Download public domain Bible translations + cross-references |
| `build:bible` | Build SQLite Bible database from JSON sources |
| `download:model` | Export Qwen3-Embedding-0.6B to ONNX + quantize to INT8 |
| `export:verses` | Export KJV verses to JSON for embedding precomputation |
| `precompute:embeddings` | Precompute embeddings via Rust ONNX binary |
| `precompute:embeddings-onnx` | Precompute embeddings via Python ONNX Runtime |
| `precompute:embeddings-py` | Precompute embeddings via Python sentence-transformers |
| `quantize:model` | Quantize ONNX model to INT8 for ARM64 |
| `download:ndi-sdk` | Download NDI 6 SDK headers and platform libraries |

## Environment Variables

Create a `.env` file in the project root (optional):

| Variable | Required | Description |
|---|---|---|
| `DEEPGRAM_API_KEY` | Optional | API key for Deepgram speech-to-text (not needed if using Whisper) |
