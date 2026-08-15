import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import {
  createPyritoOpsMcpServerInfo,
  PYRITO_OPS_MCP_INSTRUCTIONS,
} from "./branding";
import { registerMcpTools, toMcpToolRegistrar } from "./tools";

/** Create a stateless MCP 2026 handler with a fresh server per request. */
export function createModernMcpHandler(
  token: string,
  apiUrl: string,
  publicUrl = apiUrl,
) {
  return createMcpHandler(
    () => {
      const server = new McpServer(
        createPyritoOpsMcpServerInfo(publicUrl, "1.0.0"),
        { instructions: PYRITO_OPS_MCP_INSTRUCTIONS },
      );
      registerMcpTools(toMcpToolRegistrar(server), apiUrl, token);
      return server;
    },
    { legacy: "reject" },
  );
}
