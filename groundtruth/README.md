# GroundTruth

GroundTruth is an evaluation-first RAG service for technical documentation. It returns a
cited answer or abstains, and saves reproducible evaluation results rather than relying on
demo claims.

## Run locally

```powershell
cd groundtruth
$env:UV_CACHE_DIR = "$PWD\.uv-cache"
uv sync --all-groups
make eval
make run
```

Then query `POST http://localhost:8000/v1/query` with `{"query":"What does len return?"}`.
`docker compose up --build` is supplied for environments with Docker installed.

## Architecture

```text
versioned HTML docs -> structure-preserving parser -> chunks + vectors -> retrieval
                                                                  |                 |
                                                             citations <--- abstain / answer
                                                                  |
                                                        JSONL telemetry + eval artifacts
```

## Observed fixture baseline

Command: `uv run python -m scripts.run_eval` on 2026-10-18 UTC.

| Metric | Observed value | Scope |
| --- | ---: | --- |
| Cases | 100 | synthetic fixture |
| Recall@4 / MRR | 1.000 / 1.000 | fixture only |
| Abstention accuracy | 1.000 | fixture only |
| p50 / p95 latency | 0.456 / 0.579 ms | local run |
| Model cost | $0.00 | deterministic fallback |

The source artifact is `results/fixture-baseline-20261018T050818Z.json`. It uses repeated
synthetic cases over five fixture chunks, a deterministic hash vector fallback, and proxy
correctness/faithfulness metrics. It must not be used as a claim about semantic retrieval,
the full Python corpus, or real users.

## Current limitations

- Full Python 3.12 corpus acquisition and a hand-checked public-corpus set remain pending.
- The no-cost hash fallback is a smoke-test embedder, not a semantic embedding model.
- The extractive answer baseline is intentionally simple; no LLM judge or human agreement
  result exists.
- Docker was not executed because Docker is not installed in this workspace.

See `docs/DECISIONS.md` and `docs/WHAT_FAILED.md` for explicit tradeoffs and failures.
