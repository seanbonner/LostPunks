// Build-time data prep. Reads the cached snapshot copied in by sync-data.mjs
// and produces the compact bundle the client-side JS will fetch as
// /punks.json. Keeping this as Eleventy `_data` makes the bundle available
// inside templates too (e.g. for the homepage's headline counts).

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE = join(__dirname, "cached");

export default function () {
  const holders = JSON.parse(readFileSync(join(CACHE, "holders.json"), "utf8"));
  const burnedIds = new Set(JSON.parse(readFileSync(join(CACHE, "burned-ids.json"), "utf8")));
  let syncedAt = null;
  try {
    syncedAt = JSON.parse(readFileSync(join(CACHE, "synced-at.json"), "utf8")).syncedAt;
  } catch {
    // Pre-existing builds without the stamp file — fall back to null.
  }

  const wallets = {};
  for (const line of readFileSync(join(CACHE, "wallets-activity.jsonl"), "utf8").split("\n")) {
    if (!line) continue;
    const r = JSON.parse(line);
    wallets[r.address] = r.lastOutboundTs ?? null;
  }

  const builtAt = Math.floor(Date.now() / 1000);

  // Headline counts at the default 5y/5y threshold for the homepage.
  const FIVE_YEARS_AGO = builtAt - 5 * 365.25 * 86400;
  const lostAt5y5y = { v1: 0, v2: 0 };
  for (const c of ["v1", "v2"]) {
    for (const id of Object.keys(holders[c])) {
      const h = holders[c][id];
      if (burnedIds.has(Number(id))) continue;
      const walletTs = wallets[h.holder];
      const walletAge = walletTs ?? 0; // null treated as never → very old
      if (h.lastMoveTs <= FIVE_YEARS_AGO && walletAge <= FIVE_YEARS_AGO) {
        lostAt5y5y[c]++;
      }
    }
  }

  const syncedAtDisplay = syncedAt
    ? new Date(syncedAt * 1000).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return {
    builtAt,
    syncedAt,
    syncedAtDisplay,
    holders,
    wallets,
    burnedIds: [...burnedIds].sort((a, b) => a - b),
    lostAt5y5y,
  };
}
