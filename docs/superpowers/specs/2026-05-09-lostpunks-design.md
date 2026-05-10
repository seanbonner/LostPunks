# Lost Punks — visual design & site structure

**Date:** 2026-05-09
**Status:** Approved (initial direction; individual elements may be tweaked during implementation)

## Goal

Move Lost Punks from its current bare functional styling to a visual identity that:

1. Reads as a sibling of MuseumPunks and BurnedPunks (shared layout primitives, same family of CSS conventions, the same "punk imagery + minimal chrome" treatment).
2. Carries its own mood — quieter, more archival, expressing the "lost / dormant" theme without being colorless.
3. Restructures the site so the homepage is a quiet front door (matching the family) rather than dropping users straight into a search tool.

## Visual identity

- **Mood:** slate / archival / cold-storage. Reads as institutional records or a long-quiet vault.
- **Background:** white (`#fff`).
- **Foreground text:** black (`#000`).
- **Accent:** `#3a4a55` (deep desaturated slate-blue). Used for headings, link hover, current-page nav indicator, badges.
- **Secondary slate:** `#6b7a85` (mid slate) for muted text, status meta, the headline-stat treatment.
- **Tertiary slate:** `#cfd6db` (light slate) for borders, tile placeholders, subtle backgrounds.
- **Typography:**
  - Body / nav / paragraph: system sans-serif stack (matches MuseumPunks).
  - Logo wordmark, headline counts, numeric stats: monospace stack (matches the `result-tile` numerics already in use).
- **Punk imagery:** rendered with `image-rendering: pixelated`, default `filter: grayscale(100%); opacity: 0.6`, transitions to full color/opacity on hover. (Identical treatment to MuseumPunks.)
- **CSS conventions:** BEM class naming following the sister sites (`.site-header__logo`, `.mosaic__tile`, `.punks-result__card`, etc.). Single `style.css` file, no preprocessor.

## Logo

- Existing asset: `images/logos/lostpunks.gif` — pixel-art "LOST PUNKS" wordmark, greyscale.
- **Hover variant:** none for now. The greyscale wordmark already reads as "faded." A hover swap can be added later if a second variant is created.
- **Header use:** small static logo (max ~280px wide), like the sister sites' default + hover GIF setup but with only the default image.
- **Hero use:** large logo (max ~720px wide, capped at `88vw`) at the top of the homepage.

## Site structure

| URL | Purpose | Notes |
|---|---|---|
| `/` | Homepage. Logo hero + headline counts + 100-most-dormant mosaic + entry links to lookup / search. | Quiet front door. Matches the family pattern. |
| `/lookup/` | "Look up a punk by number." Form + result card showing V1/V2 status, holder wallet, dates. **No sliders.** | Deep-link via `/lookup/?punk=5` renders that punk's card on load. Replaces the current homepage lookup form. |
| `/search/` | "Search by dormancy thresholds." Sliders (punk-years, wallet-years), V1/V2 picker, vault filters. Returns a result grid. | Tile click → navigates to `/lookup/?punk=N`. Replaces the current homepage search form. |
| `/about/` | About page. | Existing content carries over; restyle only. |

No per-punk static permalinks. The `/lookup/?punk=N` query-string approach handles deep-linking without building 10,000 pages.

## Header & nav

Every page (including the homepage) gets the same header:

- Left: small `LOST PUNKS` logo, links to `/`.
- Right: `Look up` (`/lookup/`), `Search` (`/search/`), `About` (`/about/`).
- `aria-current="page"` styling on the active item using the slate accent.

## Homepage layout

Top-to-bottom:

1. **Header** (logo + nav, as above).
2. **Hero block.** Large logo, ~33vh-tall block matching MuseumPunks home-hero proportions. Headline immediately below: "**N** V2 punks and **M** V1 punks look lost right now (5y / 5y threshold)."
3. **Two entry-point links** (compact, restrained): `Look up a punk →` and `Search by threshold →`. Slate accent on hover.
4. **"100 most dormant" mosaic.** A 12-col grid of square tiles (matching MuseumPunks `.mosaic__grid` sizing). Tiles are the 100 V2 punks dormant the longest, ordered darkest-to-lightest by years asleep. Greyscale + faded by default; pop to color on hover. Click → `/lookup/?punk=N`.
   - Section heading above: small label (e.g. "The deepest sleepers — V2").
   - Sourced at build time from `_data/punks.js`: sort V2 holders by `lastMoveTs` ascending, exclude burned, exclude known vaults (per the same `vault: true` flag in `_data/labels.js`), take top 100.

