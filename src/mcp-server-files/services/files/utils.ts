import { readdir } from "node:fs/promises";

export const readFs = async (root: string): Promise<Array<string>> => {
  const list = await readdir(root, { withFileTypes: true });
  const fileList = list.filter((i) => i.isFile()).map((f) => f.name);
  const dirList = list.filter((i) => i.isDirectory());
  const fileLists = await Promise.all(
    dirList.map((d) => readFs(`${root}/${d.name}`).then((fList) => fList.map((f) => `${d.name}/${f}`)))
  );
  return [...fileList, ...fileLists.flat(2)];
};
