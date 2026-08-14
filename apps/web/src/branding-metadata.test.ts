import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveRuntimeBrandingMetadata } from "./runtime-branding-metadata";

const webRoot = process.cwd();
const indexHtml = readFileSync(path.join(webRoot, "index.html"), "utf8");
const appSidebar = readFileSync(
  path.join(webRoot, "src/components/app-sidebar.tsx"),
  "utf8",
);
const manifest = JSON.parse(
  readFileSync(path.join(webRoot, "public/site.webmanifest"), "utf8"),
) as {
  name: string;
  short_name: string;
  theme_color: string;
  background_color: string;
  icons: Array<{ src: string; sizes: string; purpose: string }>;
};

afterEach(() => {
  document.head.innerHTML = "";
});

describe("Clickt HiveMind web metadata", () => {
  it("uses relative root URLs as the intentional deployment-neutral boundary", () => {
    expect(indexHtml).toContain("<title>Clickt HiveMind</title>");
    expect(indexHtml).toContain(
      '<link rel="canonical" href="/" data-origin-path="/" vite-ignore>',
    );
    expect(indexHtml).toContain(
      '<meta property="og:url" content="/" data-origin-path="/" vite-ignore>',
    );
    expect(indexHtml).toContain(
      '<meta name="twitter:url" content="/" data-origin-path="/" vite-ignore>',
    );
    expect(indexHtml).toContain(
      'content="/web-app-manifest-512x512.png" data-origin-path="/web-app-manifest-512x512.png" vite-ignore',
    );
    expect(indexHtml).toContain(
      '<script type="module" src="/src/runtime-branding-metadata.ts"></script>',
    );
    expect(indexHtml).not.toMatch(/assets\.kaneo\.app|plausible\.kaneo\.app/);
    expect(indexHtml).not.toContain("https://kaneo.app");
  });

  it("resolves canonical and social paths against the current deployment", () => {
    document.head.innerHTML = `
      <link rel="canonical" href="" data-origin-path="/">
      <meta property="og:url" content="" data-origin-path="/">
      <meta property="og:image" content="" data-origin-path="/web-app-manifest-512x512.png">
    `;

    resolveRuntimeBrandingMetadata(document);

    expect(
      document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href,
    ).toBe(`${window.location.origin}/`);
    expect(
      document.querySelector<HTMLMetaElement>('meta[property="og:url"]')
        ?.content,
    ).toBe(`${window.location.origin}/`);
    expect(
      document.querySelector<HTMLMetaElement>('meta[property="og:image"]')
        ?.content,
    ).toBe(`${window.location.origin}/web-app-manifest-512x512.png`);
  });

  it("ships a branded install manifest whose declared assets exist", () => {
    expect(manifest).toMatchObject({
      name: "Clickt HiveMind",
      short_name: "Clickt HiveMind",
      theme_color: "#07262B",
      background_color: "#07262B",
    });

    for (const icon of manifest.icons) {
      expect(icon.purpose).toBe("any maskable");
      expect(() =>
        readFileSync(path.join(webRoot, "public", icon.src.replace(/^\//, ""))),
      ).not.toThrow();
    }
  });

  it("keeps the full sidebar lockup bounded in the off-canvas navigation", () => {
    expect(appSidebar).toContain('collapsible="offcanvas"');
    expect(appSidebar).toContain("compactOnCollapsed");
    expect(appSidebar).toContain('imageClassName="h-5"');
  });
});
