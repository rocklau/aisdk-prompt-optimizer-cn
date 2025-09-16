import { promises as fs } from "fs";
import path from "path";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const version = url.searchParams.get("version");
    const filePath = version
      ? path.join(process.cwd(), "data", "versions", version, "prompt.md")
      : path.join(process.cwd(), "data", "prompt.md");
    const content = await fs.readFile(filePath, "utf-8");
    return new Response(JSON.stringify({ prompt: content.trim() }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to read prompt";
    return new Response(JSON.stringify({ prompt: "", error: message }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
