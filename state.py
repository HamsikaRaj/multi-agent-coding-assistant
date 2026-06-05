from typing import TypedDict


class AgentState(TypedDict):
    user_prompt: str
    plan: str
    architecture: str
    code_files: dict
    review_feedback: str
    review2_feedback: str
    retry_count: int
    verdict: str           # "PASS" | "FAIL" — set by reviewer1
    verdict2: str          # "PASS" | "FAIL" — set by reviewer2
