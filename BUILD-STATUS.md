# BUILD-STATUS — news-image-20261120

Title suggestion: **The World Today: A Declaration, Then the Missiles**

Repo: https://github.com/Endangdanngz/world-news-20261120
Competition: https://make.fun/bounty/news-image-20261120 — "Sum up 20 November's world news in one image"

## Winning image

A broadsheet front page ("THE WORLD TODAY", Friday, 20 November 2026, No. 12,849) built around an engraved two-panel editorial illustration: above, three statesmen sign a declaration at the Shenzhen summit; below, a river capital's bridges under a missile barrage, one bridge broken. A second, smaller engraving shows a twisted skyscraper struck by missiles over Riyadh's desert financial district. The art was generated text-free, then the whole page — masthead, headlines, standfirst, rail stories, caption and an In Brief band — was typeset programmatically (Python/PIL, Noto Serif) so every letter is exact. Composition script: `../news-image-20261120-candidates/build_page.py`.

Stories carried (verified facts supplied for 20 November 2026; nothing invented):

- Lead: Hours after Presidents Trump, Xi and Putin issued a joint "peace declaration" following their first three-way summit in Shenzhen, Russia launched one of the war's heaviest overnight barrages on Kyiv: at least 100 missiles and some 400 drones; at least eight people killed and 28 injured; three of Kyiv's bridges damaged; power knocked out in several regions as temperatures drop below zero; residents sheltered in metro stations.
- Markets: Global markets plunge on AI bubble fears despite Anthropic's record Nasdaq debut the day before: Japan's Nikkei fell 4.8%, Taiwan's market plunged more than 2,200 points intraday, the S&P 500 lost about 2% for a fifth straight down day, gold fell.
- COP31: The Antalya talks reached their final day divided, after the latest draft text dropped the call to phase out fossil fuels.
- Riyadh: A Houthi missile damaged the Public Investment Fund tower in Riyadh's financial district; Saudi air defences engaged drones and missiles.
- In Brief: Kenya discharged its last Ebola patient, 37 days after its first case. The United States lost the measles elimination status it had held since 2000. A tanker caught fire after striking a mine east of the Strait of Hormuz; the Pentagon put the cost of the Iran war at $48.3 billion. Britain pledged over 1,000 drones for Ukraine in a £260 million package. The EU said it would summon Russia's envoy over damage to an embassy in Kyiv. Dozens are missing after a migrant boat capsized off Senegal.

## Format verification

- Dimensions: 1024×1024 px
- Bytes: 363755 (≤ 1,048,576)
- Format: JPEG bytes under the name entry.png (first 3 bytes ffd8ff), quality 88, decodes cleanly with PIL as JPEG
- sha256: 0349ccda9581e3d6ca9f4810bdf9b7e583e9c7e70cd62a31f9488a6fa352b5f2

## Verification runs (final main.ts)

```
$ MAKEFUN_OUTPUT_DIR=/tmp/out1 node main.ts
entry.png: 363755 bytes sha256 0349ccda9581e3d6ca9f4810bdf9b7e583e9c7e70cd62a31f9488a6fa352b5f2 -> /tmp/out1/entry.png
$ MAKEFUN_OUTPUT_DIR=/tmp/out2 node main.ts
entry.png: 363755 bytes sha256 0349ccda9581e3d6ca9f4810bdf9b7e583e9c7e70cd62a31f9488a6fa352b5f2 -> /tmp/out2/entry.png
```

Both outputs byte-identical to the bundled entry.png (cmp OK, sha256 equal).
