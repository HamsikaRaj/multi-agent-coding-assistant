from state import AgentState
from utils import chat, SONNET

SYSTEM = """You are a senior software project planner.
Given a user's feature request, produce a concise, numbered task/subtask breakdown.
Focus on WHAT needs to be built, not HOW. Be specific and actionable.
Format your output as a numbered list; no preamble, no closing remarks."""


def planner_node(state: AgentState) -> AgentState:
    print("\n[Planner] Decomposing request into tasks...")
    plan = chat(SYSTEM, state["user_prompt"], max_tokens=1024, model=SONNET, _agent="planner")
    print(f"[Planner] Plan:\n{plan}\n")
    return {**state, "plan": plan}
