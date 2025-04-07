import OpenAI, { type ClientOptions } from "openai";
import { uniqueId } from "lodash";
import { safeJsonParse } from "./utils";

type MyMessage = OpenAI.ChatCompletionMessageParam & { messageId: string; createAt: string };
type MyMessageForAPI = OpenAI.Chat.ChatCompletionMessageParam;
export type MyTool = OpenAI.ChatCompletionTool;
export type MyToolHandler = Record<string, (params: any) => Promise<any>>;

export class Chatter {
  private openai: OpenAI;
  private commonTools: MyTool[] = [];
  private toolHandler: MyToolHandler = {};
  private localDb: {
    [chatId: string]: {
      messageIdList: string[];
      messages: {
        [messageId: string]: MyMessage;
      };
      loading: boolean;
      systemPrompt: string;
      tools?: MyTool[];
      model?: string;
      toolHandler?: MyToolHandler;
    };
  } = {};

  currentChatId: string = "";

  constructor(rawOptions: ClientOptions & { tools?: MyTool[]; toolHandler?: MyToolHandler }) {
    const { tools, toolHandler, ...options } = rawOptions;
    this.openai = new OpenAI(options);

    if (tools) {
      this.commonTools = tools;
    }
    if (toolHandler) {
      this.toolHandler = toolHandler;
    }

    this.startNewChat();
  }

  startNewChat = ({
    systemPrompt = "",
    // 默认使用v3
    model = "deepseek-v3",
    toolHandler = {},
  }: Partial<{ systemPrompt: string; model: string; toolHandler: MyToolHandler }> = {}) => {
    const currentChatId = uniqueId("ChatId_");
    this.localDb[currentChatId] ??= {
      messageIdList: [],
      messages: {},
      loading: false,
      systemPrompt,
      model,
      toolHandler,
    };
    this.currentChatId = currentChatId;
  };

  updateTools = ({ tools, chatId = this.currentChatId }: { tools: MyTool[]; chatId?: string }) => {
    this.localDb[chatId].tools = tools;
  };

  private rawSendMessage = async (chatId = this.currentChatId) => {
    const db = this.localDb[chatId];

    // 准备发请求
    const messages: MyMessageForAPI[] = db.messageIdList.map((id) => db.messages[id]);
    // 单独插入系统发言
    if (db.systemPrompt) {
      messages.unshift({ role: "system", content: [{ type: "text", text: db.systemPrompt }] });
    }

    const tools = [...this.commonTools, ...(db.tools ?? [])];

    const completion = await this.openai.chat.completions.create({
      model: db.model ?? "deepseek-r1",
      ...(tools.length > 0
        ? {
            tool_choice: "auto",
            tools,
          }
        : {}),
      messages,
    });

    // 这里就先拿结果，但其实也会返回思考过程 completion.choices[0].message.reasoning_content
    const rawMessage = completion.choices[0].message;
    const tempMessage: MyMessage[] = [
      {
        messageId: `${chatId}_${uniqueId("MessageId_")}`,
        createAt: Date.now().toString(),
        ...rawMessage,
      },
    ];
    let lastMessage = rawMessage;
    while (!!lastMessage.tool_calls) {
      // 处理所有的结果
      for (const toolCall of lastMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = safeJsonParse(toolCall.function.arguments);

        let result = null;
        const handler = this.toolHandler[toolName] ?? db.toolHandler?.[toolName];
        if (!handler) {
          result = {
            content: [{ type: "text", text: `无法调用名为${toolName}的工具，对应的工具处理器不存在` }],
          };
        } else {
          // console.log("调用工具", toolName);
          result = await handler(toolArgs);
          // console.log("工具处理结果", toolName, toolArgs, result);
        }

        const resultContent = result?.content?.[0]?.text ?? `调用名为${toolName}的工具，未返回结果`;

        // 请求前处理本地消息
        // 把所有的工具结果都依次加到临时消息里
        tempMessage.push({
          messageId: `${chatId}_${uniqueId("MessageId_")}`,
          createAt: Date.now().toString(),
          role: "tool",
          tool_call_id: toolCall.id,
          content: resultContent,
        });
      }

      //   console.log("AllMessagge=================================\n"),
      //     console.dir([...messages, ...tempMessage], { depth: 10 });
      //   console.log("\nAllMessagge================================\n");

      const completion = await this.openai.chat.completions.create({
        model: db.model ?? "deepseek-r1",
        ...(tools.length > 0
          ? {
              tool_choice: "auto",
              tools,
            }
          : {}),
        messages: [...messages, ...tempMessage],
      });

      // 这里就先拿结果，但其实也会返回思考过程 completion.choices[0].message.reasoning_content
      const rawMessage = completion.choices[0].message;
      //   console.log("带上工具结果的请求返回", rawMessage);
      tempMessage.push({
        messageId: `${chatId}_${uniqueId("MessageId_")}`,
        createAt: Date.now().toString(),
        ...rawMessage,
      });
      lastMessage = rawMessage;
    }

    return {
      rawMessage: lastMessage,
      tempMessage,
    };
  };

  sendMessage = async (text: string) => {
    const currentChatId = this.currentChatId || `ChatId_${Date.now().toString()}`;
    this.localDb[currentChatId] ??= { messageIdList: [], messages: {}, loading: false, systemPrompt: "" };
    const db = this.localDb[currentChatId];
    const isLocked = db.loading;
    if (isLocked) {
      throw new Error("ChatterError: 当前聊天的最新消息正在请求中，请稍后再重试");
    }
    db.loading = true;

    // 插入用户发言
    const userMessage: MyMessage = {
      messageId: `${currentChatId}_${uniqueId("MessageId_")}`,
      createAt: Date.now().toString(),
      role: "user",
      content: [{ type: "text", text }],
    };
    this.addMessage({ message: userMessage, chatId: currentChatId });

    const { rawMessage } = await this.rawSendMessage(currentChatId);

    // 处理工具链调用

    const newMessage: MyMessage = {
      messageId: `${currentChatId}_${uniqueId("MessageId_")}`,
      createAt: Date.now().toString(),
      ...rawMessage,
    };

    this.addMessage({ message: newMessage, chatId: currentChatId });
    db.loading = false;
    return newMessage;
  };

  private addMessage = ({ message, chatId = this.currentChatId }: { message: MyMessage; chatId?: string }) => {
    const db = this.localDb[chatId];
    if (!db) {
      throw new Error("db不存在");
    }

    db.messageIdList.push(message.messageId);
    db.messages[message.messageId] = message;
  };
}
