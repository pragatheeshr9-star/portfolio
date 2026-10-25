import json

import httpx
from fastapi.testclient import TestClient

from app.gateway import Settings
from app.main import create_app


def make_client(tmp_path, **settings_values):
    settings = Settings(database_path=str(tmp_path / "tokensense.sqlite3"), **settings_values)
    return TestClient(create_app(settings))


def test_local_completion_and_user_scoped_cache(tmp_path) -> None:
    client = make_client(tmp_path, access_tokens={"one": "token-one", "two": "token-two"})
    first = client.post("/v1/chat/completions", headers={"Authorization": "Bearer token-one"}, json={"messages": [{"role": "user", "content": "Explain grounded citations"}]})
    second = client.post("/v1/chat/completions", headers={"Authorization": "Bearer token-one"}, json={"messages": [{"role": "user", "content": "Explain grounded citations"}]})
    other_user = client.post("/v1/chat/completions", headers={"Authorization": "Bearer token-two"}, json={"messages": [{"role": "user", "content": "Explain grounded citations"}]})
    assert first.status_code == 200
    assert first.json()["model"] == "local-deterministic"
    assert second.headers["x-tokensense-cache"] == "HIT"
    assert other_user.headers["x-tokensense-cache"] == "MISS"


def test_portfolio_origin_is_allowed_by_cors(tmp_path) -> None:
    client = make_client(tmp_path)
    response = client.get("/health", headers={"Origin": "http://localhost:3000"})
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
    assert "X-TokenSense-Cache" in response.headers["access-control-expose-headers"]
    assert "X-TokenSense-Route" in response.headers["access-control-expose-headers"]


def test_semantic_cache_does_not_reuse_unrelated_prompt(tmp_path) -> None:
    client = make_client(tmp_path)
    client.post("/v1/chat/completions", json={"messages": [{"role": "user", "content": "Explain grounded citations"}]})
    response = client.post("/v1/chat/completions", json={"messages": [{"role": "user", "content": "What is the weather in Tokyo?"}]})
    assert response.headers["x-tokensense-cache"] == "MISS"


def test_budget_is_enforced_before_upstream_call(tmp_path) -> None:
    client = make_client(
        tmp_path,
        provider_base_url="https://provider.invalid/v1",
        access_tokens={"test-user": "test-token"},
        daily_budget_usd=0.0000001,
    )
    response = client.post("/v1/chat/completions", headers={"Authorization": "Bearer test-token"}, json={"messages": [{"role": "user", "content": "hello"}], "max_tokens": 1000})
    assert response.status_code == 429


def test_upstream_failure_falls_back_to_other_model(tmp_path) -> None:
    calls = []

    def provider(request: httpx.Request) -> httpx.Response:
        payload = json.loads(request.content)
        calls.append(payload["model"])
        if len(calls) == 1:
            return httpx.Response(503, json={"error": "temporary"})
        return httpx.Response(200, json={"id": "ok", "model": payload["model"], "choices": [], "usage": {"prompt_tokens": 4, "completion_tokens": 2}})

    settings = Settings(database_path=str(tmp_path / "tokensense.sqlite3"), provider_base_url="https://provider.invalid/v1", access_tokens={"test-user": "test-token"})
    application = create_app(settings, httpx.MockTransport(provider))
    response = TestClient(application).post("/v1/chat/completions", headers={"Authorization": "Bearer test-token"}, json={"messages": [{"role": "user", "content": "hello"}]})
    assert response.status_code == 200
    assert calls == [settings.cheap_model, settings.quality_model]
    assert response.headers["x-tokensense-route"] == settings.quality_model


def test_provider_mode_requires_valid_bearer_token(tmp_path) -> None:
    client = make_client(tmp_path, provider_base_url="https://provider.invalid/v1", access_tokens={"test-user": "test-token"})
    response = client.post("/v1/chat/completions", json={"messages": [{"role": "user", "content": "hello"}]})
    assert response.status_code == 401