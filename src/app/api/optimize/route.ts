import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

type Pair = { question: string; answer: string; tool?: string };
type Session = { id: string; createdAt: string; pairs: Pair[] };
type Samples = { samples: Session[] };

function getSamplesPath(): string {
  return path.join(process.cwd(), "data", "samples.json");
}

function getPromptPath(): string {
  return path.join(process.cwd(), "data", "prompt.md");
}

async function ensureDataDir(): Promise<void> {
  const dir = path.join(process.cwd(), "data");
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {}
}

// Removed unused stringifySession function

async function readSamples(): Promise<Samples> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(getSamplesPath(), "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      // Handle new format
      if (Array.isArray(parsed.samples)) {
        return parsed as Samples;
      }
      // Handle legacy format
      if (Array.isArray(parsed.good) && Array.isArray(parsed.bad)) {
        return { samples: [...parsed.good, ...parsed.bad] };
      }
    }
  } catch {}
  return { samples: [] };
}

async function writePrompt(instruction: string): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(getPromptPath(), instruction.trim() + "\n", "utf8");
}

export async function GET() {
  try {
    // Read from complete optimization file instead of the deleted optimization.json
    const completePath = path.join(
      process.cwd(),
      "data",
      "complete-optimization.json"
    );
    const completeContent = await fs.readFile(completePath, "utf8");
    const completeData = JSON.parse(completeContent);

    // Read current prompt for instruction length
    const promptPath = path.join(process.cwd(), "data", "prompt.md");
    let instructionLength = 0;
    try {
      const promptContent = await fs.readFile(promptPath, "utf8");
      instructionLength = promptContent?.trim().length || 0;
    } catch {}

    // Extract instruction from the saved complete optimization (best-effort)
    let instructionFromResult: string | undefined =
      typeof completeData?.instruction === "string" && completeData.instruction
        ? completeData.instruction
        : (completeData?.result?.optimizedProgram?.instruction as
            | string
            | undefined);

    // Fallback to the current prompt.md contents if missing
    try {
      if (!instructionFromResult) {
        const promptContent = await fs.readFile(getPromptPath(), "utf8");
        const trimmed = promptContent?.trim();
        if (trimmed) instructionFromResult = trimmed;
      }
    } catch {}

    // Return data in the format the UI expects, with enhanced information
    const stats = {
      status: "completed" as const,
      bestScore: completeData.bestScore,
      totalRounds: completeData.totalRounds,
      converged: completeData.converged,
      optimizerType: completeData.optimizerType,
      optimizationTimeMs: completeData.optimizationTime,
      updatedAt: completeData.timestamp,
      instructionLength,
      instruction: instructionFromResult,
      // Enhanced data from complete optimization
      temperature: completeData.modelConfig?.temperature,
      demosCount:
        (Array.isArray(completeData.demos) && completeData.demos.length) ||
        (Array.isArray(completeData.result?.optimizedProgram?.demos)
          ? completeData.result.optimizedProgram.demos.length
          : 0),
      totalCalls: completeData.stats?.totalCalls,
      successRate:
        completeData.stats?.successfulDemos && completeData.stats?.totalCalls
          ? (
              (completeData.stats.successfulDemos /
                completeData.stats.totalCalls) *
              100
            ).toFixed(1) + "%"
          : null,
      usedSamples: {
        total:
          (Array.isArray(completeData.result?.optimizedProgram?.examples)
            ? completeData.result.optimizedProgram.examples.length
            : 0) || 0,
      },
    };

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ status: "idle" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req: Request) {
  try {
    // Read optional settings from client
    let clientSettings: {
      auto?: "off" | "light" | "medium" | "heavy";
      maxMetricCalls?: number;
      candidateSelectionStrategy?: "pareto" | "current_best";
      reflectionMinibatchSize?: number;
      useMerge?: boolean;
      numThreads?: number;
    } | null = null;
    try {
      const body = await req.json();
      clientSettings = body?.settings || null;
    } catch {}
    const samples = await readSamples();

    // Create training examples: serialize entire conversations to preserve context
    const examples: Array<{
      conversationContext: string;
      expectedTurnResponse: string;
      toolsUsed?: string[];
    }> = [];

    for (const session of samples.samples) {
      if (session.pairs.length > 1) {
        // Use all turns except the last as context
        const contextPairs = session.pairs.slice(0, -1);
        const lastPair = session.pairs[session.pairs.length - 1];

        // Serialize context (conversation history)
        const conversationContext = contextPairs
          .map(
            (pair, index) =>
              `Turn ${index + 1}:\nUser: ${pair.question}\nAssistant: ${
                pair.answer
              }${pair.tool ? ` [Tool: ${pair.tool}]` : ""}`
          )
          .join("\n\n");

        // Expected response is just the final turn
        const expectedTurnResponse = `Turn ${contextPairs.length + 1}:\nUser: ${
          lastPair.question
        }\nAssistant: ${lastPair.answer}${
          lastPair.tool ? ` [Tool: ${lastPair.tool}]` : ""
        }`;

        const toolsUsed = session.pairs
          .filter((pair) => pair.tool)
          .map((pair) => pair.tool as string);

        examples.push({
          conversationContext: conversationContext || "New conversation", // Handle single-turn conversations
          expectedTurnResponse,
          ...(toolsUsed.length > 0 && { toolsUsed }),
        });
      } else if (session.pairs.length === 1) {
        // Handle single-turn conversations
        const pair = session.pairs[0];
        examples.push({
          conversationContext: "New conversation",
          expectedTurnResponse: `Turn 1:\nUser: ${pair.question}\nAssistant: ${
            pair.answer
          }${pair.tool ? ` [Tool: ${pair.tool}]` : ""}`,
          ...(pair.tool && { toolsUsed: [pair.tool] }),
        });
      }
    }

    console.log(`📊 处理样本:`);
    console.log(`   总对话数: ${samples.samples.length}`);
    console.log(`   训练示例: ${examples.length}`);
    console.log(
      `   示例对话:`,
      examples[0]?.conversationContext?.substring(0, 150) + "..."
    );

    if (examples.length === 0) {
      return new Response(
        JSON.stringify({
          error: "至少需要一个聊天会话才能进行优化",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Resolve optimizer endpoint from env with sensible defaults
    const resolvedEndpoint =
      process.env.OPTIMIZER_ENDPOINT || "http://localhost:8000";
    // Proactively check Python optimizer health
    try {
      const healthUrl = `${resolvedEndpoint.replace(/\/$/, "")}/health`;
      const healthRes = await fetch(healthUrl, { method: "GET" });
      if (healthRes.ok) {
        console.log(`🩺 Python 优化器在以下位置健康: ${healthUrl}`);
      } else {
        console.log(
          `⚠️ Python 优化器响应状态 ${healthRes.status} 于 ${healthUrl}`
        );
      }
    } catch (err) {
      console.log(
        `⚠️ 无法连接到 Python 优化器于 ${resolvedEndpoint}。请设置 OPTIMIZER_ENDPOINT 并确保服务正在运行。错误:`,
        err
      );
    }

    // Analyze training examples to guide instruction generation
    const toolUsageExamples = examples.filter(
      (ex) => ex.toolsUsed && ex.toolsUsed.length > 0
    );
    const nonToolExamples = examples.filter(
      (ex) => !ex.toolsUsed || ex.toolsUsed.length === 0
    );

    console.log(`📋 指令生成训练分析:`);
    console.log(`   使用工具的对话: ${toolUsageExamples.length}`);
    console.log(`   未使用工具的对话: ${nonToolExamples.length}`);

    if (toolUsageExamples.length > 0) {
      const allTools = toolUsageExamples.flatMap((ex) => ex.toolsUsed || []);
      const uniqueTools = [...new Set(allTools)];
      console.log(`   使用的唯一工具: ${uniqueTools.join(", ")}`);
    }

    // Call Python dspy.GEPA optimizer
    console.log("🔄 使用 dspy.GEPA 优化您的 AI 程序...");
    const resp = await fetch(
      `${resolvedEndpoint.replace(/\/$/, "")}/optimize`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examples,
          // Map a subset of Basic settings to python service
          maxMetricCalls:
            typeof clientSettings?.maxMetricCalls === "number"
              ? clientSettings.maxMetricCalls
              : 50,
          auto: clientSettings?.auto, // passthrough
          candidateSelectionStrategy:
            clientSettings?.candidateSelectionStrategy,
          reflectionMinibatchSize: clientSettings?.reflectionMinibatchSize,
          useMerge: clientSettings?.useMerge,
          numThreads: clientSettings?.numThreads,
        }),
      }
    );
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Optimizer error ${resp.status}: ${text}`);
    }
    const result = await resp.json();

    console.log(`✅ 完成! dspy.GEPA 优化已完成`);

    // Extract from Python optimizer result
    const bestScore = result.bestScore !== undefined ? result.bestScore : -1;
    const instruction = (
      result as { optimizedProgram?: { instruction?: string } }
    )?.optimizedProgram?.instruction;

    // Check if result has the expected properties
    console.log(`📊 GEPA 结果键:`, Object.keys(result));

    if (bestScore >= 0) {
      console.log(`✨ 找到最佳分数: ${bestScore.toFixed(3)}`);
    }

    // No need to apply demos - we'll use them in the prompt directly via AI SDK

    // Extract optimized demos if available
    const optimizedDemos = (
      result as { optimizedProgram?: { demos?: unknown[] } }
    )?.optimizedProgram?.demos;

    // Build the prompt components
    const promptParts: string[] = [];

    // 1. Add instruction (optimized or fallback)
    const finalInstruction =
      instruction && instruction.trim()
        ? instruction
        : "You are an assistant. Answer questions helpfully and professionally.";
    promptParts.push(finalInstruction);

    // 2. Add demos (optimized demos take precedence over original examples)
    if (optimizedDemos && optimizedDemos.length > 0) {
      const demoText = `\n\nOptimized Examples:\n${optimizedDemos
        .map((demo, i) => `Example ${i + 1}:\n${JSON.stringify(demo, null, 2)}`)
        .join("\n\n")}`;
      promptParts.push(demoText);
      console.log(`📚 使用 ${optimizedDemos.length} 个优化示例`);
    } else if (examples.length > 0) {
      const exampleText = `\n\nExamples:\n${examples
        .map(
          (ex, i) =>
            `Example ${i + 1}:\n${ex.conversationContext}\n→ ${
              ex.expectedTurnResponse
            }`
        )
        .join("\n\n")}`;
      promptParts.push(exampleText);
      console.log(`📚 使用 ${examples.length} 个原始训练示例`);
    }

    // 3. Write the complete prompt
    const fullPrompt = promptParts.join("");
    await writePrompt(fullPrompt);

    console.log(
      `📝 已保存${
        instruction ? "优化" : "回退"
      }指令和示例到 prompt.md`
    );

    // Save the GEPA optimization result (use unified optimized program fields)
    const optimizedProgram = (
      result as {
        optimizedProgram?: {
          bestScore?: number;
          stats?: unknown;
          instruction?: string;
          demos?: unknown[];
          modelConfig?: unknown;
          optimizerType?: string;
          optimizationTime?: number;
          totalRounds?: number;
          converged?: boolean;
          examples?: unknown[];
        };
      }
    ).optimizedProgram;

    const completeOptimization = {
      version: "2.0",
      bestScore: optimizedProgram?.bestScore ?? bestScore,
      instruction: optimizedProgram?.instruction ?? instruction,
      demos: optimizedProgram?.demos ?? [],
      modelConfig: optimizedProgram?.modelConfig ?? undefined,
      optimizerType: optimizedProgram?.optimizerType ?? "GEPA",
      optimizationTime: optimizedProgram?.optimizationTime ?? undefined,
      totalRounds: optimizedProgram?.totalRounds ?? undefined,
      converged: optimizedProgram?.converged ?? undefined,
      stats: optimizedProgram?.stats ?? undefined,
      // Keep full result for debugging, but we can drop later if too large
      result: result,
      timestamp: new Date().toISOString(),
    };

    await fs.writeFile(
      path.join(process.cwd(), "data", "complete-optimization.json"),
      JSON.stringify(completeOptimization, null, 2),
      "utf8"
    );
    console.log("✅ GEPA 优化结果已保存到 complete-optimization.json");

    // Also save a versioned copy co-locating prompt and optimization result
    try {
      const versionsDir = path.join(process.cwd(), "data", "versions");
      await fs.mkdir(versionsDir, { recursive: true });
      const versionId = (completeOptimization.timestamp || "")
        .replace(/[:]/g, "-")
        .replace(/[.]/g, "-");
      const versionPath = path.join(
        versionsDir,
        versionId || String(Date.now())
      );
      await fs.mkdir(versionPath, { recursive: true });
      // Save prompt used for this run
      await fs.writeFile(
        path.join(versionPath, "prompt.md"),
        fullPrompt,
        "utf8"
      );
      // Save the optimization result JSON for this run
      await fs.writeFile(
        path.join(versionPath, "complete-optimization.json"),
        JSON.stringify(completeOptimization, null, 2),
        "utf8"
      );
      console.log(
        `🗃️ 已保存版本化运行于 data/versions/${path.basename(versionPath)}`
      );
    } catch (e) {
      console.log("⚠️ 保存版本化优化运行失败:", e);
    }

    return new Response(
      JSON.stringify({
        message: "GEPA 优化完成",
        instruction,
        bestScore: bestScore,
        optimizer: "GEPA",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知错误";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
