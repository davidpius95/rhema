//! Bible database access for the Rhema application.
//!
//! Provides SQLite-backed storage and retrieval for Bible translations,
//! books, verses, and cross-references. Supports full-text search via
//! FTS5 and bulk verse loading for quotation matching indexes.
//!
//! # Key types
//!
//! - [`BibleDb`] — connection wrapper for the `SQLite` database
//! - [`Verse`], [`Book`], [`Translation`] — data models
//! - [`BibleError`] — error type for all database operations

pub mod crossref;
pub mod db;
pub mod error;
pub mod lookup;
pub mod models;
pub mod search;

pub use db::*;
pub use error::*;
pub use models::*;
