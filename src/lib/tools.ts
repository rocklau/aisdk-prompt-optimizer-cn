import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, tool } from "ai";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
import { createAIProvider } from "./provider";

export const humanAgentWaitTime = tool({
  description: "估算当前与人工客服交谈的等待时间。",
  inputSchema: z.object({
    topic: z
      .string()
      .optional()
      .describe("可选主题，用于路由到正确的队列"),
  }),
  execute: async () => {
    const minutes = Math.floor(Math.random() * 61); // 0..60
    return `预计等待时间：${minutes} 分钟。`;
  },
});

export const routeToHumanAgent = tool({
  description: "将对话转接到人工客服。",
  inputSchema: z.object({
    urgency: z
      .enum(["low", "medium", "high"])
      .default("low")
      .describe("可选紧急程度"),
  }),
  execute: async () => {
    return "已成功转接至人工客服。稍后将有人与您联系。";
  },
});

export const lookupInternalKnowledgeBase = tool({
  description: "在内部知识库中查找答案。",
  inputSchema: z.object({
    query: z.string().min(1).describe("用户要搜索的问题"),
  }),
  execute: async ({ query }: { query: string }) => {
    try {
      const kbPath = path.join(process.cwd(), "data", "kb.md");
      const kb = await fs.readFile(kbPath, "utf-8");

      const prompt = [
        "您是内部支持助手。",
        "仅使用提供的知识库上下文回答用户问题。",
        "如果信息不存在或不相关，请准确回复：",
        '"未找到信息。您希望我找个人工来回应您的查询吗?"',
        "\n--- 知识库上下文 ---\n",
        kb,
        "\n--- 问题 ---\n",
        query,
        "\n--- 答案 ---",
      ].join("\n");

      const { provider, modelName } = createAIProvider();
      const { text } = await generateText({
        model: provider(modelName),
        prompt,
      });

      return text.trim();
    } catch {
      return "未找到信息。您希望我找个人工来回应您的查询吗?";
    }
  },
});