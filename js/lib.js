// Shared client-side helpers for Lost Punks lookup + search pages.

export const YEAR_SEC = 365.25 * 86400;

let DATA_PROMISE = null;

export async function loadData() {
  if (!DATA_PROMISE) {
    DATA_PROMISE = fetch("/punks.json").then((r) => r.json());
  }
  return DATA_PROMISE;
}

export function shortAddr(a) {
  if (!a) return "";
  return a.length > 10 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

export function fmtDate(ts) {
  if (!ts) return null;
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

export function yearsAgo(ts, now) {
  if (!ts) return null;
  return ((now - ts) / YEAR_SEC).toFixed(1);
}

export function imgUrl(id, opts = {}) {
  const params = new URLSearchParams({ transparent: "true", bg: opts.bg || "ffffff" });
  return `${SITE.imageBase}${id}/image?${params}`;
}

// labels.js entries can be a plain string ("Yuga Labs") or an object
// ({ label, vault: true }). Normalize to { label, vault }.
export function labelEntry(data, addr) {
  if (!addr) return null;
  const raw = data.labels?.[addr.toLowerCase()];
  if (!raw) return null;
  if (typeof raw === "string") return { label: raw, vault: false };
  return { label: raw.label, vault: !!raw.vault };
}

export function isVaultedAddress(data, addr) {
  return labelEntry(data, addr)?.vault === true;
}

export function walletLine(data, addr, walletTs, now) {
  if (!addr) return "";
  const ya = yearsAgo(walletTs, now);
  const detail = walletTs
    ? `last outbound ${fmtDate(walletTs)} (${ya} years ago)`
    : `no outbound transactions ever`;
  const link = `${SITE.evmNowAddressBase}${addr}`;
  const entry = labelEntry(data, addr);
  const display = entry
    ? `<strong>${entry.label}</strong> (${shortAddr(addr)})`
    : shortAddr(addr);
  return `In wallet <a href="${link}" rel="noopener" target="_blank">${display}</a> — ${detail}`;
}

// Status precedence: Burned > Vaulted > wallet-activity tiers (Active <2y,
// Inactive 2-5y, Possibly Lost 5y+ or never). Vault overrides "Possibly Lost"
// because vault wallets are designed never to sign outbound transactions.
export function statusFor(data, addr, walletTs, now, { burned } = {}) {
  if (burned) return { label: "Burned", cls: "status--burned" };
  if (isVaultedAddress(data, addr)) return { label: "Vaulted", cls: "status--vaulted" };
  const years = walletTs ? (now - walletTs) / YEAR_SEC : Infinity;
  if (years < 2) return { label: "Active", cls: "status--active" };
  if (years < 5) return { label: "Inactive", cls: "status--inactive" };
  return { label: "Possibly Lost", cls: "status--lost" };
}

// "Never moved since [verb] [date]" when lastMoveTs equals firstMoveTs.
// Fallback to "Last moved" line for older data without firstMoveTs.
export function moveLine(info, verbBy, builtAt) {
  const moved = info.firstMoveTs != null && info.lastMoveTs > info.firstMoveTs;
  if (info.firstMoveTs != null && !moved) {
    return `Never moved since ${verbBy} ${fmtDate(info.firstMoveTs)}.`;
  }
  const movedYa = yearsAgo(info.lastMoveTs, builtAt);
  return `Last moved ${fmtDate(info.lastMoveTs)} (${movedYa} years ago).`;
}

export function tokenCard(data, label, info, walletTs, now, opts = {}) {
  if (!info) {
    return `<div class="token-card token-card--missing"><h4>${label}</h4><p>No record on this contract.</p></div>`;
  }
  const wrapStatus = info.wrapped ? "Wrapped" : "Unwrapped";
  const status = statusFor(data, info.holder, walletTs, now, { burned: opts.burned });
  const burnedNote = opts.burned
    ? `<p class="burned-note">This punk is in the <a href="${SITE.burnedPunksUrl}" rel="noopener" target="_blank">Burned Punks</a> registry.</p>`
    : "";
  return `
    <div class="token-card">
      <h4>${label} <span class="status-badge ${status.cls}">${status.label}</span></h4>
      <p class="token-card__status">${wrapStatus}</p>
      ${opts.viewLinks || ""}
      <p>${moveLine(info, opts.verb || "moved", data.builtAt)}</p>
      <p>${walletLine(data, info.holder, walletTs, now)}.</p>
      ${burnedNote}
    </div>
  `;
}
