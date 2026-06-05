from state import AgentState
from utils import chat, extract_json, OPUS

SYSTEM = """You are an expert software engineer. Output ONLY a raw JSON object — no explanation, no markdown, no code fences.

The JSON must look exactly like this:
{"path/to/file.py": "full file content here", "path/to/other.py": "full file content here"}

Rules:
- Start your response with { and end with }
- Every file in the architecture must be a key in the JSON
- Values are complete file contents — no placeholders, no TODOs, no ellipses
- Escape newlines as \\n and double quotes as \\" inside values
- No text before or after the JSON object"""

_ARCH_CHAR_LIMIT = 4000


def coder_node(state: AgentState) -> AgentState:
    retry = state.get("retry_count", 0)
    feedback = state.get("review_feedback", "")
    print(f"\n[Coder] Generating code (attempt {retry + 1})...")

    arch = state["architecture"]
    if len(arch) > _ARCH_CHAR_LIMIT:
        arch = arch[:_ARCH_CHAR_LIMIT] + "\n... (truncated for brevity)"

    user_msg = f"""User request:\n{state['user_prompt']}

Plan:\n{state['plan']}

Architecture (summary):\n{arch}"""

    feedback2 = state.get("review2_feedback", "")
    if feedback or feedback2:
        combined = "\n".join(filter(None, [feedback, feedback2]))
        user_msg += f"""

IMPORTANT — You are fixing a previous attempt that FAILED review.
You MUST address every issue listed below. Do not skip any point.
Rewrite the affected files completely with all issues resolved.

Reviewer issues to fix:
{combined}"""

    raw = chat(SYSTEM, user_msg, max_tokens=8192, model=OPUS, _agent="coder")

    try:
        code_files = extract_json(raw)
    except ValueError as e:
        print(f"[Coder] Warning: could not parse JSON response — {e}")
        code_files = state.get("code_files", {})

    print(f"[Coder] Generated {len(code_files)} file(s): {list(code_files.keys())}")
    return {**state, "code_files": code_files}
