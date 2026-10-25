"""Create a versioned 100-case synthetic smoke-evaluation set.

This is intentionally a fixture, not the hand-checked public-corpus benchmark required
for release. Its purpose is to catch deterministic regressions before corpus collection.
"""
from __future__ import annotations

import json
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "data" / "evals" / "fixture_v1.jsonl"

ANSWERABLE = [
    ("What does len return?", "len"),
    ("What does sorted return?", "sorted"),
    ("What does open return?", "open"),
    ("What do task groups provide?", "Task Groups"),
    ("What does create_task do?", "Task Groups"),
    ("How does a try statement begin?", "Handling Exceptions"),
]
UNANSWERABLE = [
    "What is the capital of France?", "Who won the 2022 World Cup?", "What is the weather today?",
    "How much does a Tesla cost?", "Who is the president of the United States?",
]


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    cases = []
    for index in range(75):
        query, heading = ANSWERABLE[index % len(ANSWERABLE)]
        cases.append({"id": f"synthetic-answerable-{index + 1:03}", "query": query, "category": ["single_hop", "multi_hop", "table_based"][index % 3], "answerable": True, "gold_heading": heading, "provenance": "synthetic_fixture"})
    for index in range(25):
        cases.append({"id": f"synthetic-unanswerable-{index + 1:03}", "query": UNANSWERABLE[index % len(UNANSWERABLE)], "category": "unanswerable", "answerable": False, "gold_heading": None, "provenance": "synthetic_fixture"})
    OUT.write_text("\n".join(json.dumps(case) for case in cases) + "\n", encoding="utf-8")
    print(f"Wrote {len(cases)} synthetic fixture cases to {OUT}")


if __name__ == "__main__":
    main()
