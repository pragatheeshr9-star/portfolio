# SmallWins

A reproducible benchmark runner for comparing candidate models on a fixed JSONL dataset.
It records exact-match rate, token F1, p50/p95 observed latency, token counts, configured
cost, failures, and a SHA-256 digest of the dataset. A small extractive baseline runs
offline; remote candidates use an OpenAI-compatible chat-completions endpoint.

## Run the sample benchmark

Requires Python 3.12+ and `uv`.

```powershell
uv sync --all-groups
uv run python -m app.cli --dataset data/sample.jsonl --output-dir results
```

The JSON report is written to a dated file under `results/`. The sample cases only smoke-test
the harness; they are not a model-quality benchmark.

## Browser prototype API

The portfolio's interactive demo runs the same local extractive baseline over the included
sample set. Start the API from this folder:

```powershell
uv run uvicorn app.main:app --reload --port 8003
```

The service exposes `GET /health` and `POST /v1/evaluate`. Send an empty JSON object to run
the sample set, or pass up to 25 custom cases in a `cases` array. This local endpoint always
uses the extractive baseline; configure remote model comparisons through the CLI below.

## Compare remote models

Configure the endpoint and models through environment variables, or pass `--model` more
than once:

```powershell
$env:SMALLWINS_BASE_URL = "https://api.openai.com/v1"
$env:SMALLWINS_API_KEY = "set-this-in-your-secret-manager"
$env:SMALLWINS_MODELS = "gpt-4o-mini,gpt-4o"
$env:SMALLWINS_MODEL_PRICES = '{"gpt-4o-mini":{"input_per_million":0.15,"output_per_million":0.60},"gpt-4o":{"input_per_million":2.50,"output_per_million":10.0}}'
uv run python -m app.cli --dataset data/sample.jsonl --output-dir results
```

Update prices from the provider's current published rates. Missing prices default to zero and
must not be mistaken for free model usage. The harness sends requests sequentially with a
fixed temperature of zero, so each candidate receives the same prompt. Keep provider keys in
environment variables or a secret manager.

## Dataset format

Each UTF-8 JSONL row has a unique `id`, `prompt`, and reference `expected` answer. An optional
`category` field supports later slice analysis. Use hand-checked references, a documented
data split, and a task-specific evaluation protocol before drawing conclusions. Reports
include automatic metrics, not human judgments or a universal model winner.

## Test

```powershell
uv run pytest -q
```

## Container

```powershell
docker build -t smallwins .
docker run --rm -v smallwins-results:/app/results smallwins
```

Pass dataset and output arguments after the image name to override defaults. Mount custom
datasets read-only into the container and persist the report directory as a volume.