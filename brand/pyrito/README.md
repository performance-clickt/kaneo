# Pyrito Brand System for LLMs

Version 1.2.0 — canonical machine-readable companion to the Pyrito standalone brand guide.

## Start here

- `pyrito-brand.compact.json` — smallest prompt-ready context; use this for most LLM tasks.
- `pyrito-brand.json` — complete canonical brand system.
- `pyrito-brand.schema.json` — JSON Schema for validation and tooling.
- `PYRITO-LLM-INSTRUCTIONS.md` — prompt wrapper and retrieval guidance.
- `pyrito-tokens.css` — implementation-ready CSS variables and font roles.
- `pyrito-d20.svg` — master D20 mark; use this asset rather than recreating it.
- `assets/lockups/` — approved Register SVGs for Wiki, Ops, and Design on light and dark surfaces.
- `manifest.sha256` — integrity hashes for the package contents.

## Typical use

Attach the compact JSON plus the asset needed for the task. Use the supplied Register SVG whenever work is surface-specific. For design or development work, also attach the CSS tokens. For an agent or retrieval pipeline, load the canonical JSON and enforce the `rules` array by severity.

## Validation

The canonical JSON targets JSON Schema Draft 2020-12. Validate it whenever tokens, rules, or identity details change, then regenerate the compact file and integrity manifest.
