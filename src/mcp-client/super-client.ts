import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport, StdioServerParameters } from "@modelcontextprotocol/sdk/client/stdio.js";
import { MyTool } from "../ai-chat-demo/chatter";

export interface ServerConfig {
  mcpServers: {
    [serverName: string]: StdioServerParameters;
  };
}

export class SuperClient {
  private allSevers: string[] = [];
  private instanceMap: Record<
    string,
    { client: Client; transport: StdioClientTransport; config: StdioServerParameters; tools?: MyTool[] }
  > = {};

  async connect(serverConfig: ServerConfig) {
    const serverIds = Object.keys(serverConfig.mcpServers);
    this.allSevers.push(...serverIds);

    for (const id of serverIds) {
      const client = new Client({ name: id, version: "1.0.0" });
      const config = serverConfig.mcpServers[id];
      const transport = new StdioClientTransport(config);
      this.instanceMap[id] = {
        client,
        transport,
        config,
      };
    }

    await Promise.all(
      serverIds.map(async (id) => {
        const config = this.instanceMap[id];
        await config.client.connect(config.transport);
      })
    );
  }

  async listTools(): ReturnType<Client["listTools"]> {
    const toolLists = await Promise.all(this.allSevers.map((id) => this.instanceMap[id].client.listTools()));

    this.allSevers.forEach((id, index) => {
      this.instanceMap[id].tools = toolLists[index].tools.map((tool) => ({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        },
      }));
    });

    return toolLists.reduce(
      (pre, cur) => {
        return {
          tools: [...pre.tools, ...cur.tools],
        };
      },
      { tools: [] }
    );
  }

  async callTool(...args: Parameters<Client["callTool"]>): ReturnType<Client["callTool"]> {
    const { name: toolName } = args[0];
    const server = this.allSevers.find((id) => this.instanceMap[id].tools?.some((t) => t.function.name === toolName));
    if (!server) {
      return {
        content: [{ type: "text", text: `没有找到名为${toolName}的工具` }],
      };
    }
    const client = this.instanceMap[server].client;
    return client.callTool(...args);
  }
}
