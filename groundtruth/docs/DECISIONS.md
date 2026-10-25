# Decisions

| Decision | Chosen | Tradeoff / revisit trigger |
| --- | --- | --- |
| Corpus | Python 3.12 HTML docs | Versioned and licensed; fetch/full manifest pending. |
| Parsing | Preserve HTML headings, tables, lists, and code | Fits corpus better than PDF OCR. |
| Baseline retrieval | Dense-vector interface with deterministic local fallback | Runnable at $0, but not semantic; replace with a recorded model-backed run. |
| Answering | Extractive cited response with abstention | Maximizes inspectability; insufficient for richer synthesis. |
| Storage | Local JSON index and JSONL telemetry | Reproducible MVP; replace only if scale/concurrency requires it. |
| Release gate | No threshold until a reviewed baseline | Prevents invented quality targets. |
