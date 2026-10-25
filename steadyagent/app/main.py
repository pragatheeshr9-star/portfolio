from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .core import TOOLS, run_plan

app = FastAPI(
    title="SteadyAgent",
    version="0.1.0",
    description="A constrained tool-plan runner with structured execution traces.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class ToolStep(BaseModel):
    tool: str = Field(min_length=1, max_length=80)
    arguments: dict[str, Any] = Field(default_factory=dict)


class RunRequest(BaseModel):
    goal: str = Field(min_length=3, max_length=500)
    steps: list[ToolStep] = Field(min_length=1, max_length=8)
    max_retries: int = Field(default=1, ge=0, le=2)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/v1/tools")
def list_tools() -> dict[str, list[str]]:
    return {"tools": sorted(TOOLS)}


@app.post("/v1/run")
def run(request: RunRequest) -> dict[str, Any]:
    result = run_plan(
        [step.model_dump() for step in request.steps],
        max_retries=request.max_retries,
    )
    return {"goal": request.goal, **result}