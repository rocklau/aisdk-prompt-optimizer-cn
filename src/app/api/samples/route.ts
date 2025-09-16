import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";

export const runtime = "nodejs";

const PairSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  tool: z.string().optional(),
});

const SessionSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  pairs: z.array(PairSchema).min(1),
});

const SamplesSchema = z.object({
  samples: z.array(SessionSchema),
});

const AddSamplePairs = z.object({
  pairs: z.array(PairSchema).min(1),
});

const AddSampleSingle = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  tool: z.string().optional(),
});

const AddSampleSchema = z.union([AddSamplePairs, AddSampleSingle]);

function getSamplesPath() {
  return path.join(process.cwd(), "data", "samples.json");
}

async function ensureFile(): Promise<void> {
  const filePath = getSamplesPath();
  const dir = path.dirname(filePath);
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {}
  try {
    await fs.access(filePath);
  } catch {
    const initial: z.infer<typeof SamplesSchema> = { samples: [] };
    await fs.writeFile(filePath, JSON.stringify(initial, null, 2), "utf-8");
  }
}

// Legacy schema for backward compatibility
const LegacyItemSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
  createdAt: z.string(),
  tool: z.string().optional(),
});

const LegacySamplesSchema = z.object({
  good: z.array(LegacyItemSchema),
  bad: z.array(LegacyItemSchema),
});

async function readSamples() {
  await ensureFile();
  const data = await fs.readFile(getSamplesPath(), "utf-8");
  const parsed = JSON.parse(data);
  const result = SamplesSchema.safeParse(parsed);
  if (result.success) {
    return result.data;
  }

  // Try legacy parsing and transform to new structure
  const legacy = LegacySamplesSchema.safeParse(parsed);
  if (legacy.success) {
    const transform = (items: z.infer<typeof LegacyItemSchema>[]) =>
      items.map((it) => ({
        id: it.id,
        createdAt: it.createdAt,
        pairs: [
          {
            question: it.question,
            answer: it.answer,
            tool: it.tool,
          },
        ],
      }));
    return {
      samples: [...transform(legacy.data.good), ...transform(legacy.data.bad)],
    };
  }

  // Reset on invalid file
  return { samples: [] };
}

async function writeSamples(samples: z.infer<typeof SamplesSchema>) {
  await ensureFile();
  await fs.writeFile(
    getSamplesPath(),
    JSON.stringify(samples, null, 2),
    "utf-8"
  );
}

export async function GET() {
  try {
    const samples = await readSamples();
    return new Response(JSON.stringify(samples), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to load samples" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const data = AddSampleSchema.parse(json);

    const samples = await readSamples();
    const session = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      pairs:
        "pairs" in data
          ? data.pairs
          : [
              {
                question: (data as z.infer<typeof AddSampleSingle>).question,
                answer: (data as z.infer<typeof AddSampleSingle>).answer,
                tool: (data as z.infer<typeof AddSampleSingle>).tool,
              },
            ],
    } satisfies z.infer<typeof SessionSchema>;
    samples.samples.push(session);

    await writeSamples(samples);
    return new Response(JSON.stringify(samples), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
