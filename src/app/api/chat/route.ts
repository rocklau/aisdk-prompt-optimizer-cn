import {
  humanAgentWaitTime,
  lookupInternalKnowledgeBase,
  routeToHumanAgent,
} from "@/lib/tools";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import "dotenv/config";
import fs from "fs/promises";
import path from "path";

// Load optimized model configuration from MiPRO results
async function loadOptimizedConfig(version?: string): Promise<{
  temperature?: number;
  demos?: unknown[];
  fewShotExamples?: string;
}> {
  try {
    const configPath = version
      ? path.join(
          process.cwd(),
          "data",
          "versions",
          version,
          "complete-optimization.json"
        )
      : path.join(process.cwd(), "data", "complete-optimization.json");
    const configContent = await fs.readFile(configPath, "utf8");
    const config = JSON.parse(configContent);

    // Convert demos to few-shot examples for the system prompt
    let fewShotExamples = "";
    if (config.demos && config.demos.length > 0) {
      const traces = (config.demos[0] as { traces?: unknown[] })?.traces || [];
      const examples = traces
        .filter((trace: unknown) => {
          const t = trace as { question?: string; answer?: string };
          return t.question && t.answer;
        })
        .map((trace: unknown) => {
          const t = trace as { question: string; answer: string };
          return `User: ${t.question}\nAssistant: ${t.answer}`;
        })
        .join("\n\n");

      if (examples) {
        fewShotExamples = `\nHere are some examples of how to respond:\n\n${examples}`;
      }
    }

    return {
      temperature: config.modelConfig?.temperature,
      demos: config.demos,
      fewShotExamples,
    };
  } catch {
    // Fallback to default if optimization config not available
    return { temperature: 0.7 };
  }
}

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // Check for teaching prompt in URL parameters
  const url = new URL(req.url);
  const teachingSystemPrompt =
    url.searchParams.get("teachingPrompt") || undefined;

  console.log("🎓 Teaching mode:", teachingSystemPrompt ? "ACTIVE" : "OFF");
  if (teachingSystemPrompt) {
    console.log("🎓 Teaching prompt:", teachingSystemPrompt);
  }

  // Read dynamic system prompt from data/prompt.md (optimized by MiPRO) unless teaching override is present
  let baseSystemPrompt: string | undefined;
  if (!teachingSystemPrompt) {
    try {
      const version = url.searchParams.get("version") || undefined;
      const promptPath = version
        ? path.join(process.cwd(), "data", "versions", version, "prompt.md")
        : path.join(process.cwd(), "data", "prompt.md");
      const promptContent = await fs.readFile(promptPath, "utf8");
      baseSystemPrompt = promptContent?.trim() ? promptContent : undefined;
    } catch {
      baseSystemPrompt = undefined;
    }
  }

  // Load optimized configuration from MiPRO results
  const optimizedConfig = await loadOptimizedConfig(
    url.searchParams.get("version") || undefined
  );

  // Prefer an explicit system message provided by the client
  const firstSystemMessage = (messages || []).find((m) => m.role === "system");

  function extractTextFromParts(
    parts: ReadonlyArray<{ type: string; text?: string }> | undefined
  ): string {
    if (!parts) return "";
    return parts
      .filter((p) => p.type === "text" && typeof p.text === "string")
      .map((p) => (p.text as string) || "")
      .join(" ")
      .trim();
  }

  // If a system message exists, use its text; otherwise, compute from teaching/base
  const systemPrompt = firstSystemMessage
    ? extractTextFromParts(
        firstSystemMessage.parts as ReadonlyArray<{
          type: string;
          text?: string;
        }>
      )
    : teachingSystemPrompt
    ? teachingSystemPrompt
    : baseSystemPrompt
    ? baseSystemPrompt + (optimizedConfig.fewShotExamples || "")
    : optimizedConfig.fewShotExamples;

  console.log(`🎯 Using optimized temperature: ${optimizedConfig.temperature}`);
  console.log(
    `📚 Including ${optimizedConfig.demos?.length || 0} optimized demos`
  );

  const result = streamText({
    model: "openai/gpt-4.1-mini",
    tools: {
      humanAgentWaitTime,
      routeToHumanAgent,
      lookupInternalKnowledgeBase,
    },
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    temperature: optimizedConfig.temperature, // Use MiPRO optimized temperature
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