## Lookup page (`/lookup/`)

- Header + nav.
- Centered "Look up a punk" form (number input + Go button).
- Result card area below.
  - On submit OR when `?punk=N` is present, render the same lookup card the current homepage already produces (V1/V2 token cards, holder wallet line, "PAIRED!" badge when same wallet, status pill, etc.). The PAIRED badge keeps its current handshake-icon styling — it's already in slate-compatible territory but the accent color updates to `#3a4a55`.
  - Card visual restyled to use slate accents instead of the current red.
- No sliders, no contract picker. Pure single-punk lookup.

## Search page (`/search/`)

- Header + nav.
- Intro paragraph: brief explainer of what the sliders mean (lifted from current homepage caveat).
- Form: V1/V2 radio, two slider rows (punk years, wallet years), exclude-no-outbound checkbox, include-vaulted checkbox, Search button. Same controls as today.
- Result region:
  - Summary line ("**X** V2 punks haven't moved in 5+ years…").
  - Tile grid (matches MuseumPunks `.punks-index` styling — 4 cols desktop, 3 tablet, 2 mobile).
  - Each tile links to `/lookup/?punk=N` (no longer intercepts to render inline).

## About page (`/about/`)

- Existing markdown content, no copy changes in this pass.
- Re-rendered through the new `base.njk` so it picks up the slate styling, header/nav, and footer automatically.

## Footer

- Existing pattern carries over: "Lost Punks is a project by [Sean Bonner], CC-BY 4.0. You may also enjoy [Burned Punks] and [Museum Punks]."
- Sister-site cross-links remain for now. Replacement with a `punkspunkspunks.com` hub link is a separate, later piece of work.

## Out of scope (deferred)

- Logo hover variant.
- `punkspunkspunks.com` hub site and migrating the cross-links.
- FAQ page (sister sites have one; LostPunks doesn't yet — can be added later).
- Single-punk permalinks (`/punks/N/`).
- Any data-pipeline changes (the existing `sync-data.mjs` and cached JSON stay as-is).

## Files to be added or changed

- `_includes/layouts/base.njk` — replace text logo with image logo + hover-class hooks (no hover image yet); update nav to include Look up / Search / About.
- `css/style.css` — full restyle: replace current functional CSS with the sister-site-aligned system (slate accent, BEM classes for header/footer/hero/mosaic/result-grid/lookup-card/search-form, pixelated punk imagery treatment).
- `pages/index.njk` — replace current search/lookup content with hero + entry links + most-dormant mosaic.
- `pages/lookup.njk` *(new)* — lookup form + result card; honors `?punk=N`.
- `pages/search.njk` *(new)* — slider/threshold search form + result grid.
- `pages/about.md` — no content change, picks up new layout automatically.
- `js/search.js` — split into:
  - `js/lookup.js` — single-punk render + form binding (re-using the current `renderLookup`, `tokenCard`, `statusFor`, `labelEntry` helpers).
  - `js/search.js` — threshold search + result grid render. Result tiles link to `/lookup/?punk=N` instead of intercept-and-render-inline.
- `_data/punks.js` — add a derived `topDormant.v2` array (top 100 V2 ids by lowest `lastMoveTs`, excluding burned) for the homepage mosaic.

## Acceptance

- Visiting `/` shows the slate-themed hero + headline counts + most-dormant mosaic. No forms on the homepage.
- Header/nav appears on every page and visually matches the sister-site pattern (logo on left, three nav items on right).
- `/lookup/?punk=5` deep-links to a slate-themed result card showing V1/V2 status as "Vaulted" (regression check on the labels.js fix).
- `/search/` returns a tile grid; clicking a tile navigates to `/lookup/?punk=N`.
- The site visually feels like a sibling of MuseumPunks/BurnedPunks when viewed back-to-back.
