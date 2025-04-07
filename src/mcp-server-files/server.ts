import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTool, toolGetFiles } from "./tool";

export const startServer = async () => {
  // 本地stdio通信
  const transport = new StdioServerTransport();
  const server = new McpServer({
    name: "localFs",
    version: "1.0.0",
  });

  // 注册工具
  registerTool(server, [toolGetFiles]);

  server.connect(transport);
};
