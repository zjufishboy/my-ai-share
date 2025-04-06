import OpenAI, { type ClientOptions } from "openai";
import { uniqueId } from "lodash";

type MyMessage = OpenAI.ChatCompletionMessageParam & { messageId: string; createAt: string };
type MyMessageForAPI = OpenAI.Chat.ChatCompletionMessageParam;

export class Chatter {
  openai: OpenAI;
  localDb: {
    [chatId: string]: {
      messageIdList: string[];
      messages: {
        [messageId: string]: MyMessage;
      };
      loading: boolean;
      systemPrompt: string;
    };
  } = {};

  currentChatId: string = "";

  constructor(options: ClientOptions) {
    this.openai = new OpenAI(options);
    this.startNewChat("");
  }

  startNewChat = (systemPrompt: string) => {
    const currentChatId = uniqueId("ChatId_");
    this.localDb[currentChatId] ??= { messageIdList: [], messages: {}, loading: false, systemPrompt };
    this.currentChatId = currentChatId;
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

    // 准备发请求
    const messages: MyMessageForAPI[] = db.messageIdList.map((id) => db.messages[id]);
    // 单独插入系统发言
    if (db.systemPrompt) {
      messages.unshift({ role: "system", content: [{ type: "text", text: db.systemPrompt }] });
    }

    const completion = await this.openai.chat.completions.create({
      model: "deepseek-r1",
      messages,
    });

    // 这里就先拿结果，但其实也会返回思考过程 completion.choices[0].message.reasoning_content
    const rawMessage = completion.choices[0].message;
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
