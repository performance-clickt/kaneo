export const PYRITO_OPS_MCP_NAME = "pyrito-ops-mcp";
export const PYRITO_OPS_MCP_TITLE = "Pyrito Ops";
export const PYRITO_OPS_CODEX_SERVER_NAME = "pyrito_ops";
export const PYRITO_OPS_MCP_DESCRIPTION =
  "Plan and run projects, tasks, labels, and team operations in Pyrito Ops.";
export const PYRITO_OPS_MCP_INSTRUCTIONS =
  "Pyrito Ops is the project-management authority for workspaces, projects, tasks, labels, comments, relations, and time entries. Read current state before mutating it; use exact IDs returned by list/get tools; call list_project_columns before setting a task status; preserve user data; and report server errors faithfully. Technical compatibility identifiers are implementation details, not product naming.";

export function createPyritoOpsMcpServerInfo(baseUrl: string, version: string) {
  const origin = baseUrl.replace(/\/+$/, "");
  return {
    name: PYRITO_OPS_MCP_NAME,
    title: PYRITO_OPS_MCP_TITLE,
    version,
    description: PYRITO_OPS_MCP_DESCRIPTION,
    websiteUrl: origin,
    icons: [
      {
        src: `${origin}/favicon.svg`,
        mimeType: "image/svg+xml",
        sizes: ["any"],
      },
    ],
  };
}
