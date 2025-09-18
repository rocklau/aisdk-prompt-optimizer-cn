from __future__ import annotations

import os
import time
from typing import Any, Dict, List

# Minimal DSPy/GEPA setup
import dspy
from dspy.teleprompt.gepa import GEPA
from flask import Flask, jsonify, request

app = Flask(__name__)

# Configure DSPy once at import time
# to avoid per-request reconfiguration errors
OPENAI_KEY = os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_APIKEY")
MAIN_MODEL = os.getenv("GEPA_MODEL", "gpt-4.1-mini")
REFLECTION_MODEL = os.getenv("GEPA_REFLECTION_MODEL", "gpt-4.1-nano")
AI_PROVIDER_BASE_URL = os.getenv("AI_PROVIDER_BASE_URL", "https://api.openai.com/v1")

if OPENAI_KEY:
    dspy.configure(lm=dspy.LM(model=MAIN_MODEL, api_key=OPENAI_KEY, api_base=AI_PROVIDER_BASE_URL))
else:
    dspy.configure(lm=dspy.LM(model=MAIN_MODEL))

dspy.configure_cache(
    enable_disk_cache=False,
    enable_memory_cache=False,
)

# Build reflection LM once
REFLECTION_LM = (
    dspy.LM(model=REFLECTION_MODEL, api_key=OPENAI_KEY, api_base=AI_PROVIDER_BASE_URL)
    if OPENAI_KEY
    else dspy.LM(model=REFLECTION_MODEL, api_key=OPENAI_KEY, api_base=AI_PROVIDER_BASE_URL)
)


def build_signature() -> dspy.Signature:
    class NextTurn(dspy.Signature):
        """根据目前的对话，生成下一条助手消息。

        优化清晰、有帮助的延续，以改善聊天轨迹。
        从理想示例中学习；模仿它们的结构、语调和工具使用。
        """
        conversationContext = dspy.InputField(
            desc="到目前为止的对话（用户和助手的轮次）",
            prefix="到目前为止的对话："
        )
        expectedTurnResponse = dspy.OutputField(
            desc=(
                "推进对话的下一条助手消息"
                "（包含任何工具使用）"
            ),
            prefix="下一条助手消息："
        )

    return NextTurn


def build_program() -> dspy.Module:
    # 在签名上的简单预测模块
    return dspy.Predict(build_signature())


class ScoreFeedback(dict):
    # 类似字典的属性访问，以兼容 GEPA 的日志
    def __getattr__(self, name: str) -> Any:  # fb.score
        try:
            return self[name]
        except KeyError as e:
            raise AttributeError(name) from e


def build_metric():
    # GEPA 指标必须接受 (gold, pred, trace, pred_name, pred_trace)
    # 返回 [0,1] 范围内的浮点数或字典 {score, feedback}
    def metric(
        gold: dspy.Example,
        pred: dspy.Prediction,
        trace: Any | None = None,
        pred_name: str | None = None,
        pred_trace: Any | None = None,
    ) -> Any:
        gold_text = getattr(gold, "expectedTurnResponse", "") or ""
        pred_text = getattr(pred, "expectedTurnResponse", "") or ""
        # 粗略的标记重叠
        g = set(gold_text.lower().split()) if gold_text else set()
        p = set(pred_text.lower().split()) if pred_text else set()
        overlap = len(g & p) if g else 0
        score = (overlap / len(g)) if g else 0.0
        # 对于一般评估调用，总是返回浮点数
        # （即使在缺少文本的情况下）
        if pred_name is None and pred_trace is None:
            return float(score)
        # 对于反思调用，返回丰富的反馈
        feedback = (
            f"重叠标记：{overlap}/{len(g) if g else 0} "
            f"对于 {pred_name or 'program'}。"
        )
        return ScoreFeedback(
            score=float(score),
            feedback=feedback,
        )

    return metric


