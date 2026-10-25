from typing import Any

from fastapi import FastAPI, Header, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .gateway import BudgetExceeded, Ledger, Settings, authenticated_user, create_completion


def create_app(settings: Settings | None = None, provider_transport: Any = None) -> FastAPI:
    configuration = settings or Settings.from_env()
    if configuration.provider_base_url and not configuration.access_tokens:
        raise ValueError("Configure TOKENSENSE_API_KEYS before enabling a provider.")
    ledger = Ledger(configuration.database_path)
    application = FastAPI(
        title="TokenSense",
        version="0.1.0",
        description="A budget-aware OpenAI-compatible model gateway.",
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
        allow_methods=["GET", "POST"],
        allow_headers=["Authorization", "Content-Type"],
        expose_headers=["X-TokenSense-Cache", "X-TokenSense-Route"],
    )

    class ChatRequest(BaseModel):
        model: str = "auto"
        messages: list[dict[str, Any]] = Field(min_length=1, max_length=64)
        max_tokens: int = Field(default=256, ge=1, le=8192)
        temperature: float = Field(default=0.2, ge=0, le=2)

    @application.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok", "mode": "upstream" if configuration.provider_base_url else "local-demo"}

    @application.post("/v1/chat/completions")
    def chat_completion(
        request: ChatRequest,
        response: Response,
        authorization: str = Header(default=""),
    ) -> dict[str, Any]:
        try:
            user_id = authenticated_user(configuration, authorization)
            result, headers = create_completion(
                configuration,
                ledger,
                request.model_dump(),
                user_id,
                provider_transport,
            )
        except BudgetExceeded as error:
            raise HTTPException(status_code=429, detail=str(error)) from error
        except PermissionError as error:
            raise HTTPException(status_code=401, detail=str(error), headers={"WWW-Authenticate": "Bearer"}) from error
        except RuntimeError as error:
            raise HTTPException(status_code=502, detail=str(error)) from error
        for name, value in headers.items():
            response.headers[name] = value
        return result

    return application


app = create_app()