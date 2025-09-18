import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

type VersionItem = {
  id: string;
  timestamp?: string;
  bestScore?: number | null;
  optimizerType?: string | null;
};

export async function GET() {
  try {
    const versionsDir = path.join(process.cwd(), "data", "versions");
    await fs.mkdir(versionsDir, { recursive: true });
    const entries = await fs.readdir(versionsDir, { withFileTypes: true });
    const versions: VersionItem[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const id = entry.name;
      const jsonPath = path.join(versionsDir, id, "complete-optimization.json");
      try {
        const raw = await fs.readFile(jsonPath, "utf8");
        const data = JSON.parse(raw);
        versions.push({
          id,
          timestamp: data?.timestamp,
          bestScore: data?.bestScore ?? null,
          optimizerType: data?.optimizerType ?? null,
        });
      } catch {
        versions.push({ id });
      }
    }
    // Sort newest first by timestamp if present, else by id desc
    versions.sort((a, b) => {
      const ta = a.timestamp ? Date.parse(a.timestamp) : 0;
      const tb = b.timestamp ? Date.parse(b.timestamp) : 0;
      if (tb !== ta) return tb - ta;
      return b.id.localeCompare(a.id);
    });
    return new Response(JSON.stringify({ versions }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "列出版本失败";
    return new Response(JSON.stringify({ versions: [], error: message }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
