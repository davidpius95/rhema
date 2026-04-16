use std::collections::HashSet;

use rusqlite::Connection;

use crate::db::BibleDb;
use crate::error::BibleError;
use crate::models::{Book, Verse};

/// A verse with its BM25 relevance rank from FTS5 full-text search.
/// Deduplicated across translations — one entry per unique verse reference.
pub struct Bm25Result {
    /// BM25 rank (negative; more negative = more relevant).
    pub rank: f64,
    pub book_number: i32,
    pub book_name: String,
    pub chapter: i32,
    pub verse: i32,
}

// ── FTS5 query builders ─────────────────────────────────────────────

/// Exact phrase match — wraps entire input in double quotes.
/// `"Follow peace with all men"` matches only verses containing that exact sequence.
fn build_phrase_query(input: &str) -> String {
    let cleaned: String = input
        .chars()
        .filter(|c| c.is_alphanumeric() || c.is_whitespace() || *c == '\'')
        .collect();
    let trimmed = cleaned.trim();
    if trimmed.is_empty() {
        return String::new();
    }
    format!("\"{trimmed}\"")
}

// ── SQL runner ──────────────────────────────────────────────────────

/// Execute a BM25-ranked FTS5 query across all English translations.
#[expect(
    clippy::cast_possible_wrap,
    reason = "limit is a small page-size value that fits in i64"
)]
fn run_fts_query(
    conn: &Connection,
    fts_query: &str,
    limit: usize,
) -> Result<Vec<Bm25Result>, BibleError> {
    if fts_query.is_empty() {
        return Ok(vec![]);
    }
    let mut stmt = conn.prepare(
        "SELECT bm25(verses_fts) as rank, v.book_number, v.book_name, v.chapter, v.verse \
         FROM verses_fts fts \
         JOIN verses v ON v.rowid = fts.rowid \
         JOIN translations t ON v.translation_id = t.id \
         WHERE fts.text MATCH ?1 AND t.language = 'en' \
         ORDER BY rank \
         LIMIT ?2",
    )?;
    let rows = stmt.query_map(
        rusqlite::params![fts_query, limit as i64],
        |row: &rusqlite::Row| {
            Ok(Bm25Result {
                rank: row.get(0)?,
                book_number: row.get(1)?,
                book_name: row.get(2)?,
                chapter: row.get(3)?,
                verse: row.get(4)?,
            })
        },
    )?;
    rows.collect::<Result<Vec<_>, _>>().map_err(BibleError::from)
}

/// Deduplicate results by (`book_number`, chapter, verse), keeping first occurrence.
fn dedup_results(results: Vec<Bm25Result>, limit: usize) -> Vec<Bm25Result> {
    let mut seen = HashSet::new();
    results
        .into_iter()
        .filter(|r| seen.insert((r.book_number, r.chapter, r.verse)))
        .take(limit)
        .collect()
}

// ── BibleDb methods ─────────────────────────────────────────────────

impl BibleDb {
    /// # Panics
    ///
    /// Panics if the internal mutex is poisoned (i.e., a thread panicked
    /// while holding the database lock).
    pub fn search_verses(
        &self,
        query: &str,
        translation_id: i64,
        limit: usize,
    ) -> Result<Vec<Verse>, BibleError> {
        let conn = self.conn.lock().map_err(|e| BibleError::Internal(e.to_string()))?;
        let mut stmt = conn.prepare(
            "SELECT v.id, v.translation_id, v.book_number, v.book_name, v.book_abbreviation, v.chapter, v.verse, v.text \
             FROM verses_fts fts \
             JOIN verses v ON v.rowid = fts.rowid \
             WHERE fts.text MATCH ?1 AND v.translation_id = ?2 \
             LIMIT ?3",
        )?;
        #[expect(
            clippy::cast_possible_wrap,
            reason = "limit is a small page-size value that fits in i64"
        )]
        let limit_i64 = limit as i64;
        let rows = stmt.query_map(
            rusqlite::params![query, translation_id, limit_i64],
            |row: &rusqlite::Row| {
                Ok(Verse {
                    id: row.get(0)?,
                    translation_id: row.get(1)?,
                    book_number: row.get(2)?,
                    book_name: row.get(3)?,
                    book_abbreviation: row.get(4)?,
                    chapter: row.get(5)?,
                    verse: row.get(6)?,
                    text: row.get(7)?,
                })
            },
        )?;
        Ok(rows.collect::<Result<Vec<_>, _>>()?)
    }

    /// Search verses using FTS5 with BM25 ranking across all English translations.
    ///
    /// Uses exact phrase matching — catches quoted scripture with high precision.
    /// AND/OR tiers were removed: they added 200-1300ms for noisy results
    /// (common words matching random verses). ONNX semantic detection handles
    /// paraphrase/reworded detection instead.
    ///
    /// Results are deduplicated by verse reference across translations.
    pub fn search_verses_bm25(
        &self,
        query: &str,
        limit: usize,
    ) -> Result<Vec<Bm25Result>, BibleError> {
        let conn = self.conn.lock().map_err(|e| BibleError::Internal(e.to_string()))?;
        let fetch_limit = limit * 4;

        let phrase = build_phrase_query(query);
        log::info!("[FTS5-BM25] Phrase: {phrase:?}");
        let all_results = run_fts_query(&conn, &phrase, fetch_limit)?;

        let results = dedup_results(all_results, limit);
        log::info!("[FTS5-BM25] Found {} unique verses", results.len());
        Ok(results)
    }

    pub fn search_books(&self, query: &str) -> Result<Vec<Book>, BibleError> {
        let conn = self.conn.lock().map_err(|e| BibleError::Internal(e.to_string()))?;
        let pattern = format!("{query}%");
        let mut stmt = conn.prepare(
            "SELECT id, translation_id, book_number, name, abbreviation, testament \
             FROM books \
             WHERE name LIKE ?1 OR abbreviation LIKE ?1 \
             ORDER BY book_number",
        )?;
        let rows = stmt.query_map(rusqlite::params![pattern], |row: &rusqlite::Row| {
            Ok(Book {
                id: row.get(0)?,
                translation_id: row.get(1)?,
                book_number: row.get(2)?,
                name: row.get(3)?,
                abbreviation: row.get(4)?,
                testament: row.get(5)?,
            })
        })?;
        Ok(rows.collect::<Result<Vec<_>, _>>()?)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn phrase_query_wraps_input() {
        assert_eq!(
            build_phrase_query("Follow peace with all men"),
            "\"Follow peace with all men\""
        );
    }

    #[test]
    fn phrase_query_strips_special_chars() {
        assert_eq!(
            build_phrase_query("God's love* NEAR/2"),
            "\"God's love NEAR2\""
        );
    }

    #[test]
    fn phrase_query_empty() {
        assert_eq!(build_phrase_query(""), String::new());
    }
}
