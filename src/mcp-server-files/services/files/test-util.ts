import path from "node:path";
import { readFs } from "./utils";
import { readFile } from "node:fs/promises";

const test = async () => {
  const root = path.resolve(__dirname, "../../local");
  const list = await readFs(root);
  const content = await Promise.all(
    list.map((p) =>
      readFile(path.resolve(root, p))
        .then((buffer) => buffer.toString())
        .then((content) => ({ path: p, content }))
    )
  );

  console.log(content);
};

test();
