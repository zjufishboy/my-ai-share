import type { McpServer, ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { apiGetFiles, schemaGetFiles } from "./services/files/api";

type ToolInstance = {
  name: string;
  description: string;
} & (
  | {
      cb: ToolCallback;
      schema?: undefined;
    }
  | {
      schema: Parameters<McpServer["tool"]>[2];
      cb: ToolCallback<Parameters<McpServer["tool"]>[2]>;
    }
);

export const registerTool = (server: McpServer, tools: ToolInstance[]) => {
  tools.forEach((t) => {
    if (t.schema) {
      server.tool(t.name, t.description, t.schema, t.cb);
    } else {
      server.tool(t.name, t.description, t.cb);
    }
  });
};

export const toolGetFiles: ToolInstance = {
  name: "get-local-files",
  description: "获取本地文件信息",
  schema: schemaGetFiles,
  cb: async ({}) => {
    const { fileTree } = await apiGetFiles();
    return {
      content: [
        {
          type: "text",
          text: [
            "## 当前项目里有如下文件",
            ...fileTree.map((node) => [`### ${node.path}`, `\`\`\``, node.content, `\`\`\``].join("\n")),
          ].join("\n"),
        },
      ],
    };
  },
};
