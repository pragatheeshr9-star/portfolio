# TokenSense

An OpenAI-compatible chat-completions gateway with model routing, a conservative
user-scoped similarity cache, per-user daily spend limits, and one alternate-model fallback.
SQLite stores the budget ledger and cache across restarts. The default local mode requires
no API key and returns a deterministic demo response.

## Run locally

Requires Python 3.12+ and `uv`.

```powershell
uv sync --all-groups
uv run uvicorn app.main:app --reload --port 8002
```

Open `http://localhost:8002/docs`. Send OpenAI-style requests to
`POST /v1/chat/completions`; `GET /health` reports whether the service is in local-demo or
upstream mode. Local mode is for development and does not generate model answers.

## Configure an upstream

Set these environment variables before starting the service:

```powershell
$env:TOKENSENSE_PROVIDER_BASE_URL = "https://api.openai.com/v1"
$env:TOKENSENSE_PROVIDER_API_KEY = "set-this-in-your-secret-manager"
$env:TOKENSENSE_API_KEYS = '{"demo-user":"set-a-separate-client-token"}'
$env:TOKENSENSE_DAILY_BUDGET_USD = "1.00"
$env:TOKENSENSE_DATABASE = "data/tokensense.sqlite3"
```

Provider mode refuses to start without `TOKENSENSE_API_KEYS`. The JSON value maps stable
user IDs to client bearer tokens; do not commit tokens to source control. Requests use
`Authorization: Bearer <client-token>`. The server uses the provider key only for upstream
calls. Keep the database on persistent storage when deploying, since it contains cache
entries and the daily spend ledger.

The default routing rule sends short prompts to the inexpensive configured model and longer
prompts to the quality model. Prices are configurable through `TOKENSENSE_CHEAP_*_PER_MILLION`
and `TOKENSENSE_QUALITY_*_PER_MILLION`; set them to match the provider's current pricing.
The service reserves the higher of the selected route and its fallback estimate before
calling upstream. A fallback is attempted once if the selected model fails. Budget accounting
and routing are operational guardrails, not a substitute for provider-side spending limits.

## Test

```powershell
uv run pytest -q
```

## Container

```powershell
docker build -t tokensense .
docker run --rm -p 8002:8000 -v tokensense-data:/data `
  -e TOKENSENSE_DATABASE=/data/tokensense.sqlite3 `
  -e TOKENSENSE_PROVIDER_BASE_URL=https://api.openai.com/v1 `
  -e TOKENSENSE_PROVIDER_API_KEY=... `
  -e TOKENSENSE_API_KEYS='{"demo-user":"replace-this"}' tokensense
```

Configure production tokens and provider credentials through the deployment platform's
secret manager rather than command history or a checked-in environment file.