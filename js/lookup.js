// Lookup page: single-punk render, form binding, deep-link via ?punk=N.

import { loadData, imgUrl, tokenCard } from "/js/lib.js";

const $ = (sel) => document.querySelector(sel);

function renderLookup(data, id) {
  const out = $("#lookup-result");
  if (!Number.isInteger(id) || id < 0 || id > 9999) {
    out.hidden = false;
    out.innerHTML = `<p class="error">Punk number must be between 0 and 9999.</p>`;
    return;
  }
  const v1 = data.holders.v1[id];
  const v2 = data.holders.v2[id];
  const v1Wallet = v1 ? data.wallets[v1.holder] : null;
  const v2Wallet = v2 ? data.wallets[v2.holder] : null;
  const burned = data.burnedIds.includes(id);
  const sameWallet = v1 && v2 && v1.holder === v2.holder;

  // V2 view link sits in the V2 token card: cryptopunks.app when unwrapped,
  // OpenSea (WrappedPunk collection) when wrapped.
  const v2View = v2
    ? v2.wrapped
      ? `<p class="token-card__view"><a href="${SITE.openseaItemBase}${SITE.v2WrappedContract}/${id}" rel="noopener" target="_blank">View on OpenSea →</a></p>`
      : `<p class="token-card__view"><a href="${SITE.cryptopunksDetailsBase}${id}" rel="noopener" target="_blank">View on cryptopunks.app →</a></p>`
    : "";

  // V1 view links: `os` switches contract by wrap state (V1 wrapper when
  // wrapped, the broken June 9 contract when not); pm and v1c take the raw id.
  const v1OsContract = v1 && v1.wrapped ? SITE.v1WrappedContract : SITE.v1UnwrappedContract;
  const v1View = v1
    ? `<p class="token-card__view">View on <span class="v1links">[<a href="${SITE.openseaItemBase}${v1OsContract}/${id}" rel="noopener" target="_blank">os</a> | <a href="${SITE.punksMarketBase}${id}" rel="noopener" target="_blank">pm</a> | <a href="${SITE.v1cryptopunksBase}${id}" rel="noopener" target="_blank">v1c</a>]</span></p>`
    : "";

  out.hidden = false;
  out.innerHTML = `
    <article class="punk-card">
      <header class="punk-card__head">
        <img class="punk-card__img" src="${imgUrl(id)}" alt="CryptoPunk #${id}" width="240" height="240">
        <div>
          <h3>Punk #${id}</h3>
          ${sameWallet ? `<p class="same-wallet"><span class="paired-badge"><span class="paired-badge__icon" aria-hidden="true">🤝</span>PAIRED!</span> V1 and V2 are held by the same wallet.</p>` : ""}
        </div>
      </header>
      <div class="punk-card__tokens">
        ${tokenCard(data, "V2 token", v2, v2Wallet, data.builtAt, { burned, verb: "airdropped", viewLinks: v2View })}
        ${tokenCard(data, "V1 token", v1, v1Wallet, data.builtAt, { burned: false, verb: "claimed", viewLinks: v1View })}
      </div>
    </article>
  `;
  out.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function main() {
  const data = await loadData();

  $("#lookup-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = parseInt($("#lookup-id").value, 10);
    history.replaceState(null, "", `?punk=${id}`);
    renderLookup(data, id);
  });

  const params = new URLSearchParams(location.search);
  const punkParam = params.get("punk");
  if (punkParam !== null) {
    const id = parseInt(punkParam, 10);
    if (Number.isInteger(id) && id >= 0 && id <= 9999) {
      $("#lookup-id").value = id;
      renderLookup(data, id);
    }
  }
}

main().catch((err) => {
  console.error(err);
  document.querySelector("main").insertAdjacentHTML(
    "afterbegin",
    `<p class="error">Failed to load Lost Punks data: ${err.message}</p>`
  );
});
