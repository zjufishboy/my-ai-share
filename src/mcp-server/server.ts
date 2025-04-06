import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTool, toolGetDate, toolGetTodayWeather } from "./tool";

export const startServer = async () => {
  // 本地stdio通信
  const transport = new StdioServerTransport();
  const server = new McpServer({
    name: "weather",
    version: "1.0.0",
  });

  // 注册工具
  registerTool(server, [toolGetTodayWeather, toolGetDate]);

  server.connect(transport);
};
