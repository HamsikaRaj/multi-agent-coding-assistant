from state import AgentState
from utils import chat, SONNET

SYSTEM = """You are a security reviewer for a code generation tool.
The first reviewer already confirmed the code is complete and runnable.
Your job is to catch only show-stopping security or reliability issues.

PASS if:
- No use of `eval()` or `exec()` on raw user input
- No hardcoded passwords or API keys as literal strings in code
- No obvious infinite loops with no exit condition
- Basic error handling exists (at least a top-level try/except in the main entry point)

FAIL only if one of the above is clearly violated — a single definitive issue.

Do NOT fail for: missing input validation on every field, non-critical best practices,
performance concerns, style, or anything that won't crash or expose the system.

Respond in EXACTLY this format (no extra text):
VERDICT: PASS
FEEDBACK: <one sentence summary>

or:

VERDICT: FAIL
FEEDBACK: <the specific critical issue only>"""


def reviewer2_node(state: AgentState) -> AgentState:
    print("\n[Reviewer2] Security & robustness check...")
    file_summary = "\n".join(
        f"### {name}\n```\n{content[:3000]}{'...' if len(content) > 3000 else ''}\n```"
        for name, content in state.get("code_files", {}).items()
    )

    user_msg = f"""Plan:\n{state['plan']}

Architecture:\n{state['architecture']}

Generated files:\n{file_summary}

First reviewer feedback:\n{state.get('review_feedback', 'N/A')}"""

    raw = chat(SYSTEM, user_msg, max_tokens=1024, model=SONNET, _agent="reviewer2")
    print(f"[Reviewer2] Response:\n{raw}\n")

    verdict2 = "PASS" if "VERDICT: PASS" in raw.upper() else "FAIL"
    feedback2 = ""
    lines = raw.splitlines()
    for i, line in enumerate(lines):
        if line.upper().startswith("FEEDBACK:"):
            rest = line.split(":", 1)[1].strip()
            tail = "\n".join(lines[i + 1:]).strip()
            feedback2 = (rest + "\n" + tail).strip() if tail else rest
            break
    if not feedback2:
        feedback2 = raw.strip()

    return {
        **state,
        "review2_feedback": feedback2,
        "verdict2": verdict2,
        "retry_count": state.get("retry_count", 0) + (0 if verdict2 == "PASS" else 1),
    }


def route_after_review2(state: AgentState) -> str:
    verdict2 = state.get("verdict2", "PASS")
    retries = state.get("retry_count", 0)
    if verdict2 == "PASS" or retries >= 3:
        return "end"
    return "coder"
