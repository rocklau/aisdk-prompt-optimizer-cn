"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Info,
  Plus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ToolCallPart = { type: "tool-call"; toolName: string; args?: unknown };
type ToolResultPart = {
  type: "tool-result";
  toolName: string;
  result?: unknown;
};

type DynamicToolPart = {
  type: `tool-${string}`;
  toolCallId?: string;
  state?: "call-created" | "running" | "output-available" | string;
  input?: unknown;
  output?: unknown;
  callProviderMetadata?: unknown;
};

type StepStartPart = { type: "step-start" };

type UIPair = {
  question: string;
  answer: string;
  tool?: string;
};

type UISession = {
  id: string;
  createdAt: string;
  pairs: UIPair[];
};

type SamplesPayload = { samples: UISession[] };

type OptStats = {
  status: "idle" | "completed";
  bestScore?: number | null;
  totalRounds?: number | null;
  converged?: boolean | null;
  optimizerType?: string;
  optimizationTimeMs?: number | null;
  updatedAt?: string;
  instructionLength?: number;
  usedSamples?: { total: number };
};

function isToolCallPart(part: unknown): part is ToolCallPart {
  const p = part as { type?: unknown; toolName?: unknown } | null;
  return !!p && p.type === "tool-call" && typeof p.toolName === "string";
}

function isToolResultPart(part: unknown): part is ToolResultPart {
  const p = part as { type?: unknown; toolName?: unknown } | null;
  return !!p && p.type === "tool-result" && typeof p.toolName === "string";
}

function isDynamicToolPart(part: unknown): part is DynamicToolPart {
  const p = part as { type?: unknown } | null;
  return !!p && typeof p.type === "string" && p.type.startsWith("tool-");
}

function isStepStartPart(part: unknown): part is StepStartPart {
  const p = part as { type?: unknown } | null;
  return !!p && p.type === "step-start";
}

function extractTextFromMessageParts(
  parts: ReadonlyArray<{ type: string; text?: string }>
): string {
  return parts
    .filter((p) => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text as string)
    .join(" ")
    .trim();
}

