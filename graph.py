from langgraph.graph import StateGraph, END

from state import AgentState
from agents.planner import planner_node
from agents.architect import architect_node
from agents.coder import coder_node
from agents.reviewer import reviewer_node, route_after_review
from agents.reviewer2 import reviewer2_node, route_after_review2


def build_graph() -> StateGraph:
    graph = StateGraph(AgentState)

    graph.add_node("planner", planner_node)
    graph.add_node("architect", architect_node)
    graph.add_node("coder", coder_node)
    graph.add_node("reviewer", reviewer_node)
    graph.add_node("reviewer2", reviewer2_node)

    graph.set_entry_point("planner")
    graph.add_edge("planner", "architect")
    graph.add_edge("architect", "coder")

    graph.add_conditional_edges("coder", lambda s: "reviewer", {"reviewer": "reviewer"})
    graph.add_conditional_edges("reviewer", route_after_review, {"end": "reviewer2", "coder": "coder"})
    graph.add_conditional_edges("reviewer2", route_after_review2, {"end": END, "coder": "coder"})

    return graph.compile()
