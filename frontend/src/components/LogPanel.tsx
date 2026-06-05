import { useEffect, useRef } from "react";
import type { LogEntry } from "../types";

interface Props {
  logs: LogEntry[];
  isRunning: boolean;
}

const AGENT_COLOR: Record<string, string> = {
  planner: "#00ffff",
  architect: "#00ffff",
  coder: "#00ff88",
  reviewer: "#ffaa00",
  reviewer2: "#ff6600",
  assistant: "#a78bfa",
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour12: false });
}

export default function LogPanel({ logs, isRunning }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="w-1/2 flex flex-col border-r border-gray-800 min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex-none flex items-center gap-2 px-4 py-2 border-b border-gray-800">
        <span
          className={`text-[10px] tracking-widest font-bold ${
            isRunning ? "text-[#00ffff] animate-pulse" : "text-gray-600"
          }`}
        >
          ● AGENT LOG
        </span>
        {logs.length > 0 && (
          <span className="text-[10px] text-gray-700 ml-auto">
            {logs.length} event{logs.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 min-h-0">
        {logs.length === 0 && !isRunning && (
          <p className="text-gray-700 text-xs">
            Agent output will stream here once you hit Generate.
          </p>
        )}

        {logs.length === 0 && isRunning && (
          <p className="text-gray-600 text-xs animate-pulse">
            Waiting for first agent…
          </p>
        )}

        {logs.map((entry, i) =>
          entry.agent === "assistant" ? (
            <div key={i} className="space-y-1 border border-[#a78bfa33] rounded px-3 py-2 bg-[#a78bfa08]">
              <div className="flex items-center gap-2 text-[10px]">
                <span className="font-bold tracking-widest" style={{ color: "#a78bfa" }}>
                  ✦ ASSISTANT
                </span>
                <span className="text-gray-700">{formatTime(entry.timestamp)}</span>
              </div>
              <p className="text-gray-300 text-[12px] leading-relaxed whitespace-pre-wrap break-words">
                {entry.output}
              </p>
            </div>
          ) : (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-2 text-[10px]">
                <span
                  style={{ color: AGENT_COLOR[entry.agent] ?? "#888" }}
                  className="font-bold tracking-widest"
                >
                  ▶ {entry.agent.toUpperCase()}
                </span>
                <span className="text-gray-700">{formatTime(entry.timestamp)}</span>
              </div>
              <pre className="text-gray-400 text-[11px] leading-relaxed whitespace-pre-wrap break-words font-mono">
                {entry.output}
              </pre>
            </div>
          )
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
