# Pyrito LLM instructions

Use `pyrito-brand.compact.json` for routine prompt injection. Use `pyrito-brand.json` when the model must reason about implementation details, and validate edits against `pyrito-brand.schema.json`.

## Authority

The JSON is the source of truth. Apply rules in this order:

1. `must_not`
2. `must`
3. `should`

When rules share a level, the narrower scope wins. Do not invent brand relationships, colors, fonts, logo variants, or exceptions.

## Recommended prompt wrapper

```text
You are creating work for Pyrito.
Treat the attached brand JSON as binding design-system context.
Follow must_not, then must, then should rules.
Use supplied brand assets by filename; do not redraw them.
Before finalizing, check the output against llm_policy.output_check.

TASK:
[insert task]

BRAND JSON:
[insert pyrito-brand.compact.json]
```

## Retrieval pattern

For a retrieval system, store the canonical JSON as one authoritative record and optionally index these sections as separate chunks:

- `identity`
- `color`
- `typography`
- `logo_application`
- `surface_lockups`
- `rules`
- `llm_policy`

Preserve rule IDs and metadata in every chunk. Retrieve `rules` and `llm_policy` for every branded task; add the relevant implementation section based on the request.

## Asset handling

Attach `pyrito-d20.svg` when the task involves the master logo or icon. For Wiki, Ops, or Design, attach the matching light or dark SVG from `assets/lockups/`; the Register asset is the lockup authority and must not be reconstructed from prose.

## Updating the system

Update `meta.version`, validate the canonical JSON, regenerate the compact JSON, and keep the human-facing guide synchronized. Do not silently change tokens or rules inside prompts.
