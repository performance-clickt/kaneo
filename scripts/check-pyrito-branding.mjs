#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PRODUCT_NAME = "Pyrito Ops";
const BASE_BRAND_NAME = "Pyrito";
const BRAND_VERSION = "1.2.0";
const BRAND_REVISION =
  "285d84816f2a8659148a4e9e692e14fdde6242a571ccd296b424f08ed89db866";
const MASTER_MARK_REVISION =
  "b641fd94140d643ddaa451031925666b24c1fa1f8ebc87752a65c37d03c013b9";
const OPS_LIGHT_LOCKUP_REVISION =
  "1ab4f67812375cb6097233d30cba95e04fb06320d50acf676b41992295343b33";
const OPS_DARK_LOCKUP_REVISION =
  "25e99c16e411f1abf1dfff32f69e5107e1f7bb914d6ecea47dc03d169c4793f6";
const DESCRIPTION =
  "A self-hosted workspace for planning projects, managing tasks, and collaborating with your team.";
const WEB_SOURCE_EXTENSIONS = new Set([".html", ".json", ".ts", ".tsx"]);
const CUSTOMER_VISIBLE_API_FILES = [
  "apps/api/src/auth.ts",
  "apps/api/src/billing/controllers/require-entitlement.ts",
  "apps/api/src/index.ts",
  "apps/api/src/mcp/index.ts",
  "apps/api/src/mcp/tools.ts",
  "apps/api/src/notification-preferences/delivery.ts",
  "apps/api/src/plugins/discord/events.ts",
  "apps/api/src/plugins/slack/events.ts",
  "apps/api/src/plugins/telegram/events.ts",
];

