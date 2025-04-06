export const wrapPromise = async <T>(
  promise: Promise<T>,
  options: {
    before: () => void;
    after: () => void;
  }
) => {
  options.before();
  const res = await promise;
  options.after();
  return res;
};

export class ConsoleLoading {
  private tick = 0;
  private ticker: any;
  private printLoading = () => {
    const init = [..."......"];
    init[this.tick] = "*";
    process.stdout.write("\r" + init.join(""));
  };

  start() {
    this.printLoading();
    this.ticker = globalThis.setInterval(() => {
      this.tick = (this.tick + 1) % 6;
      this.printLoading();
    }, 1000);
  }

  stop() {
    this.ticker && clearInterval(this.ticker);
    process.stdout.write("\r");
  }
}

export const getEnvValue = (key: string): string => {
  if (!process.env[key]) {
    throw new Error("环境参数缺失：" + key);
  }
  return process.env[key];
};
