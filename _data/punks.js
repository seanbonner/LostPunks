// Build-time data prep. Reads the cached snapshot copied in by sync-data.mjs
// and produces the compact bundle the client-side JS will fetch as
// /punks.json. Keeping this as Eleventy `_data` makes the bundle available
// inside templates too (e.g. for the homepage's headline counts).

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import labels from "./labels.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE = join(__dirname, "cached");

function isVaultedAddr(addr) {
  if (!addr) return false;
  const e = labels[addr.toLowerCase()];
  return typeof e === "object" && e?.vault === true;
}

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

  // Top V2 punks dormant the longest, excluding burned and known vaults.
  // Used for the homepage mosaic. Sized to fill 9 rows even on very wide
  // viewports (~40 cols at 4K → 360 tiles); CSS clips to 9 rows so the
  // overflow tiles never display.
  const v2Candidates = [];
  for (const idStr of Object.keys(holders.v2)) {
    const id = Number(idStr);
    if (burnedIds.has(id)) continue;
    const info = holders.v2[idStr];
    if (isVaultedAddr(info.holder)) continue;
    v2Candidates.push({ id, lastMoveTs: info.lastMoveTs });
  }
  v2Candidates.sort((a, b) => a.lastMoveTs - b.lastMoveTs);
  const topDormant = { v2: v2Candidates.slice(0, 360).map((p) => p.id) };

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
    topDormant,
  };
}
