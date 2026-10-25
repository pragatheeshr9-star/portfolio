from __future__ import annotations

import hashlib
import json
import math
import re
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
INDEX_PATH = DATA / "index.json"
LOG_PATH = DATA / "logs" / "queries.jsonl"

TOKEN = re.compile(r"[a-zA-Z_][a-zA-Z0-9_]{1,}")
INJECTION = re.compile(r"(?:ignore|disregard|override).{0,60}(?:instruction|system|previous)|(?:reveal|print).{0,40}(?:secret|prompt)", re.I)
STOPWORDS = {"a", "an", "and", "are", "does", "for", "how", "in", "is", "it", "of", "the", "to", "what", "when", "where", "which", "with"}


@dataclass(frozen=True)
class Chunk:
    id: str
    url: str
    title: str
    heading: str
    text: str
    ordinal: int


@dataclass(frozen=True)
class Citation:
    chunk_id: str
    url: str
    title: str
    heading: str
    excerpt: str
    score: float


class HashEmbedder:
    """Offline dense-vector fallback. It is deterministic, cheap, and not semantic.

    Use only for smoke tests or fixture evaluation. Production measurement should set a
    model-backed provider and record its model/version in the run manifest.
    """

    dimension = 384
    provider = "deterministic-hash-fallback"
    model = "token-hash-384"
    unit_cost_usd = 0.0

    def embed(self, texts: Iterable[str]) -> np.ndarray:
        matrix: list[np.ndarray] = []
        for text in texts:
            vector = np.zeros(self.dimension, dtype=np.float32)
            for token in TOKEN.findall(text.lower()):
                digest = hashlib.blake2b(token.encode(), digest_size=8).digest()
                bucket = int.from_bytes(digest, "little") % self.dimension
                vector[bucket] += 1.0
            norm = np.linalg.norm(vector)
            matrix.append(vector / norm if norm else vector)
        return np.array(matrix, dtype=np.float32)


def parse_html(html: str, url: str) -> list[Chunk]:
    """Preserve title, heading hierarchy, tables, lists, and code as chunk metadata."""
    soup = BeautifulSoup(html, "html.parser")
    for unwanted in soup.select("script, style, nav, footer, .sidebar"):
        unwanted.decompose()
    title = soup.title.get_text(" ", strip=True) if soup.title else url
    chunks: list[Chunk] = []
    heading = title
    buffer: list[str] = []
    ordinal = 0

    def flush() -> None:
        nonlocal ordinal
        text = "\n".join(buffer).strip()
        if text:
            identifier = hashlib.sha256(f"{url}|{heading}|{ordinal}".encode()).hexdigest()[:16]
            chunks.append(Chunk(identifier, url, title, heading, text, ordinal))
            ordinal += 1
        buffer.clear()

    body = soup.body or soup
    for element in body.find_all(["h1", "h2", "h3", "h4", "p", "li", "pre", "table"]):
        name = element.name
        text = element.get_text(" ", strip=True)
        if not text:
            continue
        if name in {"h1", "h2", "h3", "h4"}:
            flush()
            heading = text
        elif name == "table":
            rows = [" | ".join(cell.get_text(" ", strip=True) for cell in row.find_all(["th", "td"])) for row in element.find_all("tr")]
            buffer.append("TABLE: " + " / ".join(row for row in rows if row))
        elif name == "pre":
            buffer.append("CODE: " + text)
        else:
            buffer.append(text)
        if sum(len(item) for item in buffer) >= 1200:
            flush()
    flush()
    return chunks


def ingest_pages(pages: Iterable[tuple[str, str]], embedder: HashEmbedder | None = None) -> int:
    embedder = embedder or HashEmbedder()
    chunks = [chunk for url, html in pages for chunk in parse_html(html, url)]
    vectors = embedder.embed(chunk.text for chunk in chunks)
    DATA.mkdir(exist_ok=True)
    payload = {
        "schema_version": 1,
        "embedder": {"provider": embedder.provider, "model": embedder.model, "dimension": embedder.dimension},
        "chunks": [{**asdict(chunk), "vector": vectors[index].tolist()} for index, chunk in enumerate(chunks)],
    }
    INDEX_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return len(chunks)


def load_index() -> tuple[HashEmbedder, list[dict[str, object]]]:
    if not INDEX_PATH.exists():
        raise FileNotFoundError("No index found. Run `make ingest-fixture` or `make ingest`." )
    payload = json.loads(INDEX_PATH.read_text(encoding="utf-8"))
    return HashEmbedder(), payload["chunks"]


def retrieve(query: str, top_k: int = 4) -> list[Citation]:
    if INJECTION.search(query):
        return []
    embedder, chunks = load_index()
    query_vector = embedder.embed([query])[0]
    query_terms = {token.lower() for token in TOKEN.findall(query) if token.lower() not in STOPWORDS}
    scored = []
    for chunk in chunks:
        dense_score = float(np.dot(query_vector, np.asarray(chunk["vector"], dtype=np.float32)))
        chunk_terms = {token.lower() for token in TOKEN.findall(f"{chunk['heading']} {chunk['text']}")}
        lexical_boost = len(query_terms & chunk_terms) / max(len(query_terms), 1)
        score = dense_score + lexical_boost
        scored.append((score, chunk))
    scored.sort(key=lambda item: item[0], reverse=True)
    return [Citation(str(chunk["id"]), str(chunk["url"]), str(chunk["title"]), str(chunk["heading"]), str(chunk["text"])[:420], round(score, 6)) for score, chunk in scored[:top_k] if score > 0]


def answer(query: str, top_k: int = 4, abstain_threshold: float = 0.13) -> dict[str, object]:
    started = time.perf_counter()
    if INJECTION.search(query):
        result = {"answer": "I can only answer from documentation content; I will not follow instructions embedded in a request or document.", "abstained": True, "reason": "prompt_injection", "citations": []}
    else:
        citations = retrieve(query, top_k)
        query_terms = {token.lower() for token in TOKEN.findall(query) if token.lower() not in STOPWORDS}
        source_terms = {token.lower() for citation in citations for token in TOKEN.findall(f"{citation.heading} {citation.excerpt}")}
        has_lexical_evidence = bool(query_terms & source_terms)
        if not citations or citations[0].score < abstain_threshold or not has_lexical_evidence:
            result = {"answer": "I don't have enough supporting documentation to answer that reliably.", "abstained": True, "reason": "insufficient_evidence", "citations": []}
        else:
            evidence = citations[0].excerpt
            result = {"answer": f"Based on the retrieved documentation: {evidence}", "abstained": False, "reason": None, "citations": [asdict(item) for item in citations]}
    latency_ms = round((time.perf_counter() - started) * 1000, 3)
    event = {"timestamp_unix": time.time(), "query": query, "latency_ms": latency_ms, "input_tokens_estimate": math.ceil(len(query) / 4), "output_tokens_estimate": math.ceil(len(str(result["answer"])) / 4), "cost_usd": 0.0, "embedding_provider": HashEmbedder.provider, **result}
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(event) + "\n")
    return {**result, "telemetry": {key: event[key] for key in ("latency_ms", "input_tokens_estimate", "output_tokens_estimate", "cost_usd", "embedding_provider")}}
