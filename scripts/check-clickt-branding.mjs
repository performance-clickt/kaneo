#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PRODUCT_NAME = "Clickt HiveMind";
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
  ["package", /@kaneo\/[a-z0-9._/-]+/gi],
  ["environment", /\bKANEO_(?:[A-Z0-9_]+)?/g],
  ["header", /\bX-Kaneo-[A-Za-z0-9-]+\b/g],
  ["upstream-service", /\bKaneo Cloud\b/g],
  ["upstream-service", /\b(?:[a-z0-9-]+\.)*kaneo\.app\b/gi],
  ["url", /https?:\/\/[^\s"'`<>]*kaneo[^\s"'`<>]*/gi],
  ["internal-identifier", /\b[A-Za-z_$][\w$]*Kaneo[\w$]*\b/g],
  ["internal-identifier", /\bKaneo[A-Z][\w$]*\b/g],
  ["internal-identifier", /\bkaneo[A-Z][\w$]*\b/g],
  ["protocol", /\bkaneo(?:[:_-][a-z0-9:_-]+)+\b/g],
  ["protocol", /(["'])kaneo\1/g],
];

function matchingCompatibility(line, occurrenceIndex) {
  for (const [category, pattern] of compatibilityPatterns) {
    pattern.lastIndex = 0;
    for (const match of line.matchAll(pattern)) {
      const start = match.index;
      const end = start + match[0].length;
      if (occurrenceIndex >= start && occurrenceIndex < end) return category;
    }
  }
  return null;
}

export function scanResidualKaneo(source, filename = "fixture") {
  const findings = [];
  for (const [lineIndex, line] of source.split(/\r?\n/).entries()) {
    if (/^(?:\/\/|\/\*|\*|\*\/)/.test(line.trim())) continue;
    for (const match of line.matchAll(/kaneo/gi)) {
      const category = matchingCompatibility(line, match.index);
      if (!category) {
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
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
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
    return {
      width: buffer[offset] || 256,
      height: buffer[offset + 1] || 256,
    };
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
  const assetPath = path.join(publicDirectory, filename);
  try {
    const dimensions = readPngDimensions(readFileSync(assetPath));
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

export function verifyClicktBranding(repositoryRoot) {
  const errors = [];
  const webRoot = path.join(repositoryRoot, "apps/web");
  const publicDirectory = path.join(webRoot, "public");
  const indexHtml = readFileSync(path.join(webRoot, "index.html"), "utf8");

  for (const requiredMetadata of [
    `<title>${PRODUCT_NAME}</title>`,
    `name="application-name" content="${PRODUCT_NAME}"`,
    `name="apple-mobile-web-app-title" content="${PRODUCT_NAME}"`,
    'rel="manifest" href="/site.webmanifest"',
    'rel="icon" type="image/svg+xml" href="/favicon.svg"',
    'rel="shortcut icon" href="/favicon.ico"',
    'rel="apple-touch-icon" href="/apple-touch-icon.png"',
  ]) {
    assertIncludes(errors, indexHtml, requiredMetadata, "apps/web/index.html");
  }

  const requiredAssets = [
    "apple-touch-icon.png",
    "favicon-96x96.png",
    "favicon.ico",
    "favicon.svg",
    "logo-dark.svg",
    "logo-light.svg",
    "site.webmanifest",
    "web-app-manifest-192x192.png",
    "web-app-manifest-512x512.png",
  ];
  for (const asset of requiredAssets) {
    const assetPath = path.join(publicDirectory, asset);
    if (!existsSync(assetPath) || !statSync(assetPath).isFile()) {
      errors.push(`required Clickt asset is missing: apps/web/public/${asset}`);
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
      description:
        "Clickt's self-hosted workspace for planning projects, managing tasks, and collaborating as a team.",
      id: "/",
      start_url: "/",
      scope: "/",
      display: "standalone",
      theme_color: "#07262B",
      background_color: "#07262B",
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
      errors.push("site.webmanifest must declare exactly two Clickt icons");
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

  const faviconSvg = readFileSync(
    path.join(publicDirectory, "favicon.svg"),
    "utf8",
  );
  assertIncludes(errors, faviconSvg, 'viewBox="0 0 512 512"', "favicon.svg");
  for (const logoName of ["logo-dark.svg", "logo-light.svg"]) {
    const logo = readFileSync(path.join(publicDirectory, logoName), "utf8");
    assertIncludes(errors, logo, 'width="371" height="40"', logoName);
    assertIncludes(errors, logo, 'viewBox="0 0 371 40"', logoName);
    assertIncludes(
      errors,
      logo,
      `<title id="title">${PRODUCT_NAME}</title>`,
      logoName,
    );
  }
  if (
    readFileSync(path.join(publicDirectory, "logo-dark.svg")).equals(
      readFileSync(path.join(publicDirectory, "logo-light.svg")),
    )
  ) {
    errors.push(
      "logo-dark.svg and logo-light.svg must be distinct theme assets",
    );
  }

  const sourceFiles = [
    path.join(webRoot, "index.html"),
    path.join(repositoryRoot, "i18n/en-US.json"),
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
    ...[
      "site.webmanifest",
      "favicon.svg",
      "logo-dark.svg",
      "logo-light.svg",
    ].map((file) => path.join(publicDirectory, file)),
  ];
  for (const sourceFile of sourceFiles) {
    const relativePath = path.relative(repositoryRoot, sourceFile);
    errors.push(
      ...scanResidualKaneo(readFileSync(sourceFile, "utf8"), relativePath).map(
        (finding) =>
          `${finding.file}:${finding.line}:${finding.column} has a non-allowlisted Kaneo string: ${finding.excerpt}`,
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
  const errors = verifyClicktBranding(repositoryRoot);
  if (errors.length > 0) {
    console.error("Clickt reskin verification failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log("Clickt reskin verification passed");
  }
}
