# SteadyAgent

A constrained tool-plan runner with an HTTP API, an allowlisted tool registry, bounded
retries, and step-by-step execution traces. The local implementation has no model or
credential dependency: clients submit an explicit plan and the service executes only the
registered, read-only tools.

## Run locally

Requires Python 3.12+ and `uv`.

```powershell
uv sync --all-groups
uv run uvicorn app.main:app --reload --port 8001
```

Open `http://localhost:8001/docs` for the interactive API. Health is available at
`GET /health`, tools at `GET /v1/tools`, and plan execution at `POST /v1/run`.

Example request:

```json
{
  "goal": "Calculate a total and retrieve related notes",
  "steps": [
    {"tool": "calculate", "arguments": {"expression": "19.95 * 3"}},
    {"tool": "search_notes", "arguments": {"query": "grounded answers"}}
  ],
  "max_retries": 1
}
```

Only `calculate` and `search_notes` are registered. The calculator accepts numeric literals
and `+`, `-`, `*`, `/`; it never evaluates Python code. Unknown tools are blocked. Runs stop
at the first failure and include a structured failure code and timing trace. Retries are
bounded and apply only to tool execution failures.

## Test

```powershell
uv run pytest -q
```

## Container

```powershell
docker build -t steadyagent .
docker run --rm -p 8001:8000 steadyagent
```

The API is intentionally a deterministic execution service, not an autonomous LLM planner.
Connect a planner only behind the same validated request contract and tool allowlist.