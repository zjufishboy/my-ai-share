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
    const init = [..."............"];
    init[this.tick] = "*";
    // console.log(init.join(""));
    process.stdout.write("\r" + init.join(""));
  };

  start() {
    this.printLoading();
    this.ticker = globalThis.setInterval(() => {
      this.tick = (this.tick + 1) % 12;
      this.printLoading();
    }, 200);
  }

  stop() {
    this.ticker && clearInterval(this.ticker);
    // console.log("");
    process.stdout.write("\r");
  }
}

export const getEnvValue = (key: string): string => {
  if (!process.env[key]) {
    throw new Error("环境参数缺失：" + key);
  }
  return process.env[key];
};

export const safeJsonParse = (jsonStr: string) => {
  let result = {};
  try {
    result = JSON.parse(jsonStr);
  } catch (e) {
    result = {};
  }
  return result;
};
