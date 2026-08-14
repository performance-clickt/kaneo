# Clickt HiveMind brand asset provenance

## Supplied sources

- `d20-favicon-pack.zip` — SHA-256 `cd545780c61ff2932d2b72f76ae5fc321668c29128bad6496bf96d510ea888d0`
  - `d20-flat.svg` — SHA-256 `98133c87c63c9102f33b940fae01273167bbad63638fd0a68743d2d09b2d54c6`
  - `d20-flat-bold.svg` — SHA-256 `785b3b58b523c55f34135e016938d87d8e760a7606b9ca81ea90f03535b09395`
- `Clickt Division Logo Lockups (standalone) (1).html` — SHA-256 `d749a9ce9fad1c22736b290f04cc0b02f084f679ea877380c8606f901d60f4fc`
  - Embedded Inter Latin WOFF2 (`26b22360-1620-4b3f-a3be-db2771cb6877`) — SHA-256 `c940764593d0fe5d596be327ca7558855e018039fb78509aa21921fd3644c3e4`

## Output derivation

| Output | Derivation |
| --- | --- |
| `logo-dark.svg` | Horizontal Clickt HiveMind light-surface lockup. Inter Black 900 and Medium 500 glyphs were converted to SVG paths. Colors and spacing follow the supplied HiveMind horizontal lockup: HiveMind 700/500, Ink, and the 28% separator. |
| `logo-light.svg` | Horizontal Clickt HiveMind dark-surface lockup. The same outlined geometry uses HiveMind 500/300, Offwhite, and the 28% separator. |
| `favicon.svg` | Exact supplied `d20-flat-bold.svg`, selected for legibility at the browser's 16px slot. |
| `favicon.ico` | ICO container assembled from the supplied 16px bold PNG plus detailed 32px and 48px flat PNGs. |
| `favicon-96x96.png` | 96px rasterization of the supplied detailed `d20-flat.svg`. |
| `apple-touch-icon.png` | Exact supplied 180px Apple touch icon on its solid Ink ground. |
| `web-app-manifest-192x192.png` | Maskable D20 on a solid HiveMind 900 ground; detailed D20 master centered at 76% scale. |
| `web-app-manifest-512x512.png` | Same maskable construction rasterized at 512px. |

The 76% maskable treatment keeps the complete D20 inside the platform-safe central circle. All SVG lockup lettering is outlined, so no local or remote font is required at runtime.
