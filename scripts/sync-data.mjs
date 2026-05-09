#!/usr/bin/env node
// Copies the source-of-truth files we need from the punk-data sibling repo
// into _data/cached/. Committing the cached copies means the LostPunks
// build is self-contained on Cloudflare Pages without needing the sibling
// available at deploy time.
//
// Re-run this whenever punk-data has fresh data:
//   npm run sync-data

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUNK_DATA = join(ROOT, "..", "punk-data", "data");
const BURNED = join(ROOT, "..", "BurnedPunks", "punks");
const CACHE = join(ROOT, "_data", "cached");

mkdirSync(CACHE, { recursive: true });

if (!existsSync(PUNK_DATA)) {
  console.error(`expected sibling repo at ${PUNK_DATA}`);
  process.exit(1);
}

function copy(src, dst) {
  writeFileSync(dst, readFileSync(src));
  console.log(`  ${src} → ${dst}`);
}

console.log("syncing from punk-data:");
copy(join(PUNK_DATA, "holders.json"), join(CACHE, "holders.json"));
copy(join(PUNK_DATA, "wallets-activity.jsonl"), join(CACHE, "wallets-activity.jsonl"));

if (existsSync(BURNED)) {
  const burnedIds = readdirSync(BURNED)
    .filter((fn) => /^\d+\.md$/.test(fn))
    .map((fn) => parseInt(fn, 10))
    .sort((a, b) => a - b);
  writeFileSync(join(CACHE, "burned-ids.json"), JSON.stringify(burnedIds) + "\n");
  console.log(`  BurnedPunks → ${join(CACHE, "burned-ids.json")} (${burnedIds.length} ids)`);
} else {
  writeFileSync(join(CACHE, "burned-ids.json"), "[]\n");
  console.warn("  BurnedPunks sibling not found; burned-ids.json = []");
}

// Stamp the moment the data was synced from punk-data — the About page reads
// this so visitors can see when the chain snapshot was last refreshed.
writeFileSync(
  join(CACHE, "synced-at.json"),
  JSON.stringify({ syncedAt: Math.floor(Date.now() / 1000) }) + "\n"
);

console.log("done.");
