export type AgentName = "planner" | "architect" | "coder" | "reviewer" | "reviewer2" | "assistant";
export type NodeStatus = "waiting" | "active" | "done";
export type EventType = "agent_start" | "agent_done" | "files" | "done" | "error" | "chat_start" | "chat_done" | "metrics";

export interface AgentMetric {
  input_tokens: number;
  output_tokens: number;
  cost: number;
  elapsed: number;
  calls: number;
  model: string;
}

export interface RunMetrics {
  agents: Record<string, AgentMetric>;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost: number;
  total_elapsed: number;
  review_passed: boolean;
}

export interface SSEEvent {
  type: EventType;
  agent: AgentName | "";
  output: string;
  files: Record<string, string>;
  metrics?: RunMetrics;
}

export interface LogEntry {
  agent: AgentName;
  output: string;
  timestamp: number;
}

export type PipelineState = Record<AgentName, NodeStatus>;

export function isAgentName(s: string): s is AgentName {
  return ["planner", "architect", "coder", "reviewer", "reviewer2", "assistant"].includes(s);
}
