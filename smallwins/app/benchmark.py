from __future__ import annotations

import hashlib
import json
import math
import re
import statistics
import time
from collections import Counter
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Protocol

import httpx

TOKEN_PATTERN = re.compile(r"[a-z0-9]+", re.I)


@dataclass(frozen=True)
class Case:
    id: str
    prompt: str
    expected: str
    category: str = "default"


@dataclass(frozen=True)
class Generation:
    text: str
    input_tokens: int
    output_tokens: int
    cost_usd: float


class Candidate(Protocol):
    name: str

    def generate(self, prompt: str) -> Generation: ...


class ExtractiveBaseline:
    name = "extractive-local"

    def generate(self, prompt: str) -> Generation:
        passage_match = re.search(r"Passage:\s*(.*?)\s*Question:", prompt, re.I | re.S)
        passage = passage_match.group(1).strip() if passage_match else prompt.strip()
        question = prompt.split("Question:", 1)[-1]
        question_terms = {token for token in TOKEN_PATTERN.findall(question.casefold()) if token not in {"what", "when", "where", "which", "who", "how", "is", "are", "the", "a", "an", "of", "for", "in", "to"}}
        sentences = re.split(r"(?<=[.!?])\s+", passage)
        scored = [
            (len(question_terms & set(TOKEN_PATTERN.findall(sentence.casefold()))), sentence)
            for sentence in sentences
        ]
        text = max(scored, key=lambda item: item[0])[1] if scored and max(scored, key=lambda item: item[0])[0] else ""
        return Generation(text, max(1, math.ceil(len(prompt) / 4)), max(1, math.ceil(len(text) / 4)), 0.0)


@dataclass(frozen=True)
class OpenAICompatibleCandidate:
    name: str
    base_url: str
    api_key: str = ""
    input_per_million: float = 0.0
    output_per_million: float = 0.0
    timeout_seconds: float = 30.0

    def generate(self, prompt: str) -> Generation:
        headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
        with httpx.Client(timeout=self.timeout_seconds) as client:
            response = client.post(
                f"{self.base_url.rstrip('/')}/chat/completions",
                headers=headers,
                json={"model": self.name, "messages": [{"role": "user", "content": prompt}], "temperature": 0},
            )
        response.raise_for_status()
        payload = response.json()
        text = payload["choices"][0]["message"]["content"]
        usage = payload.get("usage", {})
        input_tokens = int(usage.get("prompt_tokens", math.ceil(len(prompt) / 4)))
        output_tokens = int(usage.get("completion_tokens", math.ceil(len(text) / 4)))
        cost = (input_tokens * self.input_per_million + output_tokens * self.output_per_million) / 1_000_000
        return Generation(text, input_tokens, output_tokens, cost)


def read_dataset(path: str | Path) -> tuple[list[Case], str]:
    dataset_path = Path(path)
    raw = dataset_path.read_bytes()
    cases: list[Case] = []
    seen_ids: set[str] = set()
    for line_number, line in enumerate(raw.decode("utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError as error:
            raise ValueError(f"Invalid JSON on line {line_number} of {dataset_path}.") from error
        if not all(isinstance(row.get(key), str) and row[key].strip() for key in ("id", "prompt", "expected")):
            raise ValueError(f"Line {line_number} must include non-empty id, prompt, and expected strings.")
        if row["id"] in seen_ids:
            raise ValueError(f"Duplicate case id {row['id']!r} on line {line_number}.")
        seen_ids.add(row["id"])
        cases.append(Case(row["id"], row["prompt"], row["expected"], str(row.get("category", "default"))))
    if not cases:
        raise ValueError(f"Dataset {dataset_path} contains no cases.")
    return cases, hashlib.sha256(raw).hexdigest()


def normalize(text: str) -> str:
    return " ".join(TOKEN_PATTERN.findall(text.casefold()))


def token_f1(prediction: str, expected: str) -> float:
    predicted_tokens = Counter(TOKEN_PATTERN.findall(prediction.casefold()))
    expected_tokens = Counter(TOKEN_PATTERN.findall(expected.casefold()))
    overlap = sum((predicted_tokens & expected_tokens).values())
    if not predicted_tokens or not expected_tokens:
        return float(not predicted_tokens and not expected_tokens)
    precision = overlap / sum(predicted_tokens.values())
    recall = overlap / sum(expected_tokens.values())
    return 2 * precision * recall / (precision + recall) if precision + recall else 0.0


def percentile(values: list[float], quantile: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    return ordered[max(0, math.ceil(quantile * len(ordered)) - 1)]


def evaluate(cases: list[Case], candidates: list[Candidate], dataset_sha256: str) -> dict[str, Any]:
    candidate_reports = []
    for candidate in candidates:
        rows = []
        latencies: list[float] = []
        f1_scores: list[float] = []
        exact_scores: list[float] = []
        total_cost = 0.0
        for case in cases:
            started = time.perf_counter()
            try:
                generation = candidate.generate(case.prompt)
                latency_ms = round((time.perf_counter() - started) * 1000, 3)
                exact = float(normalize(generation.text) == normalize(case.expected))
                f1 = token_f1(generation.text, case.expected)
                latencies.append(latency_ms)
                exact_scores.append(exact)
                f1_scores.append(f1)
                total_cost += generation.cost_usd
                rows.append({"id": case.id, "category": case.category, "prediction": generation.text, "expected": case.expected, "exact_match": exact, "token_f1": round(f1, 6), "latency_ms": latency_ms, "input_tokens": generation.input_tokens, "output_tokens": generation.output_tokens, "cost_usd": generation.cost_usd, "error": None})
            except Exception as error:
                rows.append({"id": case.id, "category": case.category, "prediction": None, "expected": case.expected, "exact_match": 0.0, "token_f1": 0.0, "latency_ms": round((time.perf_counter() - started) * 1000, 3), "input_tokens": 0, "output_tokens": 0, "cost_usd": 0.0, "error": f"{type(error).__name__}: {error}"})
        candidate_reports.append({
            "model": candidate.name,
            "cases": len(cases),
            "successful_cases": len(exact_scores),
            "failed_cases": len(cases) - len(exact_scores),
            "exact_match_rate": round(statistics.mean(exact_scores), 6) if exact_scores else 0.0,
            "mean_token_f1": round(statistics.mean(f1_scores), 6) if f1_scores else 0.0,
            "p50_latency_ms": percentile(latencies, 0.50),
            "p95_latency_ms": percentile(latencies, 0.95),
            "total_cost_usd": round(total_cost, 8),
            "rows": rows,
        })
    return {
        "schema_version": 1,
        "run_at": datetime.now(UTC).isoformat(),
        "dataset": {"cases": len(cases), "sha256": dataset_sha256},
        "limitations": ["Exact match and token F1 are automatic metrics, not human quality judgments.", "Latency and cost are specific to this run, endpoint, region, and configured price table."],
        "candidates": candidate_reports,
    }


def write_report(report: dict[str, Any], output_dir: str | Path) -> Path:
    destination = Path(output_dir)
    destination.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    path = destination / f"benchmark-{timestamp}.json"
    path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return path