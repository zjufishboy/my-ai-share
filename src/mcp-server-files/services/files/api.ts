import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { ZodRawShape } from "zod";
import { readFs } from "./utils";

const root = path.resolve(__dirname, "../../local");

export const apiGetFiles = async () => {
  const list = await readFs(root);
  const fileTree = await Promise.all(
    list.map((p) =>
      readFile(path.resolve(root, p))
        .then((buffer) => buffer.toString())
        .then((content) => ({ path: p, content }))
    )
  );

  return {
    fileTree,
  };
};

export const schemaGetFiles: ZodRawShape = {};
