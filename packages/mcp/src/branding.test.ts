import { describe, expect, it } from "vitest";
import {
  createPyritoOpsMcpServerInfo,
  PYRITO_OPS_CODEX_SERVER_NAME,
  PYRITO_OPS_MCP_DESCRIPTION,
  PYRITO_OPS_MCP_INSTRUCTIONS,
} from "./branding.js";

describe("Pyrito Ops MCP branding", () => {
  it("advertises the canonical product identity and icon", () => {
    expect(
      createPyritoOpsMcpServerInfo("https://ops.example.com/", "0.1.11"),
    ).toEqual({
      name: "pyrito-ops-mcp",
      title: "Pyrito Ops",
      version: "0.1.11",
      description: PYRITO_OPS_MCP_DESCRIPTION,
      websiteUrl: "https://ops.example.com",
      icons: [
        {
          src: "https://ops.example.com/favicon.svg",
          mimeType: "image/svg+xml",
          sizes: ["any"],
        },
      ],
    });
    expect(PYRITO_OPS_MCP_INSTRUCTIONS).toContain("Pyrito Ops");
    expect(PYRITO_OPS_CODEX_SERVER_NAME).toBe("pyrito_ops");
  });
});
