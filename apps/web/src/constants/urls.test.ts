import { describe, expect, it } from "vitest";
import {
  PRODUCT_NAME,
  SOURCE_REPOSITORY_URL,
  UPSTREAM_CHANGELOG_URL,
  UPSTREAM_DEPLOYMENT_GUIDE_URL,
} from "./urls";

describe("branding URLs", () => {
  it("uses Clickt branding and the Clickt fork for source CTAs", () => {
    expect(PRODUCT_NAME).toBe("Clickt HiveMind");
    expect(SOURCE_REPOSITORY_URL).toBe(
      "https://github.com/performance-clickt/kaneo",
    );
  });

  it("keeps functionality-owned documentation and changelog links upstream", () => {
    expect(UPSTREAM_CHANGELOG_URL).toBe(
      "https://github.com/usekaneo/kaneo/blob/main/CHANGELOG.md",
    );
    expect(UPSTREAM_DEPLOYMENT_GUIDE_URL).toBe("https://kaneo.app/docs");
  });
});
