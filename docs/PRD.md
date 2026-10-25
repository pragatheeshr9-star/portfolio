# Product Requirements Document — Technical-Documentation RAG Evaluation Harness

## Product and user problem

**User:** a software engineer who needs a trustworthy, source-verifiable answer while
working in a large technical documentation set.

**Job to be done:** when I ask a question about a versioned technical system, help me find
the supporting documentation and give a concise answer that I can verify without manually
searching many pages.

Keyword search returns links but requires synthesis; generic chat can produce fluent,
uncited, or version-mixed answers. Neither makes retrieval quality, answer grounding,
abstention behavior, latency, or cost measurable. This project is a RAG system under test;
its primary product is a reproducible evaluation and failure-analysis harness.

## Corpus choice

The fixed initial corpus is the **Python 3.12 documentation snapshot** from
`https://docs.python.org/3.12/`, including the tutorial, language reference, standard
library reference, and selected HOWTOs. The ingestion manifest will pin URLs, retrieval
timestamp, content hashes, and the corpus version. The official site describes it as
Python 3.12.15 documentation and contains distinct tutorial, library, language, setup, and
HOWTO sections. Documentation is licensed under PSF License Version 2 (with code examples
also available under Zero-Clause BSD), permitting reproducible local copies with required
attribution and license notice.

Why this corpus: it is public, stable by version, broad enough for single-hop and
multi-hop questions, has headings, code blocks, parameter tables, and cross-references,
and contains no user-private data. It is deliberately HTML documentation rather than PDFs:
the MVP's "layout-aware parsing" means preserving HTML heading hierarchy, tables, code
blocks, lists, anchors, and source URLs. This is more faithful to the selected source than
OCR and makes parsing failures testable.

## Metrics and release gates

**North-star metric:** grounded-answer pass rate: the proportion of answerable evaluation
questions whose answer is correct, fully supported by at least one cited source span, and
whose cited source is relevant.

**Input metrics:** retrieval Recall@k and MRR; answer correctness; faithfulness; citation
precision/recall; abstention accuracy, split by answerable and unanswerable cases.

**Guardrails:** p50/p95 end-to-end and retrieval latency; tokens and USD cost per query;
corpus-ingestion success rate; prompt-injection compliance rate (must be zero); unsupported
claim rate; error rate. Initial thresholds are intentionally **TBD after a recorded baseline**;
CI must never claim a quality threshold before that baseline is reviewed and documented.

## MVP

- Reproducibly fetch, license/attribute, parse, normalize, and version the corpus.
- Dense-embedding retrieval only, page/section-aware chunks, and a FastAPI query API.
- A simple citation-producing generation adapter, with an explicit abstain outcome when
  evidence is insufficient. A deterministic extractive fallback enables low-cost tests.
- Per-query structured logs for latency, model tokens, and calculated cost; zero cost is
  recorded when no paid model is used.
- A versioned, hand-checked evaluation set of at least 100 questions spanning single-hop,
  multi-hop, table-based, and unanswerable categories.
- One-command reproducible evaluation; machine-readable dated run artifacts; unit,
  integration, safety, and regression tests; Docker Compose and GitHub Actions.

## V2

Controlled, one-variable-at-a-time ablations of chunk size/overlap, BM25, hybrid retrieval,
reranking, query rewriting, top-k, and abstention thresholds; Pareto comparison of quality,
cost, and latency. Add a validated LLM judge only after a human-labelled sample establishes
judge–human agreement. Optional tracing integration follows only if local structured logs
cannot answer debugging needs.

## Non-goals

- A general web-search assistant, agentic browsing, multi-tenant SaaS, authentication, or
  user document upload.
- Claims of enterprise scale, production readiness, or model quality without an observed run.
- Benchmarking model knowledge rather than the specified corpus.
- OCR/PDF support in this MVP; it is not required by the chosen HTML corpus and would dilute
  the retrieval-evaluation focus.

## Risks and mitigations

| Risk | Mitigation and test |
| --- | --- |
| Hallucinated or unsupported answers | Citation-required contract, evidence checks, abstention; faithfulness/citation evals. |
| Retrieval miss or poor ranking | Gold source spans; Recall@k/MRR; failure taxonomy and controlled ablations. |
| Prompt injection in source text | Treat documents as data, isolate instructions, refusal policy; adversarial fixture tests. |
| Version drift | Pinned 3.12 manifest, hashes, source URLs, and dated corpus snapshot. |
| Cost/latency regression | Per-query accounting and CI comparison against reviewed baseline thresholds. |
| Evaluation leakage or weak labels | Separate author/reviewer records, held-out cases, source-span verification, documented provenance. |
| Licensing/attribution failure | Preserve source, version, license notice, and attribution in corpus manifest and README. |

## Rollout plan

1. Establish corpus manifest, product contract, and a no-claims baseline.
2. Ship dense retrieval and record the first baseline evaluation before any optimization.
3. Add the evaluation harness and human-label protocol; calibrate release thresholds from
   observed data.
4. Run controlled ablations, classify every failure, and only retain improvements that
   improve the measured Pareto frontier.
5. Gate changes in CI, publish reproducible results, limitations, and evidence-backed
   portfolio material.

## Decision record

**Chosen now:** Python 3.12 HTML documentation, local reproducible corpus snapshot, and an
evaluation-first release sequence. **Revisit if:** HTML parsing cannot preserve the required
tables/headings, corpus breadth cannot support 100 valid questions, or a materially more
representative public corpus offers a stable version and compatible license.