def _extract_instruction_text(compiled: Any) -> str | None:
    """尽力提取优化的指令/提示。

    尝试在编译模块的常见位置查找，
    如果存在，则在 detailed_results 的最佳候选者中查找。
    """
    def _first_text(*candidates: Any) -> str | None:
        for c in candidates:
            if isinstance(c, str) and c.strip():
                return c.strip()
        return None

    # 直接位置
    instr = _first_text(
        getattr(compiled, "instruction", None),
        getattr(compiled, "instructions", None),
    )
    if instr:
        return instr

    # 常见的子持有者
    for child_name in ("predict", "predictor"):
        child = getattr(compiled, child_name, None)
        if child is None:
            continue
        instr = _first_text(
            getattr(child, "instruction", None),
            getattr(child, "instructions", None),
        )
        if instr:
            return instr
        sig = getattr(child, "signature", None)
        instr = _first_text(
            getattr(sig, "instructions", None),
            getattr(sig, "docstring", None),
        )
        if instr:
            return instr

    # 编译后的签名
    sig = getattr(compiled, "signature", None)
    instr = _first_text(
        getattr(sig, "instructions", None),
        getattr(sig, "docstring", None),
    )
    if instr:
        return instr

    # 回退到详细结果的最佳候选者
    results = getattr(compiled, "detailed_results", None)
    best = getattr(results, "best_candidate", None)
    if best is not None:
        instr = _first_text(
            getattr(best, "instruction", None),
            getattr(best, "instructions", None),
        )
        if instr:
            return instr
        sig = getattr(best, "signature", None)
        instr = _first_text(
            getattr(sig, "instructions", None),
            getattr(sig, "docstring", None),
        )
        if instr:
            return instr

    return None


@app.get("/health")
def health() -> Any:
    return jsonify({"status": "ok"})


@app.post("/optimize")
def optimize() -> Any:
    payload = request.get_json(force=True) or {}
    examples_input: List[Dict[str, Any]] = payload.get(
        "examples", []
    )
    max_metric_calls: int = int(
        payload.get("maxMetricCalls", 5)
    )
    auto_mode = payload.get("auto")  # 关闭|轻度|中度|重度
    candidate_selection = payload.get("candidateSelectionStrategy")
    reflection_minibatch_size = payload.get("reflectionMinibatchSize")
    use_merge = payload.get("useMerge")
    num_threads = payload.get("numThreads")

    # LMs 在导入时已配置；避免在此处重新配置

    trainset: List[dspy.Example] = []
    for ex in examples_input:
        trainset.append(
            dspy.Example(
                conversationContext=ex.get("conversationContext", ""),
                expectedTurnResponse=ex.get("expectedTurnResponse", ""),
            ).with_inputs("conversationContext")
        )

    program = build_program()
    metric = build_metric()

    # 运行 GEPA
    start = time.time()
    gepa = GEPA(
        metric=metric,
        reflection_lm=REFLECTION_LM,
        track_stats=True,
        max_metric_calls=max_metric_calls,
        add_format_failure_as_feedback=True,
        # 如果提供，则映射基本设置
        auto=auto_mode if auto_mode in (None, "light", "medium", "heavy") else None,
        candidate_selection_strategy=(
            candidate_selection if candidate_selection in (None, "pareto", "current_best") else "pareto"
        ),
        reflection_minibatch_size=(
            int(reflection_minibatch_size) if isinstance(reflection_minibatch_size, (int, float, str)) and str(reflection_minibatch_size) != "" else 3
        ),
        use_merge=bool(use_merge) if use_merge is not None else True,
        num_threads=(int(num_threads) if isinstance(num_threads, (int, float, str)) and str(num_threads) != "" else None),
    )
    compiled = gepa.compile(
        program,
        trainset=trainset,
        valset=trainset,
    )

    # 提取结果
    best_prog = getattr(compiled, "detailed_results", None)
    best_score = None
    if best_prog is not None:
        scores = getattr(best_prog, "val_aggregate_scores", None)
        idx = getattr(best_prog, "best_idx", None)
        if isinstance(scores, list) and isinstance(idx, int):
            try:
                best_score = float(scores[idx])
            except Exception:
                best_score = None

    instruction = _extract_instruction_text(compiled)
    demos: List[Any] = []
    optimized_program: Dict[str, Any] = {
        "bestScore": best_score if best_score is not None else 0,
        "instruction": instruction,
        "demos": demos,
        "examples": examples_input,
        "optimizerType": "GEPA",
        "optimizationTime": int((time.time() - start) * 1000),
        "totalRounds": None,
        "converged": None,
        "stats": getattr(best_prog, "val_aggregate_scores", None),
    }

    result: Dict[str, Any] = {
        "bestScore": optimized_program["bestScore"],
        "optimizedProgram": optimized_program,
        "stats": optimized_program.get("stats"),
    }
    return jsonify(result)


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    app.run(host="0.0.0.0", port=port)