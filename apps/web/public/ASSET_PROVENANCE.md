# Pyrito Ops brand asset provenance

## Canonical source

- Brand guide: <https://wiki.gethivemind.co/p/32/pyrito-brand-system>
- Pyrito Brand System for LLMs v1.2.0 manifest — SHA-256 `aa5dbadd411d518e04be338549b70a0d7e5942105b87334d5b1a5dd57b0733a7`
- Canonical `pyrito-brand.json` — SHA-256 `285d84816f2a8659148a4e9e692e14fdde6242a571ccd296b424f08ed89db866`
- Master `pyrito-d20.svg` — SHA-256 `b641fd94140d643ddaa451031925666b24c1fa1f8ebc87752a65c37d03c013b9`
- Canonical Ops light lockup — SHA-256 `1ab4f67812375cb6097233d30cba95e04fb06320d50acf676b41992295343b33`
- Canonical Ops dark lockup — SHA-256 `25e99c16e411f1abf1dfff32f69e5107e1f7bb914d6ecea47dc03d169c4793f6`

The validated source package is vendored unchanged in `brand/pyrito/`. Its
`manifest.sha256` remains the integrity authority. The D20 geometry and colors
must not be redrawn, recolored, distorted, cropped, or given effects.

## Output derivation

| Output | Derivation |
| --- | --- |
| `favicon.svg` | Byte-identical copy of the supplied master `pyrito-d20.svg`. |
| `logo-light.svg` | Byte-identical copy of the supplied `pyrito-ops-register-light.svg` for white/light surfaces. |
| `logo-dark.svg` | Byte-identical copy of the supplied `pyrito-ops-register-dark.svg` for Ink/Abyss surfaces. |
| `favicon.ico` | ICO container holding 16px, 32px, and 48px PNG rasterizations of the unchanged master D20. |
| `favicon-96x96.png` | Transparent 96px rasterization of the unchanged master D20. |
| `apple-touch-icon.png` | Master D20 centered at 76% on an Ink canvas. |
| `web-app-manifest-192x192.png` | Master D20 centered at 76% on an Ink maskable canvas. |
| `web-app-manifest-512x512.png` | The same maskable construction rasterized at 512px. |

`scripts/generate-pyrito-icons.mjs` reproduces the raster and ICO outputs with
`rsvg-convert`. It refuses to run unless `favicon.svg` remains byte-identical
to the vendored master.

The existing Cal Sans UI, Cal Sans Heading, and Paper Mono webfont files are
retained from the upstream Kaneo distribution; KR-11 does not introduce or
redistribute a new font source. The documented system fallbacks remain active.
