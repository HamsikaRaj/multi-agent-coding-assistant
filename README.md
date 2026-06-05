# Multi-Agent Coding Assistant

A full-stack AI application that turns a single text prompt into a complete, production-ready codebase. Five specialized agents — each powered by a different Claude model — collaborate in a structured pipeline to plan, design, write, and review code automatically.

![Python](https://img.shields.io/badge/Python-3.12-blue?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![LangGraph](https://img.shields.io/badge/LangGraph-0.2-ff6b6b?style=flat-square)
![Anthropic](https://img.shields.io/badge/Anthropic-Claude-a78bfa?style=flat-square)

---

## What It Does

You type a prompt like *"build a todo app"* and the system handles everything — breaking down the problem, designing the architecture, writing all the files, and running two independent code reviews before delivering the output.

If the code doesn't pass review, it automatically goes back to the coder with specific feedback and tries again — up to three times — until both reviewers sign off.

It also works as a general-purpose chat assistant. Type a question instead of a build request and it answers directly, skipping the pipeline entirely.

---

## Pipeline

```
User Prompt
    │
    ▼
Intent Classifier (Haiku) ──► Chat Response
    │
    ▼ (code generation)
Planner ──► Architect ──► Coder ──► Reviewer 1 ──► Reviewer 2 ──► Output
                            ▲            │
                            └────────────┘
                          (retry on failure, up to 3×)
```

| Agent | Model | Responsibility |
|-------|-------|----------------|
| Intent Classifier | Claude Haiku 4.5 | Decides: generate code or answer a question |
| Planner | Claude Sonnet 4.6 | Breaks the request into a structured task list |
| Architect | Claude Sonnet 4.6 | Designs the file structure and tech stack |
| Coder | Claude Opus 4.8 | Writes all files as a complete, working codebase |
| Reviewer 1 | Claude Sonnet 4.6 | Checks completeness, correctness, and imports |
| Reviewer 2 | Claude Sonnet 4.6 | Checks security, error handling, and edge cases |

---

## Example

**Prompt:** `build a calculator`

**Output:** 25 files — React components, custom hooks, a reducer, utility functions, and unit tests — all passing both review stages on the first attempt.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Agent Orchestration | LangGraph |
| Backend | Python, FastAPI |
| AI | Anthropic API (Claude Opus 4.8 / Sonnet 4.6 / Haiku 4.5) |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Real-time Streaming | Server-Sent Events (SSE) |

---

## Features

- **Live pipeline visualization** — watch each agent activate, process, and complete in real time
- **Self-correcting review loop** — failed reviews include specific feedback that the coder uses to fix issues on retry
- **Metrics panel** — every run shows per-agent token usage, cost, and latency
- **Dual-mode input** — one input box handles both code generation and general conversation
- **File explorer** — browse and read every generated file directly in the UI

---

## Performance (measured on real runs)

| Agent | Avg Latency | Avg Cost |
|-------|-------------|----------|
| Planner | ~6s | $0.008 |
| Architect | ~9s | $0.008 |
| Coder | ~8.7s | $0.074 |
| Reviewer 1 | ~1.5s | $0.0007 |
| Reviewer 2 | ~1.5s | $0.0007 |
| **Full Run** | **~28s** | **~$0.09** |

Coder (Opus) accounts for 82% of the total cost per run. The dual-reviewer layer adds less than $0.002.

---

## Getting Started

**1. Clone the repository**
```bash
git clone https://github.com/HamsikaRaj/multi-agent-coding-assistant.git
cd multi-agent-coding-assistant
```

**2. Install dependencies**
```bash
pip install -r requirements.txt
cd frontend && npm install && cd ..
```

**3. Add your Anthropic API key**

Create a `.env` file in the project root:
```
ANTHROPIC_API_KEY=your_key_here
```

Get your key at [console.anthropic.com](https://console.anthropic.com)

**4. Start the application**
```bash
bash start.sh
```

Open `http://localhost:5173` in your browser.

---

## Project Structure

```
├── agents/          # One file per agent (planner, architect, coder, reviewer, reviewer2)
├── frontend/        # React + TypeScript UI
├── api.py           # FastAPI server — SSE streaming, intent classification, routing
├── graph.py         # LangGraph pipeline definition and conditional routing
├── state.py         # Shared AgentState TypedDict passed between all agents
├── utils.py         # chat() wrapper, metrics tracking, JSON extraction
└── start.sh         # Starts both backend and frontend
```

---

## Built By

**Hamsika Raj** — [GitHub](https://github.com/HamsikaRaj) · [LinkedIn](https://linkedin.com/in/hamsikaraj)
