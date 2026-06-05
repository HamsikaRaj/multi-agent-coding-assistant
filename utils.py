import os
import json
import re
import time
import threading
import anthropic

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")

HAIKU  = "claude-haiku-4-5-20251001"
SONNET = "claude-sonnet-4-6"
OPUS   = "claude-opus-4-8"

# Cost per million tokens (USD)
_PRICE: dict[str, dict[str, float]] = {
    HAIKU:  {"input": 0.80,  "output": 4.00},
    SONNET: {"input": 3.00,  "output": 15.00},
    OPUS:   {"input": 15.00, "output": 75.00},
}

# Thread-local metrics accumulator
_tl = threading.local()


def start_metrics_collection() -> None:
    _tl.data = {}


def get_collected_metrics() -> dict:
    return getattr(_tl, "data", {})


def _record(agent: str, model: str, input_tok: int, output_tok: int, elapsed: float) -> None:
    data = getattr(_tl, "data", None)
    if data is None:
        return
    price = _PRICE.get(model, {"input": 0, "output": 0})
    cost = (input_tok * price["input"] + output_tok * price["output"]) / 1_000_000
    if agent not in data:
        data[agent] = {"input_tokens": 0, "output_tokens": 0, "cost": 0.0, "elapsed": 0.0, "calls": 0, "model": model}
    data[agent]["input_tokens"] += input_tok
    data[agent]["output_tokens"] += output_tok
    data[agent]["cost"]          += cost
    data[agent]["elapsed"]       += elapsed
    data[agent]["calls"]         += 1


def chat(system: str, user: str, max_tokens: int = 4096, model: str = HAIKU,
         prefill: str = "", _agent: str = "unknown") -> str:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise EnvironmentError("ANTHROPIC_API_KEY environment variable not set")
    client = anthropic.Anthropic(api_key=api_key)
    messages: list = [{"role": "user", "content": user}]
    if prefill:
        messages.append({"role": "assistant", "content": prefill})

    t0 = time.time()
    response = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=messages,
    )
    elapsed = time.time() - t0

    _record(_agent, model, response.usage.input_tokens, response.usage.output_tokens, elapsed)

    text = response.content[0].text.strip()
    return prefill + text if prefill else text


def _recover_partial_json(text: str) -> dict:
    result = {}
    pattern = re.compile(r'"((?:[^"\\]|\\.)*)"\s*:\s*"((?:[^"\\]|\\.)*)"', re.DOTALL)
    for m in pattern.finditer(text):
        key = m.group(1).encode().decode("unicode_escape", errors="replace")
        val = m.group(2).encode().decode("unicode_escape", errors="replace")
        result[key] = val
    return result


def extract_json(text: str) -> dict:
    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    candidate = fenced.group(1).strip() if fenced else text.strip()

    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        pass

    start = candidate.find("{")
    end = candidate.rfind("}")
    if start != -1 and end != -1:
        try:
            return json.loads(candidate[start : end + 1])
        except json.JSONDecodeError:
            pass

    blob = candidate[start:] if start != -1 else candidate
    recovered = _recover_partial_json(blob)
    if recovered:
        print(f"[utils] Recovered {len(recovered)} file(s) from truncated JSON.")
        return recovered

    raise ValueError(f"No valid JSON object found in response:\n{text[:500]}")


def write_output_files(code_files: dict) -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    for filename, content in code_files.items():
        filepath = os.path.join(OUTPUT_DIR, filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  [wrote] {filepath}")
