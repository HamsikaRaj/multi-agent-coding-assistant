# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Project

```bash
# Start both backend and frontend together
bash start.sh

# Backend only (FastAPI on port 8000)
uvicorn api:app --reload --port 8000

# Frontend only (Vite on port 5173)
cd frontend && npm run dev
```

Requires a `.env` file in the project root:
```
GROQ_API_KEY=...        # optional, not currently used
ANTHROPIC_API_KEY=...   # required
```

`start.sh` automatically loads `.env` before starting the servers.

## Architecture

### Pipeline Flow
```
user prompt → intent classifier (Haiku) → "chat" or "generate"

generate path:
  planner → architect → coder → reviewer → reviewer2 → END
                           ↑         |
                           └─────────┘  (FAIL + retries < 3)
```

### Key Files
- **`graph.py`** — LangGraph graph definition. All routing logic lives here. `route_after_review` and `route_after_review2` decide whether to retry the coder or advance.
- **`state.py`** — `AgentState` TypedDict shared across all nodes. Every agent reads from and writes to this.
- **`utils.py`** — Single `chat()` function used by all agents. Contains model constants (`HAIKU`, `SONNET`, `OPUS`), thread-local metrics accumulator (`start_metrics_collection` / `get_collected_metrics`), and `extract_json()` for parsing coder output.
- **`api.py`** — FastAPI app. The `/run` endpoint runs the graph in a background thread and streams results to the frontend via SSE. Intent classification and chat handling also live here.

### Agent Models
| Agent | Model | Reason |
|-------|-------|--------|
| Planner, Architect, Reviewers | `claude-sonnet-4-6` | Quality + cost balance |
| Coder | `claude-opus-4-8` | Best code generation quality |
| Intent classifier | `claude-haiku-4-5-20251001` | Fast, cheap, simple task |

### SSE Event Types
The backend emits these event types to the frontend:
- `agent_start` / `agent_done` — pipeline node lifecycle
- `chat_start` / `chat_done` — conversational response
- `files` — final generated file map
- `metrics` — per-agent token/cost/latency data emitted after `files`
- `error` — exception from the pipeline

### Coder JSON Format
The coder is prompted to return a raw JSON object `{"path/to/file": "content"}`. `extract_json()` in `utils.py` handles markdown fences, partial truncation, and fallback recovery. Claude Opus does **not** support assistant prefill — do not add `prefill=` to the coder's `chat()` call.

### Metrics
`utils.py` uses a `threading.local()` accumulator. Call `start_metrics_collection()` at the start of a run, then each `chat()` call tagged with `_agent=` automatically records tokens, cost, and latency. Retrieve with `get_collected_metrics()`.

### Frontend
`frontend/src/types.ts` is the source of truth for SSE event shapes and agent names. When adding a new agent, update `AgentName`, `isAgentName()`, `PipelineState` in types, `INITIAL_PIPELINE` in App.tsx, and `NODES` in `AgentPipeline.tsx`.
