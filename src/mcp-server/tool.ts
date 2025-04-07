import type { McpServer, ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { apiGetWeather, schemaGetWeather } from "./services/weather/api";
// import type { ZodObject, ZodRawShape } from "zod";
import { apiGetDate, schemaGetDate } from "./services/date/api";

type ToolInstance = {
  name: string;
  description: string;
} & (
  | {
      cb: ToolCallback;
      schema?: undefined;
    }
  | {
      schema: Parameters<McpServer["tool"]>[2];
      cb: ToolCallback<Parameters<McpServer["tool"]>[2]>;
    }
);

export const registerTool = (server: McpServer, tools: ToolInstance[]) => {
  tools.forEach((t) => {
    if (t.schema) {
      server.tool(t.name, t.description, t.schema, t.cb);
    } else {
      server.tool(t.name, t.description, t.cb);
    }
  });
};

export const toolGetWeather: ToolInstance = {
  name: "get-weather",
  description: "获取特定日期的天气信息",
  schema: schemaGetWeather,
  cb: async ({ date }) => {
    const res = await apiGetWeather({ date });

    if (!res.status || !res.count || res.lives.length === 0) {
      return {
        content: [{ type: "text", text: "查询失败" }],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `今天(${date})的实况天气为“${res.lives[0].weather}”`,
        },
      ],
    };
  },
};

export const toolGetDate: ToolInstance = {
  name: "get-today-date",
  description: "获取今天的日期",
  schema: schemaGetDate,
  cb: async ({}) => {
    const { date } = apiGetDate();
    return {
      content: [{ type: "text", text: `今天的日期是${date}` }],
    };
  },
};
