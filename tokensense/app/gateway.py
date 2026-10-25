from __future__ import annotations

import json
import os
import re
import hmac
import sqlite3
import time
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import httpx

TOKEN_PATTERN = re.compile(r"[a-z0-9_]+", re.I)


@dataclass(frozen=True)
class Settings:
    database_path: str = "data/tokensense.sqlite3"
    provider_base_url: str = ""
    provider_api_key: str = ""
    access_tokens: dict[str, str] = field(default_factory=dict)
    cheap_model: str = "gpt-4o-mini"
    quality_model: str = "gpt-4o"
    quality_threshold_tokens: int = 120
    daily_budget_usd: float = 1.0
    cache_similarity: float = 0.96
    cheap_input_per_million: float = 0.15
    cheap_output_per_million: float = 0.60
    quality_input_per_million: float = 2.50
    quality_output_per_million: float = 10.0
    timeout_seconds: float = 20.0

    @classmethod
    def from_env(cls) -> Settings:
        access_tokens = json.loads(os.getenv("TOKENSENSE_API_KEYS", "{}"))
        if not isinstance(access_tokens, dict) or any(not isinstance(user, str) or not isinstance(token, str) for user, token in access_tokens.items()):
            raise ValueError("TOKENSENSE_API_KEYS must be a JSON object mapping user IDs to tokens.")
        return cls(
            database_path=os.getenv("TOKENSENSE_DATABASE", "data/tokensense.sqlite3"),
            provider_base_url=os.getenv("TOKENSENSE_PROVIDER_BASE_URL", "").rstrip("/"),
            provider_api_key=os.getenv("TOKENSENSE_PROVIDER_API_KEY", ""),
            access_tokens=access_tokens,
            cheap_model=os.getenv("TOKENSENSE_CHEAP_MODEL", "gpt-4o-mini"),
            quality_model=os.getenv("TOKENSENSE_QUALITY_MODEL", "gpt-4o"),
            quality_threshold_tokens=int(os.getenv("TOKENSENSE_QUALITY_THRESHOLD_TOKENS", "120")),
            daily_budget_usd=float(os.getenv("TOKENSENSE_DAILY_BUDGET_USD", "1.0")),
            cache_similarity=float(os.getenv("TOKENSENSE_CACHE_SIMILARITY", "0.96")),
            cheap_input_per_million=float(os.getenv("TOKENSENSE_CHEAP_INPUT_PER_MILLION", "0.15")),
            cheap_output_per_million=float(os.getenv("TOKENSENSE_CHEAP_OUTPUT_PER_MILLION", "0.60")),
            quality_input_per_million=float(os.getenv("TOKENSENSE_QUALITY_INPUT_PER_MILLION", "2.50")),
            quality_output_per_million=float(os.getenv("TOKENSENSE_QUALITY_OUTPUT_PER_MILLION", "10.0")),
            timeout_seconds=float(os.getenv("TOKENSENSE_TIMEOUT_SECONDS", "20")),
        )

    def price(self, model: str) -> tuple[float, float]:
        if model == self.cheap_model:
            return self.cheap_input_per_million, self.cheap_output_per_million
        return self.quality_input_per_million, self.quality_output_per_million


class BudgetExceeded(Exception):
    pass


class Ledger:
    def __init__(self, database_path: str) -> None:
        self.path = database_path
        Path(database_path).parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as connection:
            connection.execute("PRAGMA journal_mode=WAL")
            connection.execute("CREATE TABLE IF NOT EXISTS spend (user_id TEXT NOT NULL, day TEXT NOT NULL, amount REAL NOT NULL, PRIMARY KEY (user_id, day))")
            connection.execute("CREATE TABLE IF NOT EXISTS cache (user_id TEXT NOT NULL, model TEXT NOT NULL, prompt TEXT NOT NULL, response TEXT NOT NULL, created_at TEXT NOT NULL)")
            connection.execute("CREATE INDEX IF NOT EXISTS cache_lookup ON cache(user_id, model, created_at)")

    def connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, timeout=10)
        connection.row_factory = sqlite3.Row
        return connection

    @staticmethod
    def current_day() -> str:
        return datetime.now(UTC).date().isoformat()

    @staticmethod
    def normalize(text: str) -> str:
        return " ".join(TOKEN_PATTERN.findall(text.casefold()))

    @staticmethod
    def similarity(left: str, right: str) -> float:
        left_terms = set(TOKEN_PATTERN.findall(left.casefold()))
        right_terms = set(TOKEN_PATTERN.findall(right.casefold()))
        if not left_terms or not right_terms:
            return 0.0
        return len(left_terms & right_terms) / len(left_terms | right_terms)

    def find_cached(self, user_id: str, model: str, prompt: str, threshold: float) -> dict[str, Any] | None:
        normalized = self.normalize(prompt)
        with self.connect() as connection:
            rows = connection.execute(
                "SELECT prompt, response FROM cache WHERE user_id=? AND model=? ORDER BY created_at DESC LIMIT 200",
                (user_id, model),
            ).fetchall()
        best: tuple[float, str] | None = None
        for row in rows:
            score = self.similarity(normalized, row["prompt"])
            if best is None or score > best[0]:
                best = (score, row["response"])
        if best and best[0] >= threshold:
            return json.loads(best[1])
        return None

    def reserve(self, user_id: str, amount: float, limit: float) -> None:
        day = self.current_day()
        with self.connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute("SELECT amount FROM spend WHERE user_id=? AND day=?", (user_id, day)).fetchone()
            current = float(row["amount"]) if row else 0.0
            if current + amount > limit + 1e-12:
                connection.rollback()
                raise BudgetExceeded
            connection.execute(
                "INSERT INTO spend(user_id, day, amount) VALUES(?, ?, ?) ON CONFLICT(user_id, day) DO UPDATE SET amount=excluded.amount",
                (user_id, day, current + amount),
            )
            connection.commit()

    def settle(self, user_id: str, reserved: float, actual: float) -> None:
        self._adjust_spend(user_id, actual - reserved)

    def release(self, user_id: str, reserved: float) -> None:
        self._adjust_spend(user_id, -reserved)

    def _adjust_spend(self, user_id: str, delta: float) -> None:
        day = self.current_day()
        with self.connect() as connection:
            connection.execute(
                "INSERT INTO spend(user_id, day, amount) VALUES(?, ?, ?) ON CONFLICT(user_id, day) DO UPDATE SET amount=max(0, amount + ?)",
                (user_id, day, max(0.0, delta), delta),
            )

    def cache_response(self, user_id: str, model: str, prompt: str, response: dict[str, Any]) -> None:
        with self.connect() as connection:
            connection.execute(
                "INSERT INTO cache(user_id, model, prompt, response, created_at) VALUES(?, ?, ?, ?, ?)",
                (user_id, model, self.normalize(prompt), json.dumps(response), datetime.now(UTC).isoformat()),
            )

    def spent_today(self, user_id: str) -> float:
        with self.connect() as connection:
            row = connection.execute("SELECT amount FROM spend WHERE user_id=? AND day=?", (user_id, self.current_day())).fetchone()
        return float(row["amount"]) if row else 0.0


