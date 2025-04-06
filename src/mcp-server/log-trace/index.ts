import { createWriteStream } from "node:fs";
import path from "node:path";

export const createLogTracerSteam = () => {
  const date = new Date();
  date.getDate();

  return createWriteStream(
    path.resolve(
      __dirname,
      `${date.getFullYear()}_${date.getMonth()}_${date.getDate()}_${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}.log`
    ),
    {
      flags: "a",
    }
  );
};
