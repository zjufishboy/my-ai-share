import path from "path";
import { ServerConfig } from "./super-client";

export const serverConfig: ServerConfig = {
  mcpServers: {
    weather: {
      command: "ts-node",
      args: [path.resolve(__dirname, "../mcp-server")],
    },
    localFs: {
      command: "ts-node",
      args: [path.resolve(__dirname, "../mcp-server-files")],
    },
  },
};
