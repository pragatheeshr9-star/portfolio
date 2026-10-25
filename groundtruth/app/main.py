from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .core import answer, load_index

app = FastAPI(title="GroundTruth", version="0.1.0", description="Evaluation-first technical documentation RAG")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class QueryRequest(BaseModel):
    query: str = Field(min_length=3, max_length=1000)
    top_k: int = Field(default=4, ge=1, le=10)


@app.get("/health")
def health() -> dict[str, object]:
    try:
        _, chunks = load_index()
        return {"status": "ok", "indexed_chunks": len(chunks)}
    except FileNotFoundError:
        return {"status": "needs_ingestion", "indexed_chunks": 0}


@app.post("/v1/query")
def query(request: QueryRequest) -> dict[str, object]:
    try:
        return answer(request.query, request.top_k)
    except FileNotFoundError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
