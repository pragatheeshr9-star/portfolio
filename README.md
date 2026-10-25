# Pragatheesh Portfolio

## Run the portfolio

Requires Node.js and npm.

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`. Create a production build with `npm run build`.

## Start the full stack

With Docker Desktop running, start the website and all four APIs together:

```powershell
docker compose up --build
```

Open `http://localhost:3000`. The APIs are available on ports 8000–8003, and the site waits
for their health checks before starting. GroundTruth logs/evaluation artifacts and the
TokenSense SQLite ledger use named volumes and survive container restarts. Stop the stack
with `Ctrl+C`, then run `docker compose down` to remove the containers while keeping those
volumes.

This Compose file binds its ports to `127.0.0.1` for local use. For a public deployment,
put the web service behind a TLS reverse proxy and review the port bindings, CORS origins,
provider credentials, and database backup policy first.

## Run the projects

Each project is an independent Python 3.12+ package. Install `uv`, open a terminal in the
project folder, then run its commands below. Each service has its own README, tests, and
Dockerfile.

The portfolio demos call these local APIs on ports 8000–8003. Start each API in its own
terminal to make all four demos available; an offline demo shows its exact startup command.

### GroundTruth

Evaluation-first documentation RAG API. The repository includes a local fixture index; if
it is missing, create one before starting the API.

```powershell
cd groundtruth
uv sync --all-groups
uv run python -m scripts.ingest_fixture
uv run uvicorn app.main:app --reload --port 8000
```

API docs: `http://localhost:8000/docs`.

### SteadyAgent

Constrained tool-plan API. It accepts explicit plans and runs only its allowlisted tools.

```powershell
cd steadyagent
uv sync --all-groups
uv run uvicorn app.main:app --reload --port 8001
```

API docs: `http://localhost:8001/docs`.

### TokenSense

OpenAI-compatible gateway. It starts in deterministic local-demo mode without credentials.
Configure a provider and `TOKENSENSE_API_KEYS` before enabling paid model traffic.

```powershell
cd tokensense
uv sync --all-groups
uv run uvicorn app.main:app --reload --port 8002
```

API docs: `http://localhost:8002/docs`. See [tokensense/README.md](tokensense/README.md) for
upstream, token, price, and persistent-volume configuration.

### SmallWins

Offline benchmark smoke test. It writes a dated JSON report under `results/`.

```powershell
cd smallwins
uv sync --all-groups
uv run python -m app.cli --dataset data/sample.jsonl --output-dir results
```

To enable the browser demo API on port 8003, run this in the same project folder:

```powershell
uv run uvicorn app.main:app --reload --port 8003
```

See [smallwins/README.md](smallwins/README.md) to configure OpenAI-compatible models and
record their token prices.

Run a package's test suite from that package directory with `uv run pytest -q`.
