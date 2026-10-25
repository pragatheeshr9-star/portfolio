from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_calculate_and_search_return_structured_trace() -> None:
    response = client.post(
        "/v1/run",
        json={
            "goal": "Calculate and find grounding notes",
            "steps": [
                {"tool": "calculate", "arguments": {"expression": "(8 + 4) / 2"}},
                {"tool": "search_notes", "arguments": {"query": "grounded answers"}},
            ],
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "succeeded"
    assert payload["outputs"][0]["result"]["value"] == 6
    assert payload["trace"][1]["status"] == "succeeded"


def test_calculator_rounds_floating_point_noise() -> None:
    response = client.post(
        "/v1/run",
        json={"goal": "Calculate a price", "steps": [{"tool": "calculate", "arguments": {"expression": "19.95 * 3"}}]},
    )
    assert response.json()["outputs"][0]["result"]["value"] == 59.85


def test_portfolio_origin_is_allowed_by_cors() -> None:
    response = client.get("/health", headers={"Origin": "http://localhost:3000"})
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_unknown_tool_is_blocked() -> None:
    response = client.post(
        "/v1/run",
        json={"goal": "Run a shell command", "steps": [{"tool": "shell", "arguments": {"command": "whoami"}}]},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "blocked"
    assert response.json()["trace"][0]["failure"] == "blocked_unsafe_action"


def test_arithmetic_rejects_code_execution() -> None:
    response = client.post(
        "/v1/run",
        json={"goal": "Evaluate an expression", "steps": [{"tool": "calculate", "arguments": {"expression": "__import__('os').getcwd()"}}]},
    )
    assert response.json()["status"] == "failed"
    assert response.json()["trace"][0]["failure"] == "invalid_arguments"