def estimate_tokens(text: str) -> int:
    return max(1, (len(text) + 3) // 4)


def estimate_cost(settings: Settings, model: str, input_tokens: int, output_tokens: int) -> float:
    input_price, output_price = settings.price(model)
    return (input_tokens * input_price + output_tokens * output_price) / 1_000_000


def authenticated_user(settings: Settings, authorization: str) -> str:
    if not settings.access_tokens:
        return "local"
    scheme, _, presented_token = authorization.partition(" ")
    if scheme.casefold() != "bearer" or not presented_token:
        raise PermissionError("Bearer token required.")
    for user_id, expected_token in settings.access_tokens.items():
        if hmac.compare_digest(presented_token, expected_token):
            return user_id
    raise PermissionError("Invalid bearer token.")


def create_completion(
    settings: Settings,
    ledger: Ledger,
    request: dict[str, Any],
    user_id: str,
    transport: httpx.BaseTransport | None = None,
) -> tuple[dict[str, Any], dict[str, str]]:
    prompt = "\n".join(str(message.get("content", "")) for message in request["messages"])
    input_tokens = estimate_tokens(prompt)
    chosen_model = "local-deterministic"
    if settings.provider_base_url:
        chosen_model = settings.quality_model if input_tokens > settings.quality_threshold_tokens else settings.cheap_model

    cached = ledger.find_cached(user_id, chosen_model, prompt, settings.cache_similarity)
    if cached is not None:
        return cached, {"X-TokenSense-Cache": "HIT", "X-TokenSense-Route": chosen_model}

    output_limit = int(request.get("max_tokens", 256))
    possible_models = [chosen_model]
    if chosen_model == settings.cheap_model:
        possible_models.append(settings.quality_model)
    reservation_model = max(possible_models, key=lambda model: estimate_cost(settings, model, input_tokens, output_limit))
    reserved = estimate_cost(settings, reservation_model, input_tokens, output_limit) if settings.provider_base_url else 0.0
    try:
        ledger.reserve(user_id, reserved, settings.daily_budget_usd)
    except BudgetExceeded as error:
        raise BudgetExceeded("Daily user budget exceeded.") from error

    try:
        if not settings.provider_base_url:
            response = {
                "id": f"local-{time.time_ns()}",
                "object": "chat.completion",
                "created": int(time.time()),
                "model": chosen_model,
                "choices": [{"index": 0, "message": {"role": "assistant", "content": f"[TokenSense local demo] {prompt[-1000:] or 'Send a message to begin.'}"}, "finish_reason": "stop"}],
                "usage": {"prompt_tokens": input_tokens, "completion_tokens": 1, "total_tokens": input_tokens + 1},
            }
            actual = 0.0
        else:
            response, chosen_model = _forward(settings, request, chosen_model, transport)
            usage = response.get("usage", {})
            actual = estimate_cost(settings, chosen_model, int(usage.get("prompt_tokens", input_tokens)), int(usage.get("completion_tokens", 0)))
        ledger.settle(user_id, reserved, actual)
        ledger.cache_response(user_id, chosen_model, prompt, response)
        return response, {"X-TokenSense-Cache": "MISS", "X-TokenSense-Route": chosen_model}
    except Exception:
        ledger.release(user_id, reserved)
        raise


def _forward(
    settings: Settings,
    request: dict[str, Any],
    model: str,
    transport: httpx.BaseTransport | None,
) -> tuple[dict[str, Any], str]:
    fallback = settings.quality_model if model == settings.cheap_model else settings.cheap_model
    last_error: Exception | None = None
    for candidate in (model, fallback):
        payload = {**request, "model": candidate}
        headers = {"Authorization": f"Bearer {settings.provider_api_key}"} if settings.provider_api_key else {}
        try:
            with httpx.Client(transport=transport, timeout=settings.timeout_seconds) as client:
                response = client.post(f"{settings.provider_base_url}/chat/completions", json=payload, headers=headers)
            response.raise_for_status()
            return response.json(), candidate
        except (httpx.HTTPError, ValueError) as error:
            last_error = error
    raise RuntimeError("Configured model provider and fallback both failed.") from last_error