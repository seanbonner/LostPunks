---
layout: layouts/base.njk
title: About
permalink: /about/
---

# About Lost Punks

Lost Punks lets you ask: *which CryptoPunks are sitting in wallets that look like nobody&rsquo;s home?*

Rather than declaring any individual punk lost, the site lets you set your own thresholds and shows what fits. A punk is considered lost in this view when **both** are true:

1. The punk hasn&rsquo;t moved on the chain in N+ years.
2. The wallet currently holding it hasn&rsquo;t signed an outbound Ethereum transaction in M+ years.

Lost Punks indexes both contracts. The V1 contract (where claims happened in June 2017) was effectively dormant until a wrapper made V1 punks tradeable in 2022, so V1 has a much higher dormancy rate than V2. You can search either independently, and any individual punk lookup shows V1 and V2 status side by side.

## What this isn&rsquo;t

- **It&rsquo;s not a claim that any specific punk is lost forever.** A wallet that&rsquo;s been silent for 8 years could still be operated by someone who simply hasn&rsquo;t needed to move anything.
- **It doesn&rsquo;t count punks already known to be burned.** Those live at [Burned Punks]({{ site.burnedPunksUrl }}) and are excluded from results here.
- **It only knows about Ethereum activity.** A wallet&rsquo;s last outbound transaction is the strongest signal we have without inferring intent.

## How fresh is the data?

The on-chain snapshot was last refreshed on **{{ punks.syncedAtDisplay or "an earlier build" }}**.

Data refreshes happen automatically once a month, and Sean can also trigger a refresh manually any time. A monthly cadence is intentional: the dynamics here are slow. Active wallets tend to stay active and inactive wallets tend to stay inactive &mdash; a wallet doesn&rsquo;t flip from &ldquo;moves punks weekly&rdquo; to &ldquo;silent for five years&rdquo; overnight. The events that actually change a punk&rsquo;s status here are rare wake-ups of long-dormant wallets, and catching those within a month is plenty.

## Credits

Built by [Sean Bonner](http://seanbonner.com/). Punk imagery from the [CryptoPunks marketplace](https://cryptopunks.app/). Sister projects: [Burned Punks]({{ site.burnedPunksUrl }}) and [Museum Punks]({{ site.museumPunksUrl }}).
