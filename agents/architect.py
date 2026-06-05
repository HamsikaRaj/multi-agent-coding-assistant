from state import AgentState
from utils import chat, SONNET

SYSTEM = """You are a software architect.
Given a task plan, design the full project structure:
- Recommended tech stack and dependencies (with versions)
- File/directory layout (tree format)
- Role of each file/module
- Key interfaces, data models, and component interactions
Be precise. Your output will be used directly by a code-generation agent."""


def architect_node(state: AgentState) -> AgentState:
    print("\n[Architect] Designing project architecture...")
    user_msg = f"""User request:\n{state['user_prompt']}

Task plan:\n{state['plan']}

Design the complete architecture."""
    architecture = chat(SYSTEM, user_msg, max_tokens=1500, model=SONNET, _agent="architect")
    print(f"[Architect] Architecture:\n{architecture}\n")
    return {**state, "architecture": architecture}
