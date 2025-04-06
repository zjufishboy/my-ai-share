import { stdout } from "node:process";
import { startServer } from "./server";
import { apiGetWeather } from "./services/weather/api";
import * as DotEnv from "dotenv";
import { createLogTracerSteam } from "./log-trace";

DotEnv.config();

const logSteam = createLogTracerSteam();
console.log = (...args) => {
  logSteam.write(JSON.stringify(args, undefined, 2) + "\n");
};

console.log("开始启动服务器");

startServer();
