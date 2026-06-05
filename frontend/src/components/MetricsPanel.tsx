import type { RunMetrics } from "../types";

interface Props {
  metrics: RunMetrics | null;
}

const MODEL_SHORT: Record<string, string> = {
  "claude-opus-4-8":           "Opus 4.8",
  "claude-sonnet-4-6":         "Sonnet 4.6",
  "claude-haiku-4-5-20251001": "Haiku 4.5",
};

const AGENT_ORDER = ["planner", "architect", "coder", "reviewer", "reviewer2", "assistant"];

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

export default function MetricsPanel({ metrics }: Props) {
  if (!metrics) return null;

  const agents = AGENT_ORDER.filter((a) => metrics.agents[a]);

  return (
    <div className="flex-none border-t border-gray-800 px-4 py-3 bg-gray-950">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold tracking-widest text-gray-500">● METRICS</span>
        <span
          className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded ${
            metrics.review_passed
              ? "text-[#00ff88] border border-[#00ff8844]"
              : "text-[#ffaa00] border border-[#ffaa0044]"
          }`}
        >
          {metrics.review_passed ? "✓ REVIEW PASSED" : "⚠ REVIEW FAILED"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[10px] border-collapse">
          <thead>
            <tr className="text-gray-600 border-b border-gray-800">
              <th className="text-left py-1 pr-4 font-normal tracking-widest">AGENT</th>
              <th className="text-left py-1 pr-4 font-normal tracking-widest">MODEL</th>
              <th className="text-right py-1 pr-4 font-normal tracking-widest">IN TOK</th>
              <th className="text-right py-1 pr-4 font-normal tracking-widest">OUT TOK</th>
              <th className="text-right py-1 pr-4 font-normal tracking-widest">COST</th>
              <th className="text-right py-1 font-normal tracking-widest">TIME</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => {
              const m = metrics.agents[agent];
              return (
                <tr key={agent} className="border-b border-gray-900 text-gray-400">
                  <td className="py-1 pr-4 font-mono uppercase">{agent}</td>
                  <td className="py-1 pr-4 text-gray-600">{MODEL_SHORT[m.model] ?? m.model}</td>
                  <td className="py-1 pr-4 text-right">{fmt(m.input_tokens)}</td>
                  <td className="py-1 pr-4 text-right">{fmt(m.output_tokens)}</td>
                  <td className="py-1 pr-4 text-right text-[#00ff88]">${m.cost.toFixed(4)}</td>
                  <td className="py-1 text-right">{m.elapsed.toFixed(1)}s</td>
                </tr>
              );
            })}
            {/* Totals row */}
            <tr className="text-gray-300 font-bold border-t border-gray-700">
              <td className="py-1 pr-4 text-[#00ffff] tracking-widest">TOTAL</td>
              <td className="py-1 pr-4"></td>
              <td className="py-1 pr-4 text-right">{fmt(metrics.total_input_tokens)}</td>
              <td className="py-1 pr-4 text-right">{fmt(metrics.total_output_tokens)}</td>
              <td className="py-1 pr-4 text-right text-[#00ff88]">${metrics.total_cost.toFixed(4)}</td>
              <td className="py-1 text-right">{metrics.total_elapsed.toFixed(1)}s</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
