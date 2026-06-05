import type { AgentName, NodeStatus, PipelineState } from "../types";

interface Props {
  pipeline: PipelineState;
}

interface NodeDef {
  id: AgentName;
  label: string;
  abbr: string;
}

const NODES: NodeDef[] = [
  { id: "planner", label: "Planner", abbr: "PLAN" },
  { id: "architect", label: "Architect", abbr: "ARCH" },
  { id: "coder", label: "Coder", abbr: "CODE" },
  { id: "reviewer", label: "Reviewer", abbr: "REV" },
];

function nodeClasses(status: NodeStatus): string {
  switch (status) {
    case "active":
      return [
        "border-[#00ffff] text-[#00ffff]",
        "shadow-[0_0_18px_rgba(0,255,255,0.55)]",
        "bg-[#00ffff0d]",
      ].join(" ");
    case "done":
      return [
        "border-[#00ff88] text-[#00ff88]",
        "shadow-[0_0_12px_rgba(0,255,136,0.35)]",
        "bg-[#00ff880d]",
      ].join(" ");
    default:
      return "border-gray-800 text-gray-700 bg-transparent";
  }
}

function statusDot(status: NodeStatus) {
  if (status === "active")
    return <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00ffff] animate-pulse mr-1.5" />;
  if (status === "done")
    return <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00ff88] mr-1.5" />;
  return <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-800 mr-1.5" />;
}

export default function AgentPipeline({ pipeline }: Props) {
  return (
    <div className="flex-none border-b border-gray-800 px-5 py-4">
      <div className="flex items-center justify-center gap-0">
        {/* START */}
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center text-gray-600 text-[9px] tracking-widest">
            ◉
          </div>
          <span className="text-[9px] text-gray-700 mt-1 tracking-widest">START</span>
        </div>

        {NODES.map((node, i) => (
          <div key={node.id} className="flex items-center">
            {/* Arrow */}
            <div className="flex items-center mx-2 mt-[-12px]">
              <div className="h-px w-8 bg-gray-800" />
              <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-gray-700" />
            </div>

            {/* Node */}
            <div className="flex flex-col items-center">
              <div
                className={`border rounded px-4 py-2 text-xs font-bold tracking-widest transition-all duration-300 ${nodeClasses(pipeline[node.id])}`}
              >
                <div className="flex items-center">
                  {statusDot(pipeline[node.id])}
                  {node.abbr}
                </div>
              </div>
              <span
                className={`text-[9px] mt-1 tracking-wider transition-colors duration-300 ${
                  pipeline[node.id] === "waiting" ? "text-gray-700" : "text-gray-500"
                }`}
              >
                {node.label}
              </span>

            </div>

            {/* Extra arrow after last node before END */}
            {i === NODES.length - 1 && (
              <div className="flex items-center mx-2 mt-[-12px]">
                <div className="h-px w-8 bg-gray-800" />
                <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-gray-700" />
              </div>
            )}
          </div>
        ))}

        {/* END */}
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center text-gray-600 text-[9px] tracking-widest">
            ◉
          </div>
          <span className="text-[9px] text-gray-700 mt-1 tracking-widest">END</span>
        </div>
      </div>
    </div>
  );
}
