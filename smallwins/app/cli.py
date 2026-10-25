from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from .benchmark import ExtractiveBaseline, OpenAICompatibleCandidate, evaluate, read_dataset, write_report


def load_prices() -> dict[str, dict[str, float]]:
    raw = os.getenv("SMALLWINS_MODEL_PRICES", "{}")
    prices = json.loads(raw)
    if not isinstance(prices, dict):
        raise ValueError("SMALLWINS_MODEL_PRICES must be a JSON object.")
    return prices


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Compare model quality, latency, and cost on a fixed JSONL dataset.")
    parser.add_argument("--dataset", default="data/sample.jsonl", help="JSONL file with id, prompt, and expected fields")
    parser.add_argument("--output-dir", default="results", help="Directory for dated machine-readable reports")
    parser.add_argument("--model", action="append", default=[], help="Upstream model name; can be repeated")
    return parser


def main() -> int:
    arguments = build_parser().parse_args()
    try:
        cases, dataset_sha256 = read_dataset(arguments.dataset)
        base_url = os.getenv("SMALLWINS_BASE_URL", "").rstrip("/")
        models = arguments.model or [name.strip() for name in os.getenv("SMALLWINS_MODELS", "").split(",") if name.strip()]
        if models and not base_url:
            raise ValueError("Set SMALLWINS_BASE_URL to use remote models.")
        prices = load_prices()
        candidates = [ExtractiveBaseline()]
        candidates.extend(
            OpenAICompatibleCandidate(
                name=model,
                base_url=base_url,
                api_key=os.getenv("SMALLWINS_API_KEY", ""),
                input_per_million=float(prices.get(model, {}).get("input_per_million", 0.0)),
                output_per_million=float(prices.get(model, {}).get("output_per_million", 0.0)),
                timeout_seconds=float(os.getenv("SMALLWINS_TIMEOUT_SECONDS", "30")),
            )
            for model in models
        )
        report = evaluate(cases, candidates, dataset_sha256)
        path = write_report(report, arguments.output_dir)
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f"SmallWins: {error}", file=sys.stderr)
        return 2

    print(f"Cases: {len(cases)}")
    for result in report["candidates"]:
        print(f"{result['model']}: exact={result['exact_match_rate']:.3f} token_f1={result['mean_token_f1']:.3f} p95={result['p95_latency_ms']:.3f}ms cost=${result['total_cost_usd']:.6f} failed={result['failed_cases']}")
    print(f"Report: {Path(path).as_posix()}")
    return int(any(result["failed_cases"] for result in report["candidates"]))


if __name__ == "__main__":
    raise SystemExit(main())