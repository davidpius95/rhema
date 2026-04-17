/**
 * restore-cache.ts
 *
 * Restores offline backup data into the active application directories.
 * This script runs locally as an optional step to prevent the setup pipeline
 * from making requests to BibleGateway, HuggingFace, etc.
 *
 * Usage:
 *   bun run scripts/restore-cache.ts
 */

import { join } from "node:path";
import { readdir, cp, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const ROOT = join(import.meta.dir, "..");
const CACHE_DIR = join(ROOT, "offline-cache");
const DATA_DIR = join(ROOT, "data");
const MODELS_DIR = join(ROOT, "models");

async function syncDir(source: string, target: string, name: string) {
  if (!existsSync(source)) {
    console.log(`  ⚠ Cache missing for ${name} [${source}]`);
    return;
  }

  const entries = await readdir(source);
  if (entries.length === 0) {
    console.log(`  ⚠ Cache empty for ${name}`);
    return;
  }
  
  await mkdir(target, { recursive: true });
  
  // Recursively copy contents
  await cp(source, target, { recursive: true });
  console.log(`  ✓ Restored ${name} to ${target}`);
}

async function main() {
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║   Rhema – Offline Cache Restore              ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  if (!existsSync(CACHE_DIR)) {
    console.log("❌ Offline cache directory not found.");
    process.exit(1);
  }

  // Restore Bible JSONs
  console.log("━━━ Restoring Bibles ━━━");
  await syncDir(
    join(CACHE_DIR, "bibles"),
    join(DATA_DIR, "sources"),
    "Bible Translations"
  );
  
  // Restore Cross References
  console.log("\n━━━ Restoring Cross References ━━━");
  await syncDir(
    join(CACHE_DIR, "cross-refs"),
    join(DATA_DIR, "cross-refs"),
    "Cross-References"
  );

  // Restore Models
  console.log("\n━━━ Restoring Local AI Models ━━━");
  await syncDir(
    join(CACHE_DIR, "models", "whisper"),
    join(MODELS_DIR, "whisper"),
    "Whisper Model"
  );

  await syncDir(
    join(CACHE_DIR, "models", "qwen3-embedding-0.6b"),
    join(MODELS_DIR, "qwen3-embedding-0.6b"),
    "Qwen3 Model (FP32)"
  );

  await syncDir(
    join(CACHE_DIR, "models", "qwen3-embedding-0.6b-int8"),
    join(MODELS_DIR, "qwen3-embedding-0.6b-int8"),
    "Qwen3 Model (INT8)"
  );
  
  console.log("\n✅ Cache restoration complete! You can now safely run: bun run setup:all\n");
}

main().catch((err) => {
  console.error("❌ Cache restore failed:", err);
  process.exit(1);
});
