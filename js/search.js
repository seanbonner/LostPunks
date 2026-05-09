// Lost Punks client-side: lookup + search.
// Loads /punks.json once, then handles two forms.

const YEAR_SEC = 365.25 * 86400;

let DATA = null;

const $ = (sel) => document.querySelector(sel);

function shortAddr(a) {
  if (!a) return "";
  return a.length > 10 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

function fmtDate(ts) {
  if (!ts) return null;
  const d = new Date(ts * 1000);
  return d.toISOString().slice(0, 10);
}

function yearsAgo(ts, now) {
  if (!ts) return null;
  return ((now - ts) / YEAR_SEC).toFixed(1);
}

function imgUrl(id, opts = {}) {
  const params = new URLSearchParams({ transparent: "true", bg: opts.bg || "ffffff" });
  return `${SITE.imageBase}${id}/image?${params}`;
}

// Normalize a labels.js entry to { label, vault }. Entries can be either a
// plain string ("Yuga Labs") or an object ({ label, vault: true }).
function labelEntry(addr) {
  if (!addr) return null;
  const raw = DATA.labels?.[addr.toLowerCase()];
  if (!raw) return null;
  if (typeof raw === "string") return { label: raw, vault: false };
  return { label: raw.label, vault: !!raw.vault };
}

function isVaultedAddress(addr) {
  return labelEntry(addr)?.vault === true;
}

function walletLine(addr, walletTs, now) {
  if (!addr) return "";
  const ya = yearsAgo(walletTs, now);
  const detail = walletTs
    ? `last outbound ${fmtDate(walletTs)} (${ya} years ago)`
    : `no outbound transactions ever`;
  const link = `${SITE.etherscanAddressBase}${addr}`;
  const entry = labelEntry(addr);
  const display = entry
    ? `<strong>${entry.label}</strong> (${shortAddr(addr)})`
    : shortAddr(addr);
  return `In wallet <a href="${link}" rel="noopener" target="_blank">${display}</a> — ${detail}`;
}

// Status precedence: Burned > Vaulted > wallet-activity tiers.
// Wallet-activity tiers: Active <2y outbound, Inactive 2-5y, Possibly Lost 5y+
// or never. Vault overrides "Possibly Lost" because vault wallets are
// designed to never sign outbound transactions.
function statusFor(addr, walletTs, now, { burned } = {}) {
  if (burned) return { label: "Burned", cls: "status--burned" };
  if (isVaultedAddress(addr)) return { label: "Vaulted", cls: "status--vaulted" };
  const years = walletTs ? (now - walletTs) / YEAR_SEC : Infinity;
  if (years < 2) return { label: "Active", cls: "status--active" };
  if (years < 5) return { label: "Inactive", cls: "status--inactive" };
  return { label: "Possibly Lost", cls: "status--lost" };
}

// "Never moved since [verb] [date]" when lastMoveTs equals firstMoveTs.
// verbBy: v1 → "claimed", v2 → "airdropped". Falls back to "last moved" line
// for older data without firstMoveTs.
function moveLine(info, verbBy) {
  const moved = info.firstMoveTs != null && info.lastMoveTs > info.firstMoveTs;
  if (info.firstMoveTs != null && !moved) {
    return `Never moved since ${verbBy} ${fmtDate(info.firstMoveTs)}.`;
  }
  const movedYa = yearsAgo(info.lastMoveTs, DATA.builtAt);
  return `Last moved ${fmtDate(info.lastMoveTs)} (${movedYa} years ago).`;
}

function tokenCard(label, info, walletTs, now, opts = {}) {
  if (!info) {
    return `<div class="token-card token-card--missing"><h4>${label}</h4><p>No record on this contract.</p></div>`;
  }
  const wrapStatus = info.wrapped ? "Wrapped" : "Unwrapped";
  const status = statusFor(info.holder, walletTs, now, { burned: opts.burned });
  const burnedNote = opts.burned
    ? `<p class="burned-note">This punk is in the <a href="${SITE.burnedPunksUrl}" rel="noopener" target="_blank">Burned Punks</a> registry.</p>`
    : "";
  return `
    <div class="token-card">
      <h4>${label} <span class="status-badge ${status.cls}">${status.label}</span></h4>
      <p class="token-card__status">${wrapStatus}</p>
      <p>${moveLine(info, opts.verb || "moved")}</p>
      <p>${walletLine(info.holder, walletTs, now)}.</p>
      ${burnedNote}
    </div>
  `;
}

function renderLookup(id) {
  const out = $("#lookup-result");
  if (!Number.isInteger(id) || id < 0 || id > 9999) {
    out.hidden = false;
    out.innerHTML = `<p class="error">Punk number must be between 0 and 9999.</p>`;
    return;
  }
  const v1 = DATA.holders.v1[id];
  const v2 = DATA.holders.v2[id];
  const v1Wallet = v1 ? DATA.wallets[v1.holder] : null;
  const v2Wallet = v2 ? DATA.wallets[v2.holder] : null;
  const burned = DATA.burnedIds.includes(id);
  const sameWallet = v1 && v2 && v1.holder === v2.holder;
  const cpAccount = v2?.holder ? `${SITE.cryptopunksAccountBase}${v2.holder}` : null;
  const cpDetails = `${SITE.cryptopunksDetailsBase}${id}`;

  out.hidden = false;
  out.innerHTML = `
    <article class="punk-card">
      <header class="punk-card__head">
        <img class="punk-card__img" src="${imgUrl(id)}" alt="CryptoPunk #${id}" width="240" height="240">
        <div>
          <h3>Punk #${id}</h3>
          <p><a href="${cpDetails}" rel="noopener" target="_blank">View on cryptopunks.app →</a></p>
          ${sameWallet ? `<p class="same-wallet"><span class="paired-badge"><span class="paired-badge__icon" aria-hidden="true">🤝</span>PAIRED!</span> V1 and V2 are held by the same wallet.</p>` : ""}
        </div>
      </header>
      <div class="punk-card__tokens">
        ${tokenCard("V2 token", v2, v2Wallet, DATA.builtAt, { burned, verb: "airdropped" })}
        ${tokenCard("V1 token", v1, v1Wallet, DATA.builtAt, { burned: false, verb: "claimed" })}
      </div>
    </article>
  `;
  // Scroll into view for mobile.
  out.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function runSearch({ contract, punkYears, walletYears, excludeNoOutbound, includeVaulted }) {
  const now = DATA.builtAt;
  const punkCutoff = now - punkYears * YEAR_SEC;
  const walletCutoff = now - walletYears * YEAR_SEC;
  const burnedSet = new Set(DATA.burnedIds);
  const map = DATA.holders[contract];
  const matches = [];
  for (const idStr of Object.keys(map)) {
    const id = Number(idStr);
    if (burnedSet.has(id)) continue;
    const info = map[idStr];
    if (info.lastMoveTs > punkCutoff) continue;
    if (!includeVaulted && isVaultedAddress(info.holder)) continue;
    const walletTs = DATA.wallets[info.holder];
    if (!walletTs && excludeNoOutbound) continue;
    // Wallets with `null` lastOutbound count as "never active" → most lost.
    if (walletTs && walletTs > walletCutoff) continue;
    matches.push({ id, info, walletTs });
  }
  matches.sort((a, b) => a.id - b.id);
  return matches;
}

function renderSearchResults({ contract, punkYears, walletYears }, matches) {
  const out = $("#search-result");
  out.hidden = false;
  if (matches.length === 0) {
    out.innerHTML = `<p>No punks match those thresholds. Try lowering one of the sliders.</p>`;
    return;
  }
  const summary = `
    <p class="search-summary">
      <strong>${matches.length}</strong> ${contract.toUpperCase()} punks haven&rsquo;t moved in ${punkYears}+ years
      and are held in wallets with no outbound activity in ${walletYears}+ years.
    </p>
  `;
  const grid = matches
    .map((m) => {
      const yA = yearsAgo(m.info.lastMoveTs, DATA.builtAt);
      const wA = m.walletTs ? `${yearsAgo(m.walletTs, DATA.builtAt)}y` : "never";
      return `
        <a class="result-tile" href="?punk=${m.id}#lookup-form" data-punk="${m.id}">
          <img class="result-tile__img" src="${imgUrl(m.id)}" alt="Punk #${m.id}" loading="lazy" width="80" height="80">
          <span class="result-tile__id">#${m.id}</span>
          <span class="result-tile__meta">moved ${yA}y ago<br>wallet ${wA}</span>
        </a>
      `;
    })
    .join("");
  out.innerHTML = `${summary}<div class="result-grid">${grid}</div>`;
}

// Per-contract max age in (whole) years, derived from the earliest first-move
// across that contract's punks. V2 max stays ~constant (single airdrop date);
// V1 spans the claim window. Without firstMoveTs, falls back to the slider's
// existing max attribute.
function maxYearsForContract(contract) {
  const map = DATA.holders[contract];
  let earliest = Infinity;
  for (const idStr of Object.keys(map)) {
    const ts = map[idStr].firstMoveTs;
    if (ts != null && ts < earliest) earliest = ts;
  }
  if (!Number.isFinite(earliest)) return null;
  return Math.floor((DATA.builtAt - earliest) / YEAR_SEC);
}

function setSliderMax(slider, output, max) {
  slider.max = String(max);
  if (Number(slider.value) > max) {
    slider.value = String(max);
    output.textContent = `${slider.value} years`;
  }
}

function syncSliderRange() {
  const contract = $("input[name='contract']:checked").value;
  const max = maxYearsForContract(contract);
  if (max == null) return;
  setSliderMax($("#punk-years"), $("#punk-years-out"), max);
  setSliderMax($("#wallet-years"), $("#wallet-years-out"), max);
}

function bindForms() {
  $("#lookup-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = parseInt($("#lookup-id").value, 10);
    renderLookup(id);
  });

  // Live slider readouts
  for (const which of ["punk", "wallet"]) {
    const slider = $(`#${which}-years`);
    const out = $(`#${which}-years-out`);
    slider.addEventListener("input", () => {
      out.textContent = `${slider.value} years`;
    });
  }

  // Re-cap sliders when contract changes
  for (const radio of document.querySelectorAll("input[name='contract']")) {
    radio.addEventListener("change", syncSliderRange);
  }
  syncSliderRange();

  $("#search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const contract = $("input[name='contract']:checked").value;
    const punkYears = parseInt($("#punk-years").value, 10);
    const walletYears = parseInt($("#wallet-years").value, 10);
    const excludeNoOutbound = $("#exclude-no-outbound").checked;
    const includeVaulted = $("#include-vaulted").checked;
    const matches = runSearch({ contract, punkYears, walletYears, excludeNoOutbound, includeVaulted });
    renderSearchResults({ contract, punkYears, walletYears }, matches);
  });

  // Result tiles intercept-and-do-lookup-without-leaving-page
  $("#search-result").addEventListener("click", (e) => {
    const tile = e.target.closest(".result-tile");
    if (!tile) return;
    e.preventDefault();
    const id = parseInt(tile.dataset.punk, 10);
    $("#lookup-id").value = id;
    renderLookup(id);
  });

  // Deep-link support: ?punk=N triggers lookup on load
  const params = new URLSearchParams(location.search);
  const punkParam = params.get("punk");
  if (punkParam !== null) {
    const id = parseInt(punkParam, 10);
    if (Number.isInteger(id) && id >= 0 && id <= 9999) {
      $("#lookup-id").value = id;
      renderLookup(id);
    }
  }
}

async function main() {
  const res = await fetch("/punks.json");
  DATA = await res.json();
  bindForms();
}

main().catch((err) => {
  console.error(err);
  document.querySelector("main").insertAdjacentHTML(
    "afterbegin",
    `<p class="error">Failed to load Lost Punks data: ${err.message}</p>`
  );
});