export default function Chat() {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [teachingPrompt, setTeachingPrompt] = useState("");
  const [isTeachingMode, setIsTeachingMode] = useState(false);

  const { messages, sendMessage, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  // Samples state
  const [samples, setSamples] = useState<SamplesPayload>({ samples: [] });
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);
  const [savingSample, setSavingSample] = useState(false);

  // Prompt state
  const [prompt, setPrompt] = useState<string>("");
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [isCurrentPromptShown, setIsCurrentPromptShown] = useState(true);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [optStats, setOptStats] = useState<OptStats | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Prompt Versions state
  const [versions, setVersions] = useState<{
    versions: { id: string; timestamp?: string; bestScore?: number | null }[];
  } | null>(null);
  const [versionIndex, setVersionIndex] = useState(0);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);

  // Optimizer basic settings (UI-exposed)
  type OptimizerSettings = {
    auto: "off" | "light" | "medium" | "heavy";
    maxMetricCalls?: number;
    candidateSelectionStrategy: "pareto" | "current_best";
    reflectionMinibatchSize: number;
    useMerge: boolean;
    numThreads?: number;
  };
  const [optimizerSettings, setOptimizerSettings] = useState<OptimizerSettings>(
    {
      auto: "off",
      maxMetricCalls: 50,
      candidateSelectionStrategy: "pareto",
      reflectionMinibatchSize: 3,
      useMerge: true,
      numThreads: undefined,
    }
  );

  // Samples navigation index
  const [sampleIndex, setSampleIndex] = useState(0);

  // Pending session capture
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [pendingAnswer, setPendingAnswer] = useState<string | null>(null);
  const [pendingTool, setPendingTool] = useState<string | null>(null);
  const [pendingPairs, setPendingPairs] = useState<UIPair[]>([]);
  const [showSampleJson, setShowSampleJson] = useState(false);
  const [isSamplesCollapsed, setIsSamplesCollapsed] = useState(false);

  async function loadSamples() {
    try {
      setIsLoadingSamples(true);
      const res = await fetch("/api/samples", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load samples");
      const data = await res.json();
      let samplesData: SamplesPayload;

      // Handle legacy format
      if ("good" in data || "bad" in data) {
        const legacyData = data as { good?: UISession[]; bad?: UISession[] };
        samplesData = {
          samples: [...(legacyData.good || []), ...(legacyData.bad || [])],
        };
      } else {
        samplesData = data as SamplesPayload;
      }

      setSamples(samplesData);
      setSampleIndex((idx) =>
        samplesData.samples.length
          ? Math.min(idx, samplesData.samples.length - 1)
          : 0
      );
    } finally {
      setIsLoadingSamples(false);
    }
  }

  useEffect(() => {
    loadSamples();
    (async () => {
      try {
        setIsLoadingPrompt(true);
        const res = await fetch("/api/prompt", { cache: "no-store" });
        const data = (await res.json()) as { prompt?: string };
        setPrompt((data.prompt || "").trim());
        setActiveVersionId(null);
        setIsCurrentPromptShown(true);
      } finally {
        setIsLoadingPrompt(false);
      }
    })();
    (async () => {
      try {
        setIsLoadingVersions(true);
        const res = await fetch("/api/versions", { cache: "no-store" });
        if (res.ok) {
          const v = (await res.json()) as {
            versions: {
              id: string;
              timestamp?: string;
              bestScore?: number | null;
            }[];
          };
          setVersions(v);
          setVersionIndex(0);
        }
      } finally {
        setIsLoadingVersions(false);
      }
    })();
    (async () => {
      try {
        const res = await fetch("/api/optimize", { cache: "no-store" });
        const data = await res.json();
        setOptStats(data);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (messages.length) {
      const last = messages[messages.length - 1];
      console.log("Last message parts:", last.parts);
    }
  }, [messages]);

  const pendingPairComplete = useMemo(
    () => !!pendingQuestion && !!pendingAnswer,
    [pendingQuestion, pendingAnswer]
  );
  const hasPendingSession = useMemo(
    () => pendingPairs.length > 0 || !!pendingQuestion,
    [pendingPairs.length, pendingQuestion]
  );

  const sessionPreviewPairs = useMemo(() => pendingPairs, [pendingPairs]);

  async function saveSession() {
    const finalPairs: UIPair[] = [
      ...pendingPairs,
      ...(pendingPairComplete
        ? [
            {
              question: pendingQuestion as string,
              answer: pendingAnswer as string,
              tool: pendingTool ?? undefined,
            },
          ]
        : []),
    ];
    if (finalPairs.length === 0) return;
    try {
      setSavingSample(true);
      const res = await fetch("/api/samples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pairs: finalPairs,
        }),
      });
      if (!res.ok) throw new Error("Failed to save sample");
      const data: SamplesPayload = await res.json();
      setSamples(data);
      setPendingQuestion(null);
      setPendingAnswer(null);
      setPendingTool(null);
      setPendingPairs([]);
    } finally {
      setSavingSample(false);
    }
  }

  function handleAddMessageToSample(message: {
    role: string;
    parts: ReadonlyArray<{ type: string; text?: string }>;
  }) {
    const text = extractTextFromMessageParts(message.parts);
    if (!text) return;

    if (message.role === "user") {
      // Start a new pair selection (user question)
      setPendingQuestion(text);
      setPendingAnswer(null);
      setPendingTool(null);
      return;
    }

    // Assistant message: complete the pair and append to pending session
    if (message.role !== "user") {
      if (!pendingQuestion) return;
      const toolNames = new Set<string>();
      for (const part of message.parts as ReadonlyArray<
        { type: string } & Record<string, unknown>
      >) {
        if (isDynamicToolPart(part)) {
          const toolName = (part.type as string).replace("tool-", "");
          if (toolName) toolNames.add(toolName);
        } else if (isToolCallPart(part)) {
          const toolName = (part as ToolCallPart).toolName;
          if (toolName) toolNames.add(toolName);
        } else if (isToolResultPart(part)) {
          const toolName = (part as ToolResultPart).toolName;
          if (toolName) toolNames.add(toolName);
        }
      }
      const toolValue = Array.from(toolNames).join(", ");
      setPendingPairs((prev) => [
        ...prev,
        {
          question: pendingQuestion as string,
          answer: text,
          tool: toolValue || undefined,
        },
      ]);
      setPendingAnswer(null);
      setPendingTool(null);
      return;
    }
  }

  return (
    <div className="font-sans mx-auto max-w-6xl p-6 flex gap-6 min-h-[100svh]">
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="text-xl font-medium">AI Chat</div>
          <div className="flex items-center gap-2">
            <Button
              variant={isTeachingMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsTeachingMode(!isTeachingMode)}
            >
              {isTeachingMode ? "Exit Teaching" : "Teaching Mode"}
            </Button>
            {hasPendingSession && (
              <div className="flex items-center gap-2">
                <div className="text-xs text-neutral-600">
                  Pending session: {pendingPairs.length} pair
                  {pendingPairs.length === 1 ? "" : "s"}
                  {pendingPairComplete
                    ? " + 1 in progress"
                    : pendingQuestion
                    ? " (select an AI answer)"
                    : ""}
                </div>
                <Button
                  size="sm"
                  onClick={() => saveSession()}
                  disabled={savingSample}
                >
                  {savingSample ? "Saving…" : "Save Sample"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setPendingQuestion(null);
                    setPendingAnswer(null);
                    setPendingTool(null);
                    setPendingPairs([]);
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMessages([])}
              aria-label="Clear chat"
            >
              Clear
            </Button>
          </div>
        </div>

        {isTeachingMode && (
          <div className="border rounded-md p-4 bg-blue-50">
            <div className="font-medium mb-3">Teaching Mode</div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Scenario + Expected Behavior
                </label>
                <Textarea
                  placeholder="Describe the scenario and the expected behavior in one prompt"
                  value={teachingPrompt}
                  onChange={(e) => setTeachingPrompt(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 border rounded-md p-4 space-y-3 overflow-y-auto">
          {messages.map((m) =>
            m.role === "system" ? null : (
              <div key={m.id} className="text-sm relative group">
                <Button
                  aria-label="Add to session sample"
                  variant="outline"
                  size="icon"
                  className="absolute -right-3 -top-3 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-full shadow"
                  onClick={() => handleAddMessageToSample(m)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <span className="font-semibold mr-2">
                  {m.role === "user" ? "You" : "AI"}:
                </span>
                {(m.parts || []).map((part, index) => {
                  if (part.type === "text") {
                    const text = (part as { text?: string }).text ?? "";
                    return <span key={index}>{text}</span>;
                  }

                  if (isStepStartPart(part)) {
                    return null;
                  }

                  if (isDynamicToolPart(part)) {
                    const toolName = part.type.replace("tool-", "");
                    return (
                      <div
                        key={index}
                        className="mt-1 text-xs text-neutral-700 bg-neutral-50 border border-neutral-200 rounded p-2"
                      >
                        <div className="font-medium">
                          Tool called: {toolName}
                        </div>
                        <div className="mt-1">
                          <span className="text-neutral-500">Arguments:</span>
                          <pre className="whitespace-pre-wrap break-words text-neutral-600">
                            {JSON.stringify(part.input, null, 2)}
                          </pre>
                        </div>
                        {part.state === "output-available" ? (
                          <div className="mt-1">
                            <span className="text-neutral-500">Output:</span>{" "}
                            <span className="text-neutral-600">
                              {typeof part.output === "string"
                                ? part.output
                                : JSON.stringify(part.output)}
                            </span>
                          </div>
                        ) : (
                          <div className="mt-1 text-neutral-500">Running…</div>
                        )}
                      </div>
                    );
                  }

                  if (isToolCallPart(part)) {
                    return (
                      <span key={index} className="text-xs text-neutral-500">
                        Calling {part.toolName} with {JSON.stringify(part.args)}
                      </span>
                    );
                  }

                  if (isToolResultPart(part)) {
                    return (
                      <span key={index} className="text-xs text-neutral-500">
                        {part.toolName} result: {""}
                        {typeof part.result === "string"
                          ? part.result
                          : JSON.stringify(part.result)}
                      </span>
                    );
                  }

                  return (
                    <span key={index} className="text-xs text-neutral-400">
                      {JSON.stringify(part)}
                    </span>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Save sample controls moved to header next to pending indicator */}

        {hasPendingSession && sessionPreviewPairs.length > 0 && (
          <div className="border rounded-md p-3 text-xs bg-neutral-50">
            <div className="font-medium mb-2">
              Pending session preview ({sessionPreviewPairs.length} pair
              {sessionPreviewPairs.length === 1 ? "" : "s"})
            </div>
            {sessionPreviewPairs.map((p, i) => (
              <div key={i} className="mb-2 last:mb-0">
                <div className="text-neutral-500">
                  Q{sessionPreviewPairs.length > 1 ? `#${i + 1}` : ""}:
                </div>
                <div className="mb-1 whitespace-pre-wrap break-words">
                  {p.question}
                </div>
                <div className="text-neutral-500">
                  A{sessionPreviewPairs.length > 1 ? `#${i + 1}` : ""}:
                </div>
                <div className="whitespace-pre-wrap break-words">
                  {p.answer}
                </div>
                {p.tool ? (
                  <div className="mt-1 text-neutral-500">
                    Tool:<span className="ml-1 text-neutral-700">{p.tool}</span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!input.trim() && !(isTeachingMode && teachingPrompt.trim()))
              return;
            setIsSending(true);
            try {
              // Ensure a system message when teaching mode is active
              if (isTeachingMode && teachingPrompt.trim()) {
                const trimmed = teachingPrompt.trim();
                setMessages((prev) => {
                  const hasSameSystem = prev.some((msg) => {
                    if (msg.role !== "system") return false;
                    const textParts = (msg.parts || []) as ReadonlyArray<{
                      type: string;
                      text?: string;
                    }>;
                    const text = textParts
                      .filter(
                        (p) => p.type === "text" && typeof p.text === "string"
                      )
                      .map((p) => p.text as string)
                      .join(" ")
                      .trim();
                    return text === trimmed;
                  });
                  if (hasSameSystem) return prev;
                  return [
                    {
                      id: `teaching-system-${Date.now()}`,
                      role: "system" as const,
                      parts: [{ type: "text" as const, text: trimmed }],
                    },
                    ...prev,
                  ];
                });
              }

              // Use useChat for sending in all modes
              await sendMessage({
                role: "user",
                parts: [
                  {
                    type: "text",
                    text:
                      input.trim() ||
                      "Please respond according to the teaching scenario.",
                  },
                ],
              });
            } finally {
              setIsSending(false);
            }
            setInput("");
          }}
          className="flex gap-2 sticky bottom-2 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75 border-t pt-3"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
          />
          <Button type="submit" disabled={isSending}>
            {isSending ? "Sending..." : "Send"}
          </Button>
        </form>
      </div>

      <aside className="w-[320px] shrink-0 border rounded-md p-4 h-fit">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">Samples</div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={
                isSamplesCollapsed ? "Expand samples" : "Collapse samples"
              }
              onClick={() => setIsSamplesCollapsed((v) => !v)}
            >
              {isSamplesCollapsed ? <ChevronDown /> : <ChevronUp />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadSamples}
              disabled={isLoadingSamples}
            >
              {isLoadingSamples ? "Loading…" : "Refresh"}
            </Button>
          </div>
        </div>
        {!isSamplesCollapsed && (
          <>
            <div className="space-y-2">
              {samples.samples.length === 0 ? (
                <div className="text-xs text-neutral-500">No samples yet.</div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500">
                      {sampleIndex + 1} of {samples.samples.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Previous sample"
                        onClick={() =>
                          setSampleIndex((i) => Math.max(0, i - 1))
                        }
                        disabled={sampleIndex === 0}
                      >
                        <ChevronLeft />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Next sample"
                        onClick={() =>
                          setSampleIndex((i) =>
                            Math.min(samples.samples.length - 1, i + 1)
                          )
                        }
                        disabled={sampleIndex >= samples.samples.length - 1}
                      >
                        <ChevronRight />
                      </Button>
                    </div>
                  </div>
                  <div className="border rounded p-2 text-xs max-h-80 overflow-y-auto">
                    <div className="mb-1 text-neutral-500">
                      Session ID:{" "}
                      <span className="text-neutral-700">
                        {samples.samples[sampleIndex]?.id}
                      </span>
                    </div>
                    <div className="mb-2 text-neutral-500">
                      Created:{" "}
                      <span className="text-neutral-700">
                        {samples.samples[sampleIndex]?.createdAt}
                      </span>
                    </div>
                    {samples.samples[sampleIndex]?.pairs?.map((p, i) => (
                      <div key={i} className="mb-2">
                        <div className="text-neutral-500">
                          Q
                          {samples.samples[sampleIndex]?.pairs.length > 1
                            ? `#${i + 1}`
                            : ""}
                          :
                        </div>
                        <div className="mb-1">{p.question}</div>
                        <div className="text-neutral-500">
                          A
                          {samples.samples[sampleIndex]?.pairs.length > 1
                            ? `#${i + 1}`
                            : ""}
                          :
                        </div>
                        <div>{p.answer}</div>
                        {p.tool ? (
                          <div className="mt-1 text-neutral-500">
                            Tool:
                            <span className="ml-1 text-neutral-700">
                              {p.tool}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    ))}
                    <div className="mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSampleJson((v) => !v)}
                      >
                        {showSampleJson ? "Hide JSON" : "Show JSON"}
                      </Button>
                    </div>
                    {showSampleJson && (
                      <pre className="mt-2 p-2 bg-neutral-100 rounded border whitespace-pre-wrap break-words">
                        {JSON.stringify(samples.samples[sampleIndex], null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">Optimizer Settings</div>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-neutral-600">Mode (auto)</label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  title="Preset controlling search/budget aggressiveness."
                >
                  <Info className="h-3.5 w-3.5 text-neutral-500" />
                </Button>
              </div>
              <select
                className="w-full border rounded-md h-9 px-2 text-sm bg-white"
                value={optimizerSettings.auto}
                aria-label="Auto mode"
                onChange={(e) =>
                  setOptimizerSettings((s) => ({
                    ...s,
                    auto:
                      (e.target.value as OptimizerSettings["auto"]) || "off",
                  }))
                }
              >
                <option value="off">off</option>
                <option value="light">light</option>
                <option value="medium">medium</option>
                <option value="heavy">heavy</option>
              </select>
              <div className="mt-1 text-[11px] text-neutral-500">
                Choose overall search intensity.
              </div>
            </div>
            <div>
              <label className="text-xs text-neutral-600 block mb-1">
                Max metric calls
              </label>
              <Input
                type="number"
                placeholder="e.g., 50"
                value={optimizerSettings.maxMetricCalls ?? ""}
                onChange={(e) =>
                  setOptimizerSettings((s) => ({
                    ...s,
                    maxMetricCalls:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-neutral-600">
                  Candidate selection
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  title="Pareto keeps diverse frontier; current_best exploits the top candidate."
                >
                  <Info className="h-3.5 w-3.5 text-neutral-500" />
                </Button>
              </div>
              <select
                className="w-full border rounded-md h-9 px-2 text-sm bg-white"
                value={optimizerSettings.candidateSelectionStrategy}
                aria-label="Candidate selection strategy"
                onChange={(e) =>
                  setOptimizerSettings((s) => ({
                    ...s,
                    candidateSelectionStrategy:
                      (e.target
                        .value as OptimizerSettings["candidateSelectionStrategy"]) ||
                      "pareto",
                  }))
                }
              >
                <option value="pareto">pareto</option>
                <option value="current_best">current_best</option>
              </select>
              <div className="mt-1 text-[11px] text-neutral-500">
                Controls exploration vs. exploitation.
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-neutral-600">
                  Reflection minibatch size
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  title="Batch size for each reflection rollout."
                >
                  <Info className="h-3.5 w-3.5 text-neutral-500" />
                </Button>
              </div>
              <Input
                type="number"
                placeholder="e.g., 3"
                value={optimizerSettings.reflectionMinibatchSize}
                onChange={(e) =>
                  setOptimizerSettings((s) => ({
                    ...s,
                    reflectionMinibatchSize: Number(e.target.value || 3),
                  }))
                }
              />
              <div className="mt-1 text-[11px] text-neutral-500">
                Higher = more context per mutation, slower.
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-neutral-600">Use merge</label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  title="System-aware merge of strong submodules."
                >
                  <Info className="h-3.5 w-3.5 text-neutral-500" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={optimizerSettings.useMerge ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setOptimizerSettings((s) => ({ ...s, useMerge: true }))
                  }
                >
                  On
                </Button>
                <Button
                  variant={!optimizerSettings.useMerge ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setOptimizerSettings((s) => ({ ...s, useMerge: false }))
                  }
                >
                  Off
                </Button>
              </div>
              <div className="mt-1 text-[11px] text-neutral-500">
                Try combining best parts across candidates.
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-neutral-600">Num threads</label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  title="Parallel candidate evaluations; leave empty for auto."
                >
                  <Info className="h-3.5 w-3.5 text-neutral-500" />
                </Button>
              </div>
              <Input
                type="number"
                placeholder="auto"
                value={optimizerSettings.numThreads ?? ""}
                onChange={(e) =>
                  setOptimizerSettings((s) => ({
                    ...s,
                    numThreads:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  }))
                }
              />
              <div className="mt-1 text-[11px] text-neutral-500">
                Increase to use more CPU cores if available.
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-neutral-700">Optimization</div>
            <Button
              size="sm"
              onClick={async () => {
                try {
                  setIsOptimizing(true);
                  const res = await fetch("/api/optimize", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ settings: optimizerSettings }),
                  });
                  const data = await res.json();
                  setOptStats(data?.stats ?? null);
                  // refresh prompt after optimization
                  try {
                    setIsLoadingPrompt(true);
                    const p = await fetch("/api/prompt", { cache: "no-store" });
                    const pj = (await p.json()) as { prompt?: string };
                    setPrompt((pj.prompt || "").trim());
                  } finally {
                    setIsLoadingPrompt(false);
                  }
                } finally {
                  setIsOptimizing(false);
                }
              }}
              disabled={isOptimizing}
            >
              {isOptimizing ? "Optimizing…" : "Optimize Prompt"}
            </Button>
          </div>

          <div className="mt-2 text-xs text-neutral-700 bg-neutral-50 border border-neutral-200 rounded p-2">
            {optStats && optStats.status !== "idle" ? (
              <div className="space-y-1">
                {typeof optStats.bestScore !== "undefined" &&
                optStats.bestScore !== null ? (
                  <div>
                    <span className="text-neutral-500">Best score:</span>{" "}
                    <span>{(optStats.bestScore * 100).toFixed(1)}%</span>
                  </div>
                ) : null}
                {typeof optStats.totalRounds !== "undefined" &&
                optStats.totalRounds !== null ? (
                  <div>
                    <span className="text-neutral-500">Rounds:</span>{" "}
                    <span>{optStats.totalRounds}</span>
                  </div>
                ) : null}
                {typeof optStats.converged !== "undefined" &&
                optStats.converged !== null ? (
                  <div>
                    <span className="text-neutral-500">Converged:</span>{" "}
                    <span>{optStats.converged ? "Yes" : "No"}</span>
                  </div>
                ) : null}
                {optStats.optimizerType ? (
                  <div>
                    <span className="text-neutral-500">Optimizer:</span>{" "}
                    <span>{optStats.optimizerType}</span>
                  </div>
                ) : null}
                {typeof optStats.optimizationTimeMs !== "undefined" &&
                optStats.optimizationTimeMs !== null ? (
                  <div>
                    <span className="text-neutral-500">Time:</span>{" "}
                    <span>{Math.round(optStats.optimizationTimeMs)} ms</span>
                  </div>
                ) : null}
                {optStats.usedSamples ? (
                  <div>
                    <span className="text-neutral-500">Samples used:</span>{" "}
                    <span>{optStats.usedSamples.total} samples</span>
                  </div>
                ) : null}
                {optStats.updatedAt ? (
                  <div>
                    <span className="text-neutral-500">Updated:</span>{" "}
                    <span>{optStats.updatedAt}</span>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="text-neutral-500">No optimization run yet.</div>
            )}
          </div>
        </div>
      </aside>

      {/* Prompt bar moved to a separate right-side bar */}
      <aside className="w-[320px] shrink-0 border rounded-md p-4 h-fit">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">Prompt</div>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              try {
                setIsLoadingPrompt(true);
                const id = activeVersionId;
                setIsCurrentPromptShown(!id);
                const res = await fetch(
                  "/api/prompt" +
                    (id ? `?version=${encodeURIComponent(id)}` : ""),
                  { cache: "no-store" }
                );
                const data = (await res.json()) as { prompt?: string };
                setPrompt((data.prompt || "").trim());
              } finally {
                setIsLoadingPrompt(false);
              }
            }}
            disabled={isLoadingPrompt}
          >
            {isLoadingPrompt ? "Loading…" : "Refresh"}
          </Button>
        </div>
        {/* Versions navigator */}
        <div className="mb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">Prompt Versions</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Previous version"
                onClick={async () => {
                  setVersionIndex((i) => Math.max(0, i - 1));
                  try {
                    setIsLoadingPrompt(true);
                    const newIndex = Math.max(0, versionIndex - 1);
                    const id =
                      newIndex === 0
                        ? null
                        : versions?.versions[newIndex - 1]?.id || null;
                    setActiveVersionId(id);
                    setIsCurrentPromptShown(!id);
                    const res = await fetch(
                      "/api/prompt" +
                        (id ? `?version=${encodeURIComponent(id)}` : ""),
                      { cache: "no-store" }
                    );
                    const data = (await res.json()) as { prompt?: string };
                    setPrompt((data.prompt || "").trim());
                  } finally {
                    setIsLoadingPrompt(false);
                  }
                }}
                disabled={isLoadingVersions || versionIndex === 0}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Next version"
                onClick={async () => {
                  setVersionIndex((i) => {
                    const total = 1 + (versions?.versions.length || 0);
                    const next = Math.min(total - 1, i + 1);
                    return next;
                  });
                  try {
                    setIsLoadingPrompt(true);
                    const total = 1 + (versions?.versions.length || 0);
                    const nextIdx = Math.min(total - 1, versionIndex + 1);
                    const id =
                      nextIdx === 0
                        ? null
                        : versions?.versions[nextIdx - 1]?.id || null;
                    setActiveVersionId(id);
                    setIsCurrentPromptShown(!id);
                    const res = await fetch(
                      "/api/prompt" +
                        (id ? `?version=${encodeURIComponent(id)}` : ""),
                      { cache: "no-store" }
                    );
                    const data = (await res.json()) as { prompt?: string };
                    setPrompt((data.prompt || "").trim());
                  } finally {
                    setIsLoadingPrompt(false);
                  }
                }}
                disabled={
                  isLoadingVersions ||
                  versionIndex >= 1 + (versions?.versions.length || 0) - 1
                }
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
          <div className="text-[11px] text-neutral-500">
            {isLoadingVersions
              ? "Loading versions…"
              : (() => {
                  const total = 1 + (versions?.versions.length || 0);
                  if (!versions || total === 1) {
                    return "1 of 1 — Current";
                  }
                  const label =
                    versionIndex === 0
                      ? "Current"
                      : versions.versions[versionIndex - 1]?.timestamp ||
                        versions.versions[versionIndex - 1]?.id;
                  return `${versionIndex + 1} of ${total} — ${label}`;
                })()}
          </div>
        </div>
        {prompt && isCurrentPromptShown ? (
          <div className="mb-1">
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-1.5 py-0.5">
              Current
            </span>
          </div>
        ) : null}
        {prompt ? (
          <pre className="text-xs whitespace-pre-wrap break-words text-neutral-700 bg-neutral-50 border border-neutral-200 rounded p-2 max-h-[40vh] overflow-y-auto">
            {prompt}
          </pre>
        ) : (
          <div className="text-xs text-neutral-500">No prompt configured.</div>
        )}
      </aside>
    </div>
  );
}
