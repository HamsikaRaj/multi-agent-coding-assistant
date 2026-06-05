# Multi-Agent Coding Assistant

A 5-agent autonomous coding pipeline that generates production-ready, multi-file codebases from a single prompt. Built with LangGraph, FastAPI, React, and Claude AI.

![Pipeline](https://img.shields.io/badge/agents-5-00ffff?style=flat-square) ![Models](https://img.shields.io/badge/models-Opus%20%7C%20Sonnet%20%7C%20Haiku-a78bfa?style=flat-square) ![Stack](https://img.shields.io/badge/stack-FastAPI%20%2B%20React-00ff88?style=flat-square)

## How It Works

Type a prompt → 5 specialized AI agents collaborate to plan, design, write, and review the code.

```
Planner → Architect → Coder → Reviewer 1 → Reviewer 2 → Output
                         ↑          |
                         └──────────┘  (auto-retry on failure, up to 3×)
```

- **Planner** — breaks the request into tasks
- **Architect** — designs file structure and tech stack
- **Coder** — writes all files at once (Claude Opus)
- **Reviewer 1** — checks completeness and correctness
- **Reviewer 2** — checks security and robustness
- If review fails → coder rewrites with specific feedback (up to 3 retries)

Also works as a **general chat assistant** — type any question and it answers directly without running the pipeline.

## Demo

**Input:** `build a calculator`

**Output:** 25 files including components, hooks, reducer, utils, and tests — all passing both review stages.

## Tech Stack

| Layer | Tech |
|-------|------|
| Agent orchestration | LangGraph |
| Backend | FastAPI + Python |
| AI Models | Claude Opus 4.8 (coder), Sonnet 4.6 (planner/architect/reviewers), Haiku 4.5 (classifier) |
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Streaming | Server-Sent Events (SSE) |

## Setup

**1. Clone and install dependencies**
```bash
git clone https://github.com/HamsikaRaj/multi-agent-coding-assistant.git
cd multi-agent-coding-assistant

pip install -r requirements.txt
cd frontend && npm install && cd ..
```

**2. Add your API key**
```bash
echo "ANTHROPIC_API_KEY=your_key_here" > .env
```

Get your key at [console.anthropic.com](https://console.anthropic.com)

**3. Run**
```bash
bash start.sh
```

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`

## Features

- **Real-time pipeline UI** — watch each agent activate and complete live
- **Self-correcting loop** — reviewers provide specific feedback; coder fixes and retries
- **Metrics panel** — per-agent token usage, cost, and latency after every run
- **Dual mode** — auto-detects whether to generate code or answer a question
- **File explorer** — browse and read all generated files in the UI

## Metrics (real run)

| Agent | Model | Avg Time | Avg Cost |
|-------|-------|----------|----------|
| Planner | Sonnet 4.6 | ~6s | $0.008 |
| Architect | Sonnet 4.6 | ~9s | $0.008 |
| Coder | Opus 4.8 | ~8.7s | $0.074 |
| Reviewer 1+2 | Sonnet 4.6 | ~1.5s each | $0.0007 each |
| **Total** | | **~28s** | **~$0.09** |

## Resume

**Multi-Agent Coding Assistant** · Python · FastAPI · LangGraph · Anthropic API · React · TypeScript · Tailwind CSS · SSE

> Built a 5-agent autonomous coding pipeline (Planner → Architect → Coder → 2× Reviewer) using LangGraph and FastAPI that generates production-ready, multi-file codebases from a single prompt — shipped a 25-file React/TypeScript project in a single run; self-correcting review loop with up to 3 retries reduced broken output to zero across test runs.

> Optimized cost/quality tradeoff by routing code generation to Claude Opus (~82% of per-run cost, ~$0.09 total) and planning/review to Claude Sonnet (dual-reviewer cycle costs only $0.0007); built real-time per-agent metrics streamed via SSE, revealing coder latency of ~8.7s vs reviewer latency of ~1.5s; integrated intent classifier (Claude Haiku) to serve both code generation and general chat from a single input.
