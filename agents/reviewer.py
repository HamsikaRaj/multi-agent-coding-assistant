from state import AgentState
from utils import chat, SONNET

SYSTEM = """You are a practical code reviewer for a code generation tool.
Your job is to verify the generated code is functional and complete — not perfect.

PASS if:
- All files from the architecture are present and non-empty
- Code has no obvious syntax errors or missing imports
- Core logic is implemented (no empty function bodies or bare `pass`)
- Files work together (no obvious broken references between modules)

FAIL only if:
- A required file is missing or completely empty
- There is a syntax error that would prevent the code from running
- A core function is just `pass` or `raise NotImplementedError`
- Imports reference modules that don't exist in the project

Do NOT fail for: style issues, missing docstrings, suboptimal patterns, or minor best-practice violations.
Be generous — if the code is runnable and implements the requested feature, PASS it.

Respond in EXACTLY this format (no extra text):
VERDICT: PASS
FEEDBACK: <one sentence summary>

or:

VERDICT: FAIL
FEEDBACK: <specific file and line that is broken>"""


def reviewer_node(state: AgentState) -> AgentState:
    print("\n[Reviewer] Inspecting generated code...")
    file_summary = "\n".join(
        f"### {name}\n```\n{content[:3000]}{'...' if len(content) > 3000 else ''}\n```"
        for name, content in state.get("code_files", {}).items()
    )

    user_msg = f"""Plan:\n{state['plan']}

Architecture:\n{state['architecture']}

Generated files:\n{file_summary}"""

    raw = chat(SYSTEM, user_msg, max_tokens=1024, model=SONNET, _agent="reviewer")
    print(f"[Reviewer] Response:\n{raw}\n")

    verdict = "PASS" if "VERDICT: PASS" in raw.upper() else "FAIL"
    feedback = ""
    lines = raw.splitlines()
    for i, line in enumerate(lines):
        if line.upper().startswith("FEEDBACK:"):
            rest = line.split(":", 1)[1].strip()
            tail = "\n".join(lines[i + 1:]).strip()
            feedback = (rest + "\n" + tail).strip() if tail else rest
            break
    if not feedback:
        feedback = raw.strip()

    return {
        **state,
        "review_feedback": feedback,
        "verdict": verdict,
        "retry_count": state.get("retry_count", 0) + (0 if verdict == "PASS" else 1),
    }


def route_after_review(state: AgentState) -> str:
    verdict = state.get("verdict", "PASS")
    retries = state.get("retry_count", 0)
    if verdict == "PASS" or retries >= 3:
        return "end"
    return "coder"
