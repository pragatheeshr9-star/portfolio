from __future__ import annotations

import ast
import operator
import time
from collections.abc import Mapping
from typing import Any


class ToolError(Exception):
    def __init__(self, code: str, message: str, blocked: bool = False) -> None:
        super().__init__(message)
        self.code = code
        self.blocked = blocked


NOTES = (
    {"title": "Grounded answers", "text": "Return a source citation or abstain when evidence is insufficient."},
    {"title": "Evaluation", "text": "Record retrieval quality, correctness, latency, cost, and abstention behavior."},
    {"title": "Safe tools", "text": "Use explicit contracts, bounded retries, and structured traces for tool execution."},
)

_BINARY_OPERATORS: dict[type[ast.operator], Any] = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
}
_UNARY_OPERATORS: dict[type[ast.unaryop], Any] = {
    ast.UAdd: operator.pos,
    ast.USub: operator.neg,
}


def _evaluate_expression(expression: str) -> int | float:
    if len(expression) > 120:
        raise ToolError("invalid_arguments", "Expression is too long.")
    try:
        tree = ast.parse(expression, mode="eval")
    except SyntaxError as error:
        raise ToolError("invalid_arguments", "Expression is not valid arithmetic.") from error

    def visit(node: ast.expr) -> int | float:
        if isinstance(node, ast.Constant) and type(node.value) in (int, float):
            return node.value
        if isinstance(node, ast.BinOp) and type(node.op) in _BINARY_OPERATORS:
            left = visit(node.left)
            right = visit(node.right)
            if isinstance(node.op, ast.Mult) and abs(left) > 1e12 or isinstance(node.op, ast.Mult) and abs(right) > 1e12:
                raise ToolError("invalid_arguments", "Arithmetic result exceeds the supported range.")
            try:
                result = _BINARY_OPERATORS[type(node.op)](left, right)
            except ZeroDivisionError as error:
                raise ToolError("tool_execution_error", "Division by zero.") from error
            if abs(result) > 1e12:
                raise ToolError("invalid_arguments", "Arithmetic result exceeds the supported range.")
            return round(result, 10)
        if isinstance(node, ast.UnaryOp) and type(node.op) in _UNARY_OPERATORS:
            return _UNARY_OPERATORS[type(node.op)](visit(node.operand))
        raise ToolError("invalid_arguments", "Only numeric literals and +, -, *, / are supported.")

    return visit(tree.body)


def _calculate(arguments: Mapping[str, Any]) -> dict[str, int | float]:
    expression = arguments.get("expression")
    if not isinstance(expression, str) or not expression.strip():
        raise ToolError("invalid_arguments", "Provide a non-empty arithmetic expression.")
    return {"value": _evaluate_expression(expression)}


def _search_notes(arguments: Mapping[str, Any]) -> dict[str, Any]:
    query = arguments.get("query")
    if not isinstance(query, str) or not query.strip():
        raise ToolError("invalid_arguments", "Provide a non-empty search query.")
    terms = {term.casefold() for term in query.split() if len(term) > 2}
    matches = [
        {"title": note["title"], "text": note["text"]}
        for note in NOTES
        if terms & {term.casefold().strip(".,:;!?()") for term in f"{note['title']} {note['text']}".split()}
    ]
    return {"matches": matches[:3]}


TOOLS = {
    "calculate": _calculate,
    "search_notes": _search_notes,
}


def run_plan(steps: list[dict[str, Any]], max_retries: int = 1) -> dict[str, Any]:
    trace: list[dict[str, Any]] = []
    outputs: list[dict[str, Any]] = []

    for index, step in enumerate(steps):
        name = step.get("tool")
        arguments = step.get("arguments", {})
        started = time.perf_counter()
        if name not in TOOLS:
            trace.append({"step": index, "tool": str(name), "status": "blocked", "failure": "blocked_unsafe_action", "attempts": 0, "duration_ms": 0.0})
            return {"status": "blocked", "outputs": outputs, "trace": trace}
        if not isinstance(arguments, dict):
            trace.append({"step": index, "tool": name, "status": "failed", "failure": "invalid_arguments", "attempts": 0, "duration_ms": 0.0})
            return {"status": "failed", "outputs": outputs, "trace": trace}

        attempts = 0
        while True:
            attempts += 1
            try:
                output = TOOLS[name](arguments)
                outputs.append({"step": index, "tool": name, "result": output})
                trace.append({"step": index, "tool": name, "status": "succeeded", "attempts": attempts, "duration_ms": round((time.perf_counter() - started) * 1000, 3)})
                break
            except ToolError as error:
                retryable = error.code == "tool_execution_error" and attempts <= max_retries
                if retryable:
                    continue
                trace.append({"step": index, "tool": name, "status": "failed", "failure": error.code, "message": str(error), "attempts": attempts, "duration_ms": round((time.perf_counter() - started) * 1000, 3)})
                return {"status": "failed", "outputs": outputs, "trace": trace}

    return {"status": "succeeded", "outputs": outputs, "trace": trace}