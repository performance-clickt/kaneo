#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const publicDirectory = path.join(repositoryRoot, "apps/web/public");
const masterPath = path.join(repositoryRoot, "brand/pyrito/pyrito-d20.svg");
const faviconPath = path.join(publicDirectory, "favicon.svg");
const master = readFileSync(masterPath, "utf8");

if (readFileSync(faviconPath, "utf8") !== master) {
  throw new Error(
    "favicon.svg must remain byte-identical to the Pyrito master mark",
  );
}

const temporaryDirectory = mkdtempSync(
  path.join(tmpdir(), "pyrito-icon-generation-"),
);

function rasterize(source, size, output) {
  execFileSync(
    "rsvg-convert",
    [
      "--width",
      String(size),
      "--height",
      String(size),
      "--output",
      output,
      source,
    ],
    { stdio: "inherit" },
  );
}

function buildIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);

  const directory = Buffer.alloc(pngs.length * 16);
  let imageOffset = header.length + directory.length;
  for (const [index, { size, data }] of pngs.entries()) {
    const offset = index * 16;
    directory[offset] = size === 256 ? 0 : size;
    directory[offset + 1] = size === 256 ? 0 : size;
    directory[offset + 2] = 0;
    directory[offset + 3] = 0;
    directory.writeUInt16LE(1, offset + 4);
    directory.writeUInt16LE(32, offset + 6);
    directory.writeUInt32LE(data.length, offset + 8);
    directory.writeUInt32LE(imageOffset, offset + 12);
    imageOffset += data.length;
  }

  return Buffer.concat([header, directory, ...pngs.map(({ data }) => data)]);
}

try {
  const maskableSource = path.join(temporaryDirectory, "maskable.svg");
  writeFileSync(
    maskableSource,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#0B0F0E"/><svg x="61.44" y="61.44" width="389.12" height="389.12" viewBox="0 0 512 512">${master.replace(/^<svg[^>]*>|<\/svg>\s*$/g, "")}</svg></svg>`,
  );

  rasterize(masterPath, 96, path.join(publicDirectory, "favicon-96x96.png"));
  rasterize(
    maskableSource,
    180,
    path.join(publicDirectory, "apple-touch-icon.png"),
  );
  rasterize(
    maskableSource,
    192,
    path.join(publicDirectory, "web-app-manifest-192x192.png"),
  );
  rasterize(
    maskableSource,
    512,
    path.join(publicDirectory, "web-app-manifest-512x512.png"),
  );

  const icoPngs = [16, 32, 48].map((size) => {
    const output = path.join(temporaryDirectory, `favicon-${size}.png`);
    rasterize(masterPath, size, output);
    return { size, data: readFileSync(output) };
  });
  writeFileSync(path.join(publicDirectory, "favicon.ico"), buildIco(icoPngs));
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

console.log(
  "Generated Pyrito Ops favicon and application icons from the master D20",
);
