.PHONY: setup ingest-fixture fixture-eval eval test run
setup:
	uv sync --all-groups
ingest-fixture:
	uv run python -m scripts.ingest_fixture
fixture-eval:
	uv run python -m scripts.create_fixture_eval
eval: ingest-fixture fixture-eval
	uv run python -m scripts.run_eval
test:
	uv run pytest -q
run:
	uv run uvicorn app.main:app --reload --port 8000
