// Search page: threshold-based search. Result tiles link to /lookup/?punk=N.

import { loadData, YEAR_SEC, yearsAgo, imgUrl, isVaultedAddress } from "punks-lib";

const $ = (sel) => document.querySelector(sel);

function runSearch(data, { contract, punkYears, walletYears, excludeNoOutbound, includeVaulted }) {
  const now = data.builtAt;
  const punkCutoff = now - punkYears * YEAR_SEC;
  const walletCutoff = now - walletYears * YEAR_SEC;
  const burnedSet = new Set(data.burnedIds);
  const map = data.holders[contract];
  const matches = [];
  for (const idStr of Object.keys(map)) {
    const id = Number(idStr);
    if (burnedSet.has(id)) continue;
    const info = map[idStr];
    if (info.lastMoveTs > punkCutoff) continue;
    if (!includeVaulted && isVaultedAddress(data, info.holder)) continue;
    const walletTs = data.wallets[info.holder];
    if (!walletTs && excludeNoOutbound) continue;
    // Wallets with `null` lastOutbound count as "never active" → most lost.
    if (walletTs && walletTs > walletCutoff) continue;
    matches.push({ id, info, walletTs });
  }
  matches.sort((a, b) => a.id - b.id);
  return matches;
}

function renderSearchResults(data, { contract, punkYears, walletYears }, matches) {
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
      const yA = yearsAgo(m.info.lastMoveTs, data.builtAt);
      const wA = m.walletTs ? `${yearsAgo(m.walletTs, data.builtAt)}y` : "never";
      return `
        <a class="result-tile" href="/lookup/?punk=${m.id}">
          <img class="result-tile__img" src="${imgUrl(m.id)}" alt="Punk #${m.id}" loading="lazy" width="120" height="120">
          <span class="result-tile__id">#${m.id}</span>
          <span class="result-tile__meta">moved ${yA}y ago · wallet ${wA}</span>
        </a>
      `;
    })
    .join("");
  out.innerHTML = `${summary}<div class="result-grid">${grid}</div>`;
}

// Per-contract max age (in whole years) derived from earliest first-move.
// V2 max stays ~constant (single airdrop date); V1 spans the claim window.
function maxYearsForContract(data, contract) {
  const map = data.holders[contract];
  let earliest = Infinity;
  for (const idStr of Object.keys(map)) {
    const ts = map[idStr].firstMoveTs;
    if (ts != null && ts < earliest) earliest = ts;
  }
  if (!Number.isFinite(earliest)) return null;
  return Math.floor((data.builtAt - earliest) / YEAR_SEC);
}

function setSliderMax(slider, output, max) {
  slider.max = String(max);
  if (Number(slider.value) > max) {
    slider.value = String(max);
    output.textContent = `${slider.value} years`;
  }
}

function syncSliderRange(data) {
  const contract = $("input[name='contract']:checked").value;
  const max = maxYearsForContract(data, contract);
  if (max == null) return;
  setSliderMax($("#punk-years"), $("#punk-years-out"), max);
  setSliderMax($("#wallet-years"), $("#wallet-years-out"), max);
}

async function main() {
  const data = await loadData();

  for (const which of ["punk", "wallet"]) {
    const slider = $(`#${which}-years`);
    const out = $(`#${which}-years-out`);
    slider.addEventListener("input", () => {
      out.textContent = `${slider.value} years`;
    });
  }

  for (const radio of document.querySelectorAll("input[name='contract']")) {
    radio.addEventListener("change", () => syncSliderRange(data));
  }
  syncSliderRange(data);

  $("#search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const contract = $("input[name='contract']:checked").value;
    const punkYears = parseInt($("#punk-years").value, 10);
    const walletYears = parseInt($("#wallet-years").value, 10);
    const excludeNoOutbound = $("#exclude-no-outbound").checked;
    const includeVaulted = $("#include-vaulted").checked;
    const matches = runSearch(data, { contract, punkYears, walletYears, excludeNoOutbound, includeVaulted });
    renderSearchResults(data, { contract, punkYears, walletYears }, matches);
  });
}

main().catch((err) => {
  console.error(err);
  document.querySelector("main").insertAdjacentHTML(
    "afterbegin",
    `<p class="error">Failed to load Lost Punks data: ${err.message}</p>`
  );
});
