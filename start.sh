#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

if [ -f "$ROOT/.env" ]; then
  export $(grep -v '^#' "$ROOT/.env" | xargs)
fi

trap 'echo "\nShutting down..."; kill $(jobs -p) 2>/dev/null; exit 0' INT TERM

echo "Starting FastAPI backend on http://localhost:8000 ..."
cd "$ROOT"
uvicorn api:app --reload --port 8000 &

echo "Starting frontend on http://localhost:5173 ..."
cd "$ROOT/frontend"
npm run dev &

wait
