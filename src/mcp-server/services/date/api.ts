import { ZodRawShape } from "zod";

export const apiGetDate = () => {
  const date = new Date();
  const monthStr = (date.getMonth() + 1).toString().padStart(2, "0");
  const dayStr = date.getDate().toString().padStart(2, "0");
  return {
    date: `${date.getFullYear()}-${monthStr}-${dayStr}`,
  };
};

export const schemaGetDate: ZodRawShape = {};
