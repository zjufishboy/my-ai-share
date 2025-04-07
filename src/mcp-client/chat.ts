import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { ChatLooper } from "../ai-chat-demo/chat-loop";
import { Chatter, MyTool, MyToolHandler } from "../ai-chat-demo/chatter";
import { ConsoleLoading, getEnvValue, wrapPromise } from "../ai-chat-demo/utils";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";
import { apiUrl, modelName } from "../ai-chat-demo/constants";
import { stdout } from "node:process";
import { SuperClient } from "./super-client";
import { serverConfig } from "./config";

const consoleLoading = new ConsoleLoading();

export const startChat = async () => {
  // 初始化mcpClient
  const mcpClient = new SuperClient();

  mcpClient.connect(serverConfig);

  const toolsResult = await mcpClient.listTools();

  // 说实话 anthropic 自己的格式有点夹带私货了,但改改也能通
  const tools: MyTool[] = toolsResult.tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    },
  }));

  // 工具处理中心，你甚至可以在这里注入假的工具
  const toolHandler: MyToolHandler = tools.reduce((pre, cur) => {
    return {
      ...pre,
      [cur.function.name]: (params: any) => {
        return mcpClient.callTool({ name: cur.function.name, arguments: params });
      },
    };
  }, {});

  console.log(
    "目前可用的工具列表：",
    "\n" + tools.map(({ function: { name, description } }) => `- ${name} (${description})`).join("\n")
  );

  const chatter = new Chatter({
    // 阿里云官网的deepseek模型不支持函数调用
    // apiKey: getEnvValue("ALI_API_KEY"),
    // baseURL: apiUrl.ALIYUN,
    apiKey: getEnvValue("DEEPSEEK_API_KEY"),
    baseURL: apiUrl.DEEPSEEK,
    tools,
    toolHandler,
  });

  // chatLoop
  const looper = new ChatLooper();

  looper.subscribe(async (userInput) => {
    // 开启一个新对话，单对话模式
    // TODO 实现单对话模式的接口封装，并自动清理历史记录
    chatter.startNewChat({
      model: modelName.DEEPSEEK.DeepseekChat,
      // model: modelName.ALIYUN.DeepseekV3,
    });

    const tickBefore = Date.now();
    const message = await wrapPromise(chatter.sendMessage(userInput), {
      before: () => {
        console.log("====================================");
        consoleLoading.start();
      },
      after: () => {
        consoleLoading.stop();
        console.log("cost:", Date.now() - tickBefore, "ms");
      },
    });

    // console.dir(message, { depth: 10 });
    console.log(message.content);
    console.log("====================================");
  });

  looper.start("请输入你的问题");
};
