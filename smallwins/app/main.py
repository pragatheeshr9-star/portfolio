from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .benchmark import Case, ExtractiveBaseline, evaluate, read_dataset

SAMPLE_DATASET = Path(__file__).resolve().parents[1] / "data" / "sample.jsonl"

app = FastAPI(
    title="SmallWins",
    version="0.1.0",
    description="Run a small, reproducible model benchmark against a fixed set of questions.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class BenchmarkCase(BaseModel):
    id: str = Field(min_length=1, max_length=100)
    prompt: str = Field(min_length=1, max_length=5000)
    expected: str = Field(min_length=1, max_length=5000)
    category: str = Field(default="custom", max_length=100)


class EvaluationRequest(BaseModel):
    cases: list[BenchmarkCase] = Field(default_factory=list, max_length=25)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mode": "local-extractive-baseline"}


@app.post("/v1/evaluate")
def run_evaluation(request: EvaluationRequest) -> dict[str, Any]:
    if request.cases:
        cases = [Case(**item.model_dump()) for item in request.cases]
        canonical_data = json.dumps(
            [item.model_dump() for item in request.cases],
            sort_keys=True,
            separators=(",", ":"),
        ).encode("utf-8")
        dataset_sha256 = hashlib.sha256(canonical_data).hexdigest()
    else:
        cases, dataset_sha256 = read_dataset(SAMPLE_DATASET)
    return evaluate(cases, [ExtractiveBaseline()], dataset_sha256)