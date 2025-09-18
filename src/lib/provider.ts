import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * 创建 AI Provider 实例
 * 从环境变量读取 API 密钥和基础 URL
 */
export function createAIProvider() {
  const apiKey = process.env.AI_PROVIDER_API_KEY || process.env.OPENAI_API_KEY;
  const baseURL = process.env.AI_PROVIDER_BASE_URL || 'https://api.openai.com/v1';
  const modelName = process.env.AI_PROVIDER_MODEL_NAME || 'gpt-4.1-mini';

  if (!apiKey) {
    throw new Error('Missing AI provider API key. Please set AI_PROVIDER_API_KEY or OPENAI_API_KEY in your environment variables.');
  }

  return {
    provider: createOpenAICompatible({
      name: modelName,
      apiKey,
      baseURL,
    }),
    modelName
  };
}