const compatibilityPatterns = [
  /@kaneo\/[a-z0-9._/-]+/gi,
  /\bKANEO_(?:[A-Z0-9_]+)?/g,
  /\bX-Kaneo-[A-Za-z0-9-]+\b/g,
  /\bKaneo Cloud\b/g,
  /\bupstream Kaneo\b/gi,
  /\b(?:[a-z0-9-]+\.)*kaneo\.app\b/gi,
  /https?:\/\/[^\s"'`<>]*kaneo[^\s"'`<>]*/gi,
  /\b[A-Za-z_$][\w$]*Kaneo[\w$]*\b/g,
  /\bKaneo[A-Z][\w$]*\b/g,
  /\bkaneo[A-Z][\w$]*\b/g,
  /\bkaneo(?:[:_-][a-z0-9:_-]+)+\b/g,
  /(["'])kaneo\1/g,
  /\bPyrito Brand System\b/g,
  /\bmaster Pyrito D20 mark\b/g,
];

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function isAllowlisted(line, occurrenceIndex) {
  for (const pattern of compatibilityPatterns) {
    pattern.lastIndex = 0;
    for (const match of line.matchAll(pattern)) {
      const start = match.index;
      const end = start + match[0].length;
      if (occurrenceIndex >= start && occurrenceIndex < end) return true;
    }
  }
  return false;
}

export function scanResidualBranding(source, filename = "fixture") {
  const findings = [];
  for (const [lineIndex, line] of source.split(/\r?\n/).entries()) {
    if (/^(?:\/\/|\/\*|\*|\*\/)/.test(line.trim())) continue;
    for (const match of line.matchAll(
      /Kaneo|Clickt(?: HiveMind)?|HiveMind|\bPyrito\b(?!\s+Ops\b)/g,
    )) {
      if (!isAllowlisted(line, match.index)) {
        findings.push({
          file: filename,
          line: lineIndex + 1,
          column: match.index + 1,
          excerpt: line.trim(),
        });
      }
    }
  }
  return findings;
}

export function readPngDimensions(buffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (
    buffer.length < 24 ||
    !buffer.subarray(0, signature.length).equals(signature) ||
    buffer.toString("ascii", 12, 16) !== "IHDR"
  ) {
    throw new Error("not a PNG with an IHDR header");
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

export function readIcoDimensions(buffer) {
  if (
    buffer.length < 6 ||
    buffer.readUInt16LE(0) !== 0 ||
    buffer.readUInt16LE(2) !== 1
  ) {
    throw new Error("not a Windows icon container");
  }
  const count = buffer.readUInt16LE(4);
  if (count === 0 || buffer.length < 6 + count * 16) {
    throw new Error("truncated Windows icon directory");
  }
  return Array.from({ length: count }, (_, index) => {
    const offset = 6 + index * 16;
    return { width: buffer[offset] || 256, height: buffer[offset + 1] || 256 };
  });
}

function walkFiles(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? walkFiles(entryPath) : [entryPath];
    });
}

function assertIncludes(errors, source, expected, label) {
  if (!source.includes(expected))
    errors.push(`${label} is missing ${expected}`);
}

function assertPng(errors, publicDirectory, filename, expectedSize) {
  try {
    const dimensions = readPngDimensions(
      readFileSync(path.join(publicDirectory, filename)),
    );
    if (
      dimensions.width !== expectedSize ||
      dimensions.height !== expectedSize
    ) {
      errors.push(
        `${filename} must be ${expectedSize}x${expectedSize}, got ${dimensions.width}x${dimensions.height}`,
      );
    }
  } catch (error) {
    errors.push(`${filename}: ${error.message}`);
  }
}

function verifyBrandPackage(errors, repositoryRoot) {
  const brandDirectory = path.join(repositoryRoot, "brand/pyrito");
  const manifestPath = path.join(brandDirectory, "manifest.sha256");
  if (!existsSync(manifestPath)) {
    errors.push("brand/pyrito/manifest.sha256 is missing");
    return;
  }
  for (const line of readFileSync(manifestPath, "utf8").trim().split(/\r?\n/)) {
    const match = line.match(/^([a-f0-9]{64}) {2}(.+)$/);
    if (!match) {
      errors.push(`brand manifest has an invalid line: ${line}`);
      continue;
    }
    const filePath = path.join(brandDirectory, match[2]);
    if (!existsSync(filePath)) {
      errors.push(`brand manifest file is missing: brand/pyrito/${match[2]}`);
      continue;
    }
    const actual = sha256(readFileSync(filePath));
    if (actual !== match[1]) {
      errors.push(`brand/pyrito/${match[2]} checksum must be ${match[1]}`);
    }
  }

  const brandJson = readFileSync(
    path.join(brandDirectory, "pyrito-brand.json"),
  );
  if (sha256(brandJson) !== BRAND_REVISION) {
    errors.push(`pyrito-brand.json checksum must be ${BRAND_REVISION}`);
  }
  const brand = JSON.parse(brandJson);
  if (
    brand.identity?.name !== BASE_BRAND_NAME ||
    brand.meta?.version !== BRAND_VERSION ||
    brand.meta?.status !== "canonical" ||
    brand.surface_lockups?.assets?.ops?.light !==
      "assets/lockups/pyrito-ops-register-light.svg" ||
    brand.surface_lockups?.assets?.ops?.dark !==
      "assets/lockups/pyrito-ops-register-dark.svg"
  ) {
    errors.push(
      `brand package must declare ${BASE_BRAND_NAME} ${BRAND_VERSION} with the Ops Register assets`,
    );
  }
  const mark = readFileSync(path.join(brandDirectory, "pyrito-d20.svg"));
  if (sha256(mark) !== MASTER_MARK_REVISION) {
    errors.push(`pyrito-d20.svg checksum must be ${MASTER_MARK_REVISION}`);
  }

  for (const [asset, expectedRevision] of [
    ["assets/lockups/pyrito-ops-register-light.svg", OPS_LIGHT_LOCKUP_REVISION],
    ["assets/lockups/pyrito-ops-register-dark.svg", OPS_DARK_LOCKUP_REVISION],
  ]) {
    const actualRevision = sha256(
      readFileSync(path.join(brandDirectory, asset)),
    );
    if (actualRevision !== expectedRevision) {
      errors.push(`brand/pyrito/${asset} checksum must be ${expectedRevision}`);
    }
  }
}

function verifyLockups(errors, repositoryRoot, publicDirectory) {
  const brandDirectory = path.join(repositoryRoot, "brand/pyrito");
  for (const [logoName, sourceName, expectedRevision] of [
    [
      "logo-light.svg",
      "assets/lockups/pyrito-ops-register-light.svg",
      OPS_LIGHT_LOCKUP_REVISION,
    ],
    [
      "logo-dark.svg",
      "assets/lockups/pyrito-ops-register-dark.svg",
      OPS_DARK_LOCKUP_REVISION,
    ],
  ]) {
    const logo = readFileSync(path.join(publicDirectory, logoName));
    const canonical = readFileSync(path.join(brandDirectory, sourceName));
    if (!logo.equals(canonical) || sha256(logo) !== expectedRevision) {
      errors.push(
        `${logoName} must be byte-identical to brand/pyrito/${sourceName}`,
      );
    }
  }
}

function verifyTheme(errors, repositoryRoot) {
  const sourceRoot = path.join(repositoryRoot, "apps/web/src");
  const css = readFileSync(path.join(sourceRoot, "index.css"), "utf8");
  for (const declaration of [
    '--font-sans:\n    "Cal Sans UI",\n    ui-sans-serif,\n    system-ui,\n    sans-serif;',
    '--font-heading: "Cal Sans Heading", var(--font-sans);',
    '--font-mono:\n    "Paper Mono",\n    ui-monospace,',
    "--color-pyrito-teal: #1F7A82;",
    "--color-pyrito-ember: #F86B3C;",
    "--color-pyrito-ink: #0B0F0E;",
    "--color-pyrito-abyss: #07262B;",
    "--color-pyrito-off-white: #F4F6F5;",
    "--background: var(--color-white);",
    ".dark {",
    "--background: var(--color-pyrito-ink);",
    "--primary: var(--color-pyrito-teal);",
  ]) {
    assertIncludes(errors, css, declaration, "apps/web/src/index.css");
  }
  if (/#46E5DA/i.test(css)) {
    errors.push("Edge Cyan #46E5DA is reserved for the D20 mark, not app UI");
  }
  for (const file of walkFiles(sourceRoot).filter(
    (candidate) =>
      /\.(?:css|ts|tsx)$/.test(candidate) &&
      !/\.(?:test|spec)\./.test(candidate),
  )) {
    const source = readFileSync(file, "utf8");
    if (
      /var\(--color-(?:red|orange|yellow|green|emerald|cyan|sky|blue|indigo|violet|purple|pink|rose)-/i.test(
        source,
      )
    ) {
      errors.push(
        `${path.relative(repositoryRoot, file)} uses a non-Pyrito accent color`,
      );
    }
  }
}

function verifyMcpBranding(errors, repositoryRoot) {
  const brandingFiles = [
    "apps/api/src/mcp/branding.ts",
    "packages/mcp/src/branding.ts",
  ];
  for (const file of brandingFiles) {
    const source = readFileSync(path.join(repositoryRoot, file), "utf8");
    for (const expected of [
      'PYRITO_OPS_MCP_NAME = "pyrito-ops-mcp"',
      'PYRITO_OPS_MCP_TITLE = "Pyrito Ops"',
      ["src: `", "$", "{origin}", "/favicon.svg`"].join(""),
      'mimeType: "image/svg+xml"',
      "Pyrito Ops is the project-management authority",
    ]) {
      assertIncludes(errors, source, expected, file);
    }
  }

  for (const [file, required] of [
    [
      "apps/api/src/mcp/index.ts",
      ["createPyritoOpsMcpServerInfo", "PYRITO_OPS_MCP_INSTRUCTIONS"],
    ],
    [
      "apps/api/src/mcp/modern.ts",
      ["createPyritoOpsMcpServerInfo", "PYRITO_OPS_MCP_INSTRUCTIONS"],
    ],
    [
      "packages/mcp/src/server.ts",
      ["createPyritoOpsMcpServerInfo", "PYRITO_OPS_MCP_INSTRUCTIONS"],
    ],
    [
      "packages/mcp/src/install/index.ts",
      ['let name = "pyrito_ops"', "register Pyrito Ops"],
    ],
    [
      "packages/mcp/README.md",
      [
        "codex mcp add pyrito_ops --url https://projects.gethivemind.co/api/mcp",
        "codex mcp login pyrito_ops",
      ],
    ],
  ]) {
    const source = readFileSync(path.join(repositoryRoot, file), "utf8");
    for (const expected of required) {
      assertIncludes(errors, source, expected, file);
    }
  }
}

export function verifyPyritoBranding(repositoryRoot) {
  const errors = [];
  const webRoot = path.join(repositoryRoot, "apps/web");
  const publicDirectory = path.join(webRoot, "public");
  const brandDirectory = path.join(repositoryRoot, "brand/pyrito");
  const indexHtml = readFileSync(path.join(webRoot, "index.html"), "utf8");

  verifyBrandPackage(errors, repositoryRoot);

  for (const expected of [
    `<title>${PRODUCT_NAME}</title>`,
    `name="application-name" content="${PRODUCT_NAME}"`,
    `name="apple-mobile-web-app-title" content="${PRODUCT_NAME}"`,
    'name="theme-color" content="#0B0F0E"',
    'rel="manifest" href="/site.webmanifest"',
    'rel="icon" type="image/svg+xml" href="/favicon.svg"',
    'rel="shortcut icon" href="/favicon.ico"',
    'rel="apple-touch-icon" href="/apple-touch-icon.png"',
  ]) {
    assertIncludes(errors, indexHtml, expected, "apps/web/index.html");
  }

  for (const asset of [
    "apple-touch-icon.png",
    "favicon-96x96.png",
    "favicon.ico",
    "favicon.svg",
    "logo-dark.svg",
    "logo-light.svg",
    "site.webmanifest",
    "web-app-manifest-192x192.png",
    "web-app-manifest-512x512.png",
  ]) {
    const assetPath = path.join(publicDirectory, asset);
    if (!existsSync(assetPath) || !statSync(assetPath).isFile()) {
      errors.push(`required Pyrito asset is missing: apps/web/public/${asset}`);
    }
  }

  let manifest;
  try {
    manifest = JSON.parse(
      readFileSync(path.join(publicDirectory, "site.webmanifest"), "utf8"),
    );
  } catch (error) {
    errors.push(`site.webmanifest is not valid JSON: ${error.message}`);
  }
  if (manifest) {
    const expectedFields = {
      name: PRODUCT_NAME,
      short_name: PRODUCT_NAME,
      description: DESCRIPTION,
      id: "/",
      start_url: "/",
      scope: "/",
      display: "standalone",
      theme_color: "#0B0F0E",
      background_color: "#0B0F0E",
    };
    for (const [field, expected] of Object.entries(expectedFields)) {
      if (manifest[field] !== expected) {
        errors.push(
          `site.webmanifest ${field} must be ${JSON.stringify(expected)}`,
        );
      }
    }
    const expectedIcons = new Map([
      ["/web-app-manifest-192x192.png", "192x192"],
      ["/web-app-manifest-512x512.png", "512x512"],
    ]);
    if (!Array.isArray(manifest.icons) || manifest.icons.length !== 2) {
      errors.push("site.webmanifest must declare exactly two Pyrito icons");
    } else {
      for (const icon of manifest.icons) {
        const expectedSize = expectedIcons.get(icon.src);
        if (
          !expectedSize ||
          icon.sizes !== expectedSize ||
          icon.type !== "image/png" ||
          icon.purpose !== "any maskable"
        ) {
          errors.push(
            `site.webmanifest has an invalid icon declaration: ${JSON.stringify(icon)}`,
          );
        }
      }
    }
  }

  assertPng(errors, publicDirectory, "favicon-96x96.png", 96);
  assertPng(errors, publicDirectory, "apple-touch-icon.png", 180);
  assertPng(errors, publicDirectory, "web-app-manifest-192x192.png", 192);
  assertPng(errors, publicDirectory, "web-app-manifest-512x512.png", 512);
  try {
    const dimensions = readIcoDimensions(
      readFileSync(path.join(publicDirectory, "favicon.ico")),
    );
    const serialized = dimensions
      .map(({ width, height }) => `${width}x${height}`)
      .join(",");
    if (serialized !== "16x16,32x32,48x48") {
      errors.push(
        `favicon.ico must contain 16, 32 and 48px icons, got ${serialized}`,
      );
    }
  } catch (error) {
    errors.push(`favicon.ico: ${error.message}`);
  }

  const masterMark = readFileSync(
    path.join(brandDirectory, "pyrito-d20.svg"),
    "utf8",
  );
  const faviconSvg = readFileSync(
    path.join(publicDirectory, "favicon.svg"),
    "utf8",
  );
  if (faviconSvg !== masterMark) {
    errors.push(
      "favicon.svg must be byte-identical to the master Pyrito D20 mark",
    );
  }
  verifyLockups(errors, repositoryRoot, publicDirectory);
  verifyTheme(errors, repositoryRoot);
  verifyMcpBranding(errors, repositoryRoot);

  const sourceFiles = [
    path.join(webRoot, "index.html"),
    ...walkFiles(path.join(repositoryRoot, "i18n")).filter((file) =>
      file.endsWith(".json"),
    ),
    ...CUSTOMER_VISIBLE_API_FILES.map((file) =>
      path.join(repositoryRoot, file),
    ),
    ...walkFiles(
      path.join(repositoryRoot, "packages/email/src/templates"),
    ).filter(
      (file) =>
        file.endsWith(".tsx") && !/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(file),
    ),
    ...walkFiles(path.join(webRoot, "src")).filter(
      (file) =>
        WEB_SOURCE_EXTENSIONS.has(path.extname(file)) &&
        !/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(file) &&
        !file.endsWith("generatedRouteTree.ts"),
    ),
    path.join(publicDirectory, "site.webmanifest"),
    ...[
      "packages/mcp/package.json",
      "packages/mcp/server.json",
      "packages/mcp/README.md",
      ...walkFiles(path.join(repositoryRoot, "packages/mcp/src"))
        .filter((file) => /\.(?:ts|tsx)$/.test(file))
        .map((file) => path.relative(repositoryRoot, file)),
    ].map((file) => path.join(repositoryRoot, file)),
  ];
  for (const sourceFile of sourceFiles) {
    const relativePath = path.relative(repositoryRoot, sourceFile);
    errors.push(
      ...scanResidualBranding(
        readFileSync(sourceFile, "utf8"),
        relativePath,
      ).map(
        (finding) =>
          `${finding.file}:${finding.line}:${finding.column} has non-allowlisted legacy branding: ${finding.excerpt}`,
      ),
    );
  }

  return errors;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const repositoryRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  );
  const errors = verifyPyritoBranding(repositoryRoot);
  if (errors.length > 0) {
    console.error("Pyrito reskin verification failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log("Pyrito reskin verification passed");
  }
}
