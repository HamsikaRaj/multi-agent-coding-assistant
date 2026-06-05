import { useState, useEffect } from "react";
import AgentPipeline from "./components/AgentPipeline";
import FileExplorer from "./components/FileExplorer";
import LogPanel from "./components/LogPanel";
import MetricsPanel from "./components/MetricsPanel";
import {
  isAgentName,
  type AgentName,
  type LogEntry,
  type PipelineState,
  type RunMetrics,
  type SSEEvent,
} from "./types";


const INITIAL_PIPELINE: PipelineState = {
  planner: "waiting",
  architect: "waiting",
  coder: "waiting",
  reviewer: "waiting",
  reviewer2: "waiting",
};

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [pipeline, setPipeline] = useState<PipelineState>(INITIAL_PIPELINE);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [metrics, setMetrics] = useState<RunMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let attempts = 0;
    const check = () => {
      fetch("http://localhost:8000/health")
        .then((r) => r.json())
        .then((data) => {
          if (data.missing_keys?.length > 0) {
            setError(`Missing environment variables: ${data.missing_keys.join(", ")}`);
          }
        })
        .catch(() => {
          attempts++;
          if (attempts < 10) {
            setTimeout(check, 1500);
          } else {
            setError("Backend not reachable — is the server running?");
          }
        });
    };
    check();
  }, []);

  function processEvent(event: SSEEvent) {
    switch (event.type) {
      case "agent_start": {
        if (!isAgentName(event.agent)) break;
        const agent = event.agent;
        const uiAgent = agent === "reviewer2" ? "reviewer" : agent;
        if (agent === "coder") {
          setPipeline((prev) => ({ ...prev, coder: "active", reviewer: "waiting", reviewer2: "waiting" }));
        } else {
          setPipeline((prev) => ({ ...prev, [uiAgent]: "active" }));
        }
        break;
      }
      case "agent_done": {
        if (!isAgentName(event.agent)) break;
        const agent = event.agent;
        const uiAgent = agent === "reviewer2" ? "reviewer" : agent;
        setPipeline((prev) => ({ ...prev, [uiAgent]: "done" }));
        if (event.output) {
          setLogs((prev) => [
            ...prev,
            { agent, output: event.output, timestamp: Date.now() },
          ]);
        }
        break;
      }
      case "files":
        setFiles(event.files);
        break;
      case "metrics":
        if (event.metrics) setMetrics(event.metrics);
        break;
      case "chat_start":
        setIsRunning(true);
        break;
      case "chat_done":
        setLogs((prev) => [
          ...prev,
          { agent: "assistant" as AgentName, output: event.output, timestamp: Date.now() },
        ]);
        break;
      case "error":
        setError(event.output || "Unknown error from server.");
        break;
    }
  }

  async function handleGenerate() {
    if (!prompt.trim() || isRunning) return;

    setIsRunning(true);
    setPipeline(INITIAL_PIPELINE);
    setLogs([]);
    setFiles({});
    setMetrics(null);
    setError(null);

    try {
      const response = await fetch("http://localhost:8000/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          for (const line of part.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6)) as SSEEvent;
              processEvent(event);
            } catch {
              // skip malformed line
            }
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="h-screen flex flex-col bg-black overflow-hidden">
      {/* ── Header ── */}
      <header className="flex-none border-b border-gray-800 px-5 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-[#00ffff] font-bold text-lg tracking-widest">
            ⟩ MULTI-AGENT CODING ASSISTANT
          </span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="Build something or ask anything..."
            disabled={isRunning}
            className="flex-1 bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200
                       placeholder-gray-600 focus:outline-none focus:border-[#00ffff] transition-colors
                       disabled:opacity-50"
          />
          <button
            onClick={handleGenerate}
            disabled={isRunning || !prompt.trim()}
            className="px-5 py-2 bg-[#00ffff] text-black font-bold text-sm rounded tracking-widest
                       hover:bg-[#00e5e5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? "RUNNING…" : "GENERATE"}
          </button>
        </div>
      </header>

      {/* ── Pipeline ── */}
      <AgentPipeline pipeline={pipeline} />

      {/* ── Error bar ── */}
      {error && (
        <div className="flex-none mx-4 mt-2 px-4 py-2 border border-red-800 bg-red-950/30 text-red-400 text-xs rounded">
          ⚠ {error}
          <button
            onClick={() => setError(null)}
            className="ml-3 text-red-600 hover:text-red-400"
          >
            [dismiss]
          </button>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <LogPanel logs={logs} isRunning={isRunning} />
        <FileExplorer files={files} />
      </div>

      {/* ── Metrics ── */}
      <MetricsPanel metrics={metrics} />
    </div>
  );
}
