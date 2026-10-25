from __future__ import annotations

import json
import statistics
import time
from datetime import UTC, datetime
from pathlib import Path

from app.core import answer

ROOT = Path(__file__).resolve().parents[1]
CASES = ROOT / "data" / "evals" / "fixture_v1.jsonl"
RESULTS = ROOT / "results"


def reciprocal_rank(headings: list[str], target: str | None) -> float:
    if not target:
        return 0.0
    for position, heading in enumerate(headings, start=1):
        if heading == target:
            return 1 / position
    return 0.0


def percentile(values: list[float], fraction: float) -> float:
    return sorted(values)[max(0, min(len(values) - 1, int(len(values) * fraction) - 1))]


def main() -> None:
    if not CASES.exists():
        raise SystemExit("Evaluation fixture missing. Run `python -m scripts.create_fixture_eval`.")
    cases = [json.loads(line) for line in CASES.read_text(encoding="utf-8").splitlines()]
    rows, latencies = [], []
    for case in cases:
        result = answer(case["query"])
        citations = result["citations"]
        headings = [citation["heading"] for citation in citations]
        rr = reciprocal_rank(headings, case["gold_heading"])
        retrieval_hit = rr > 0
        abstention_correct = result["abstained"] is (not case["answerable"])
        # In the deterministic extractive baseline, supported citation presence is a
        # transparent proxy—not a substitute for human/LLM correctness judgement.
        correctness_proxy = retrieval_hit and not result["abstained"] if case["answerable"] else abstention_correct
        row = {**case, "abstained": result["abstained"], "retrieval_hit_at_4": retrieval_hit, "mrr": rr, "abstention_correct": abstention_correct, "correctness_proxy": correctness_proxy, "citation_accuracy_proxy": retrieval_hit if case["answerable"] else result["abstained"], "faithfulness_proxy": bool(citations) and not result["abstained"], "latency_ms": result["telemetry"]["latency_ms"], "cost_usd": result["telemetry"]["cost_usd"]}
        rows.append(row)
        latencies.append(row["latency_ms"])
    answerable = [row for row in rows if row["answerable"]]
    summary = {"run_at": datetime.now(UTC).isoformat(), "dataset": "fixture_v1", "dataset_provenance": "synthetic_fixture", "cases": len(rows), "answerable_cases": len(answerable), "retrieval_recall_at_4": sum(row["retrieval_hit_at_4"] for row in answerable) / len(answerable), "mrr": sum(row["mrr"] for row in answerable) / len(answerable), "correctness_proxy": sum(row["correctness_proxy"] for row in rows) / len(rows), "citation_accuracy_proxy": sum(row["citation_accuracy_proxy"] for row in rows) / len(rows), "faithfulness_proxy": sum(row["faithfulness_proxy"] for row in answerable) / len(answerable), "abstention_accuracy": sum(row["abstention_correct"] for row in rows) / len(rows), "p50_latency_ms": statistics.median(latencies), "p95_latency_ms": percentile(latencies, 0.95), "cost_usd": sum(row["cost_usd"] for row in rows), "limitations": ["Synthetic fixture only; not the hand-checked Python 3.12 benchmark.", "Correctness and faithfulness are deterministic proxies; human or validated-judge assessment is pending.", "Hash fallback is not a semantic embedding model."], "rows": rows}
    RESULTS.mkdir(exist_ok=True)
    stamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    output = RESULTS / f"fixture-baseline-{stamp}.json"
    output.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps({key: value for key, value in summary.items() if key not in {"rows", "limitations"}}, indent=2))
    print(f"Saved {output}")


if __name__ == "__main__":
    main()
