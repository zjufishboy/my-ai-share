import { ChatLooper } from "./chat-loop";
import { Chatter } from "./chatter";
import { apiUrl } from "./constants";
import { ConsoleLoading, getEnvValue, wrapPromise } from "./utils";

const consoleLoading = new ConsoleLoading();

export const startChat = () => {
  const looper = new ChatLooper();
  const chatter = new Chatter({
    apiKey: getEnvValue("ALI_API_KEY"),
    baseURL: apiUrl.ALIYUN,
  });
  const systemPrompt =
    // 自定义Prompt
    "你是一个日语大师，请分析我接下来每一句中文并翻译成日语，要求附带罗马音说明和语法解析";
  chatter.startNewChat({ systemPrompt });

  looper.subscribe(async (userInput) => {
    if (userInput === "end") {
      looper.stop();
      return;
    }

    const message = await wrapPromise(chatter.sendMessage(userInput), {
      before: () => {
        console.log("====================================");
        consoleLoading.start();
      },
      after: () => {
        consoleLoading.stop();
      },
    });

    console.log(message.content);
    console.log("====================================");
  });

  looper.start("请输入你的问题");
};
