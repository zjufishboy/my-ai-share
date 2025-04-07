// 高德天气API https://lbs.amap.com/api/webservice/guide/api/weatherinfo
import { getEnvValue } from "../../../ai-chat-demo/utils";
import { z, ZodRawShape } from "zod";

type AmapRes<E> = E & {
  status: number;
  info: string;
  infocode: string;
};

type WeatherRes = AmapRes<{
  count: number;
  lives: Array<{
    province: string;
    city: string;
    adcode: string;
    weather: string;
    temperature: string;
    reporttime: string;
  }>;
}>;

export const apiGetWeather = async ({ date }: { date: string }) => {
  // ?parameters
  const url = new URL("https://restapi.amap.com/v3/weather/weatherInfo");
  url.searchParams.set("key", getEnvValue("AMAP_API_KEY"));
  // 参考高德城市编码表 https://lbs.amap.com/api/webservice/download
  // 先写死为西湖区
  url.searchParams.set("city", "330106");
  // 先不处理预报（all）,默认实时（base）
  // url.searchParams.set("extensions", "all");
  const res = await (await fetch(url)).json();
  return res as WeatherRes;
};

export const schemaGetWeather: ZodRawShape = { date: z.string().describe("今天的日期") };
