//! Real-time Bible verse detection for the Rhema application.
//!
//! Combines direct pattern matching and semantic vector search into a
//! unified pipeline that identifies Bible references in sermon transcripts.
//!
//! # Key types
//!
//! - [`DetectionPipeline`] — orchestrates all detection strategies
//! - [`DirectDetector`] — regex and Aho-Corasick pattern matching
//! - [`SemanticDetector`] — ONNX embedding and vector similarity search
//! - [`Detection`], [`VerseRef`] — detection results
//!
//! # Feature flags
//!
//! - `onnx` — enables ONNX Runtime for local embedding inference
//! - `vector-search` — enables HNSW vector index for similarity search

pub mod context;
pub mod direct;
pub mod error;
pub mod merger;
pub mod pipeline;
<<<<<<< HEAD
pub mod quotation;
pub mod reading_mode;
pub mod semantic;
pub mod sentence_buffer;
pub mod types;
=======
pub mod sentence_buffer;
pub mod reading_mode;
>>>>>>> upstream/main

pub use context::SermonContext;
pub use direct::detector::DirectDetector;
<<<<<<< HEAD
pub use error::*;
pub use merger::{DetectionMerger, MergedDetection};
pub use pipeline::DetectionPipeline;
pub use quotation::QuotationMatcher;
pub use reading_mode::{ChapterChange, ReadingAdvance, ReadingMode};
pub use semantic::cloud::CloudBooster;
pub use semantic::detector::SemanticDetector;
pub use sentence_buffer::SentenceBuffer;
pub use types::*;
=======
pub use semantic::detector::SemanticDetector;
pub use merger::{DetectionMerger, MergedDetection};
pub use pipeline::DetectionPipeline;
pub use sentence_buffer::SentenceBuffer;
pub use reading_mode::{ReadingMode, ReadingAdvance, ChapterChange};
>>>>>>> upstream/main

#[cfg(feature = "onnx")]
pub use semantic::onnx_embedder::OnnxEmbedder;

#[cfg(feature = "vector-search")]
pub use semantic::hnsw_index::HnswVectorIndex;
