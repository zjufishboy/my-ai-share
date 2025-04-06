import { Interface, createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

type ChatCallback = (message: string) => Promise<void>;

export class ChatLooper {
  private cbs: ChatCallback[] = [];
  private rl: Interface;
  private ask: string = "";
  private isContinue = true;
  constructor() {
    this.rl = createInterface({
      input: stdin,
      output: stdout,
    });
  }

  subscribe(cb: ChatCallback) {
    this.cbs.push(cb);

    return () => {
      this.unsubscribe(cb);
    };
  }

  unsubscribe(cb: ChatCallback) {
    this.cbs = this.cbs.filter((i) => i !== cb);
  }

  async start(ask: string) {
    this.isContinue = true;
    this.ask = ask.endsWith("\n") ? ask : ask + "\n";
    while (true) {
      const answer = await this.rl.question(this.ask);
      // 订阅是否应该并发处理？
      for (const cb of this.cbs) {
        await cb(answer);
        // 订阅过程中把rl关了
        if (!this.isContinue) {
          break;
        }
      }

      if (!this.isContinue) {
        break;
      }
    }
    this.rl.close();
  }

  stop() {
    this.isContinue = false;
  }
}
