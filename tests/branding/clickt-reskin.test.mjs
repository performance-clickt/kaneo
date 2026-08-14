import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  readIcoDimensions,
  readPngDimensions,
  scanResidualKaneo,
  verifyClicktBranding,
} from "../../scripts/check-clickt-branding.mjs";

const repositoryRoot = new URL("../../", import.meta.url);
const ciWorkflow = await readFile(
  new URL("../../.github/workflows/ci.yml", import.meta.url),
  "utf8",
);

test("the checked-in Clickt assets and metadata pass the read-only verifier", () => {
  assert.deepEqual(verifyClicktBranding(repositoryRoot.pathname), []);
});

test("a customer-visible Kaneo mutation is rejected", () => {
  assert.deepEqual(
    scanResidualKaneo("<h1>Welcome to Kaneo</h1>", "mutated-heading.tsx"),
    [
      {
        file: "mutated-heading.tsx",
        line: 1,
        column: 16,
        excerpt: "<h1>Welcome to Kaneo</h1>",
      },
    ],
  );
});

test("compatibility identifiers are classified separately from visible branding", () => {
  const compatibilityFixture = [
    'import { client } from "@kaneo/libs";',
    "const endpoint = import.meta.env.KANEO_API_URL;",
    'const storageKey = "kaneo:board-filters";',
    'const className = "kaneo-editor-shell";',
    "const node = KaneoIssueLink;",
    'const source = "https://github.com/usekaneo/kaneo";',
    'const docs = "https://kaneo.app/docs";',
    'const header = "X-Kaneo-Signature";',
    "const plan = <>Kaneo Cloud</>;",
    "// Kaneo is the upstream implementation name.",
  ].join("\n");

  assert.deepEqual(scanResidualKaneo(compatibilityFixture), []);
});

test("favicon parsers reject format mutations and report the checked-in sizes", async () => {
  assert.throws(() => readPngDimensions(Buffer.from("not a png")), /not a PNG/);
  assert.throws(
    () => readIcoDimensions(Buffer.from("not an icon")),
    /not a Windows icon/,
  );

  const publicRoot = new URL("../../apps/web/public/", import.meta.url);
  assert.deepEqual(
    readPngDimensions(await readFile(new URL("favicon-96x96.png", publicRoot))),
    { width: 96, height: 96 },
  );
  assert.deepEqual(
    readIcoDimensions(await readFile(new URL("favicon.ico", publicRoot))),
    [
      { width: 16, height: 16 },
      { width: 32, height: 32 },
      { width: 48, height: 48 },
    ],
  );
});

test("CI verifies, tests, builds, and smoke-tests the reskin without publishing", () => {
  assert.match(ciWorkflow, /run: pnpm typecheck/);
  assert.match(ciWorkflow, /run: pnpm verify:reskin/);
  assert.match(ciWorkflow, /run: pnpm test/);
  assert.match(ciWorkflow, /run: pnpm build/);
  assert.match(ciWorkflow, /file: \.\/Dockerfile\.kaneo/);
  assert.match(ciWorkflow, /load: true/);
  assert.match(ciWorkflow, /push: false/);
  assert.match(ciWorkflow, /scripts\/smoke-clickt-image\.sh/);
  assert.doesNotMatch(ciWorkflow, /^\s+push: true$/m);
  assert.doesNotMatch(ciWorkflow, /biome[^\n]*--write|pnpm lint/);
});
