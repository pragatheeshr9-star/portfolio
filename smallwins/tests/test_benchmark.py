import json

import pytest
from fastapi.testclient import TestClient

from app.benchmark import Case, ExtractiveBaseline, Generation, evaluate, read_dataset, token_f1
from app.main import app

client = TestClient(app)


def test_http_demo_runs_sample_benchmark_with_portfolio_cors() -> None:
    response = client.post("/v1/evaluate", headers={"Origin": "http://localhost:3000"}, json={})
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
    assert response.json()["dataset"]["cases"] == 3
    assert response.json()["candidates"][0]["model"] == "extractive-local"


def test_http_demo_accepts_custom_case() -> None:
    response = client.post(
        "/v1/evaluate",
        json={
            "cases": [
                {
                    "id": "retention",
                    "prompt": "Passage: Retention is 30 days. Question: What is retention?",
                    "expected": "Retention is 30 days.",
                }
            ]
        },
    )
    assert response.status_code == 200
    assert response.json()["dataset"]["cases"] == 1


def test_sample_dataset_runs_with_local_candidate(tmp_path) -> None:
    dataset = tmp_path / "sample.jsonl"
    dataset.write_text(
        '{"id":"period","prompt":"Passage: The retention period is 30 days. Question: What is the retention period?","expected":"The retention period is 30 days."}\n',
        encoding="utf-8",
    )
    cases, digest = read_dataset(dataset)
    report = evaluate(cases, [ExtractiveBaseline()], digest)
    result = report["candidates"][0]
    assert result["failed_cases"] == 0
    assert result["exact_match_rate"] == 1
    assert len(report["dataset"]["sha256"]) == 64


def test_dataset_rejects_duplicate_ids(tmp_path) -> None:
    dataset = tmp_path / "duplicate.jsonl"
    row = {"id": "same", "prompt": "Question", "expected": "Answer"}
    dataset.write_text(json.dumps(row) + "\n" + json.dumps(row), encoding="utf-8")
    with pytest.raises(ValueError, match="Duplicate case id"):
        read_dataset(dataset)


def test_token_f1_handles_partial_match() -> None:
    assert token_f1("a blue car", "a red car") == pytest.approx(2 / 3)


def test_candidate_failures_are_recorded_without_aborting() -> None:
    class BrokenCandidate:
        name = "broken"

        def generate(self, prompt: str) -> Generation:
            raise TimeoutError("provider timed out")

    report = evaluate([Case("case", "question", "answer")], [BrokenCandidate()], "hash")
    assert report["candidates"][0]["failed_cases"] == 1
    assert "TimeoutError" in report["candidates"][0]["rows"][0]["error"]