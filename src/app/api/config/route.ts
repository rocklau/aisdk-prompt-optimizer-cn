import { promises as fs } from "fs";
import path from "path";

export async function GET(req: Request) {
  try {
    // Allow reading a specific version via ?version=ID
    const url = new URL(req.url);
    const version = url.searchParams?.get?.("version");
    // Read optimization config
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

    // Read current prompt
    const promptPath = version
      ? path.join(process.cwd(), "data", "versions", version, "prompt.md")
      : path.join(process.cwd(), "data", "prompt.md");
    const promptContent = await fs.readFile(promptPath, "utf8");

    return new Response(
      JSON.stringify({
        optimized: true,
        temperature: config.modelConfig?.temperature || 0.7,
        bestScore: config.bestScore,
        optimizerType: config.optimizerType,
        timestamp: config.timestamp,
        instruction: promptContent?.trim(),
        instructionLength: promptContent?.trim().length || 0,
        demos: config.demos?.length || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch {
    // Return default config if optimization not available
    return new Response(
      JSON.stringify({
        optimized: false,
        temperature: 0.7,
        bestScore: null,
        optimizerType: "default",
        timestamp: null,
        instruction: null,
        instructionLength: 0,
        demos: 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
