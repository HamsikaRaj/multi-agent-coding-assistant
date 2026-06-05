import asyncio
import json
import os
import threading
from collections.abc import AsyncGenerator
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

import time as _time
from graph import build_graph
from state import AgentState
from utils import chat, write_output_files, start_metrics_collection, get_collected_metrics, HAIKU, SONNET

CLASSIFY_SYSTEM = """You classify user intent. Reply with exactly one word: 'generate' or 'chat'.
- 'generate': user wants to build, create, code, or make a software project/app/script/tool
- 'chat': anything else — questions, explanations, general conversation"""

CHAT_SYSTEM = """You are a helpful AI assistant. Answer clearly and concisely.
You are embedded in a multi-agent coding tool, so coding and technical questions are common,
but answer any topic the user asks about."""


def _classify(prompt: str) -> str:
    result = chat(CLASSIFY_SYSTEM, prompt, max_tokens=5, model=HAIKU)
    return "generate" if "generate" in result.lower() else "chat"

app = FastAPI(title="Multi-Agent Coding Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    missing = []
    if not os.environ.get("ANTHROPIC_API_KEY"):
        missing.append("ANTHROPIC_API_KEY")
    return {"status": "ok", "missing_keys": missing}


class RunRequest(BaseModel):
    prompt: str


def _sse(payload: dict[str, Any]) -> str:
    return f"data: {json.dumps(payload)}\n\n"


_NEXT_AGENT: dict[str, str] = {
    "planner": "architect",
    "architect": "coder",
    "coder": "reviewer",
    "reviewer": "reviewer2",
}


def _get_output(node: str, update: dict[str, Any]) -> str:
    if node == "planner":
        return update.get("plan", "")
    if node == "architect":
        return update.get("architecture", "")
    if node == "coder":
        files: dict[str, str] = update.get("code_files", {})
        return f"Generated {len(files)} file(s): {list(files.keys())}"
    if node == "reviewer":
        verdict = update.get("verdict", "?")
        feedback = update.get("review_feedback", "")
        return f"Verdict: {verdict} — {feedback}"
    if node == "reviewer2":
        verdict2 = update.get("verdict2", "?")
        feedback2 = update.get("review2_feedback", "")
        return f"Verdict: {verdict2} — {feedback2}"
    return ""


@app.post("/run")
async def run_pipeline(req: RunRequest) -> StreamingResponse:
    q: asyncio.Queue[str | None] = asyncio.Queue()
    loop = asyncio.get_running_loop()

    def emit(payload: dict[str, Any]) -> None:
        loop.call_soon_threadsafe(q.put_nowait, _sse(payload))

    def run_in_thread() -> None:
        try:
            start_metrics_collection()
            run_start = _time.time()

            intent = _classify(req.prompt)

            if intent == "chat":
                emit({"type": "chat_start", "agent": "assistant", "output": "", "files": {}})
                response = chat(CHAT_SYSTEM, req.prompt, max_tokens=1024, model=SONNET, _agent="assistant")
                emit({"type": "chat_done", "agent": "assistant", "output": response, "files": {}})
                return

            initial_state: AgentState = {
                "user_prompt": req.prompt,
                "plan": "",
                "architecture": "",
                "code_files": {},
                "review_feedback": "",
                "review2_feedback": "",
                "retry_count": 0,
                "verdict": "",
                "verdict2": "",
            }

            graph = build_graph()
            final_code_files: dict[str, str] = {}
            final_state: dict = {}

            emit({"type": "agent_start", "agent": "planner", "output": "", "files": {}})

            for event in graph.stream(initial_state, stream_mode="updates"):
                for node_name, update in event.items():
                    if node_name == "__end__":
                        continue

                    output = _get_output(node_name, update)

                    if "code_files" in update:
                        final_code_files = update["code_files"]
                    final_state.update(update)

                    emit({"type": "agent_done", "agent": node_name, "output": output, "files": {}})

                    if node_name in _NEXT_AGENT:
                        next_agent = _NEXT_AGENT[node_name]
                        if node_name == "reviewer":
                            verdict = update.get("verdict", "PASS")
                            retries = update.get("retry_count", 0)
                            if verdict == "FAIL" and retries < 2:
                                emit({"type": "agent_start", "agent": "coder", "output": "", "files": {}})
                            else:
                                emit({"type": "agent_start", "agent": next_agent, "output": "", "files": {}})
                        else:
                            emit({"type": "agent_start", "agent": next_agent, "output": "", "files": {}})
                    elif node_name == "reviewer2":
                        verdict2 = update.get("verdict2", "PASS")
                        retries = update.get("retry_count", 0)
                        if verdict2 == "FAIL" and retries < 2:
                            emit({"type": "agent_start", "agent": "coder", "output": "", "files": {}})

            emit({"type": "files", "agent": "", "output": "", "files": final_code_files})
            write_output_files(final_code_files)

            # Emit metrics
            agent_metrics = get_collected_metrics()
            total_elapsed = _time.time() - run_start
            total_in  = sum(v["input_tokens"]  for v in agent_metrics.values())
            total_out = sum(v["output_tokens"] for v in agent_metrics.values())
            total_cost = sum(v["cost"] for v in agent_metrics.values())
            review_passed = (
                final_state.get("verdict2", final_state.get("verdict", "FAIL")) == "PASS"
            )
            emit({
                "type": "metrics",
                "agent": "",
                "output": "",
                "files": {},
                "metrics": {
                    "agents": agent_metrics,
                    "total_input_tokens": total_in,
                    "total_output_tokens": total_out,
                    "total_cost": round(total_cost, 6),
                    "total_elapsed": round(total_elapsed, 2),
                    "review_passed": review_passed,
                },
            })

        except Exception as exc:
            emit({"type": "error", "agent": "", "output": str(exc), "files": {}})
        finally:
            loop.call_soon_threadsafe(q.put_nowait, None)

    thread = threading.Thread(target=run_in_thread, daemon=True)
    thread.start()

    async def event_stream() -> AsyncGenerator[str, None]:
        while True:
            item = await q.get()
            if item is None:
                break
            yield item

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
