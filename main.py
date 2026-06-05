import argparse
import sys

from graph import build_graph
from state import AgentState
from utils import write_output_files


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Multi-agent coding assistant (Planner → Architect → Coder → Reviewer)"
    )
    parser.add_argument(
        "prompt",
        nargs="?",
        help="Coding task description (omit to be prompted interactively)",
    )
    args = parser.parse_args()

    if args.prompt:
        user_prompt = args.prompt.strip()
    else:
        print("Multi-Agent Coding Assistant")
        print("=" * 40)
        try:
            user_prompt = input("Describe what you want to build:\n> ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nAborted.")
            sys.exit(0)

    if not user_prompt:
        print("Error: prompt cannot be empty.")
        sys.exit(1)

    initial_state: AgentState = {
        "user_prompt": user_prompt,
        "plan": "",
        "architecture": "",
        "code_files": {},
        "review_feedback": "",
        "retry_count": 0,
        "verdict": "",
    }

    app = build_graph()

    print("\n" + "=" * 40)
    print("Starting multi-agent pipeline...")
    print("=" * 40)

    final_state = app.invoke(initial_state)

    print("\n" + "=" * 40)
    print("Pipeline complete. Writing output files...")
    print("=" * 40)

    code_files = final_state.get("code_files", {})
    if not code_files:
        print("Warning: no code files were generated.")
        sys.exit(1)

    write_output_files(code_files)

    retries = final_state.get("retry_count", 0)
    verdict = "PASS" if retries < 2 or not final_state.get("review_feedback") else "FAIL (max retries reached)"
    print(f"\nDone. Files written to ./output/  |  Reviewer verdict: {verdict}")
    if final_state.get("review_feedback"):
        print(f"Final feedback: {final_state['review_feedback']}")


if __name__ == "__main__":
    main()
