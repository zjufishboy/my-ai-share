# my-ai-share

一些 AI 方面的探索

## 本次给大家带来的是 AI-DEMO

### 操作步骤

1. 新建`.env`文件，输入对应的 key

```
ALI_API_KEY=阿里云平台 API KEY
AMAP_API_KEY=高德 API KEY
DEEPSEEK_API_KEY=Deepseek官网开发者 API KEY
```

2. 命令行运行 `pnpm run dev-client` 启动 AI 对话命令行

### 注意事项

截至目前，阿里云平台的 deepseek 模型不支持 function call ，建议使用官网 deepseek-chat 模型进行工具测试
