# Rhema AI Architecture & Flow Diagram

This diagram visualizes the complete end-to-end data flow of the Rhema application, from raw audio intake to the final NDI broadcast output. It also includes the future "Rhema Global" integrations.

```mermaid
graph TD
    %% Styling
    classDef hardware fill:#2d3748,stroke:#4a5568,stroke-width:2px,color:#fff
    classDef rustCore fill:#c53030,stroke:#9b2c2c,stroke-width:2px,color:#fff
    classDef stt fill:#3182ce,stroke:#2b6cb0,stroke-width:2px,color:#fff
    classDef db fill:#805ad5,stroke:#6b46c1,stroke-width:2px,color:#fff
    classDef frontend fill:#38a169,stroke:#2f855a,stroke-width:2px,color:#fff
    classDef output fill:#dd6b20,stroke:#c05621,stroke-width:2px,color:#fff
    classDef global fill:#d69e2e,stroke:#b7791f,stroke-width:2px,color:#fff

    subgraph "1. Hardware Input"
        Mic["Microphone / Audio Mixer"]:::hardware
    end

    subgraph "2. Rust Audio Engine (Tauri Core)"
        Buffer["Audio Intake Buffer (cpal)"]:::rustCore
        VAD["Voice Activity Detection (VAD)"]:::rustCore
    end

    subgraph "3. Speech-To-Text Modules"
        Deepgram["Deepgram (Cloud WebSockets)"]:::stt
        Whisper["Whisper (Local Offline)"]:::stt
        Sherpa["Sherpa-ONNX (Local Streaming)"]:::stt
    end

    subgraph "4. Rhema Detection Pipeline & AI"
        DirectMatch["Direct Matcher (Regex/Aho-Corasick)"]:::rustCore
        QuoteMatch["Quotation Matcher (FTS5)"]:::rustCore
        VectorSearch["Semantic Embedding Model (Qwen3 ONNX)"]:::rustCore
    end

    subgraph "5. Local Databases"
        BibleDB[("SQLite Bible DB (10+ Translations)")]:::db
        VectorDB[("HNSW Vector Index (31k Verses)")]:::db
    end

    subgraph "6. React Frontend (TypeScript)"
        TranscriptUI["Transcript Control Panel"]:::frontend
        DetectionUI["Detection & Auto-Queue Logic"]:::frontend
        ThemeEditor["Theme / Canvas Renderer"]:::frontend
    end

    subgraph "7. Broadcast Output"
        NDI["NDI Network Video (Alpha Channel)"]:::output
        HDMI["HDMI Output Display"]:::output
        Mobile["Local WiFi Mobile Feed"]:::output
    end

    subgraph "Rhema Global (Future Experimental)"
        NLLB["NLLB AI (Real-time Translation)"]:::global
        XTTS["XTTS-v2 (Voice Cloning)"]:::global
        Wav2Lip["Wav2Lip (Digital Twin Matrix)"]:::global
    end

    %% Main Audio to STT Flow
    Mic -->|"Raw PCM 16kHz"| Buffer
    Buffer -->|"Continuous Float"| Sherpa
    Buffer -->|"Instant Send"| Deepgram
    Buffer -->|"Wait for Silence"| VAD
    VAD -->|"Mega Chunk Segment"| Whisper

    %% STT to Detection
    Sherpa -->|"Interim/Final Text"| DirectMatch
    Deepgram -->|"Interim/Final Text"| DirectMatch
    Whisper -->|"Final Text"| DirectMatch

    %% Detection to Database
    DirectMatch -->|"Raw Sentence"| QuoteMatch
    QuoteMatch -->|"Fuzzy Failed"| VectorSearch
    VectorSearch -->|"1,024d Vector Math"| VectorDB
    VectorDB -->|"Closest Proximity"| BibleDB
    QuoteMatch -->|"Fuzzy Match"| BibleDB

    %% Database to Frontend
    BibleDB -->|"Verse Details"| DetectionUI
    DirectMatch -->|"Interim Text"| TranscriptUI
    
    %% Frontend to Render
    DetectionUI -->|"Auto-Queued Success"| ThemeEditor
    ThemeEditor -->|"HTML5 Canvas"| HDMI
    ThemeEditor -->|"Frame Buffer Data"| NDI
    TranscriptUI -->|"WebSockets"| Mobile

    %% Global Extension Flow
    DirectMatch -.->|"English String"| NLLB
    NLLB -.->|"Arabic String"| XTTS
    Mic -.->|"5s Reference Clip"| XTTS
    XTTS -.->|"Arabic Audio Stream"| Wav2Lip
    Wav2Lip -.->|"Lip-Synced Pastor"| NDI
```
