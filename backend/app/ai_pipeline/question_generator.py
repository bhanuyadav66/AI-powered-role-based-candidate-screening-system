"""
Turns retrieved context chunks into interview questions.

Every generated question is tagged with the chunk_id(s) that informed it and
the resume skill that triggered its retrieval query (if any) — this is what
gives the system end-to-end traceability: Context -> Question -> Answer -> Storage.
"""
import json
import re

from app.ai_pipeline.llm_client import generate

SYSTEM_PROMPT = """You are an experienced technical interviewer. You generate interview \
questions strictly grounded in the provided reference material. You never invent facts \
outside the given context. You avoid generic, templated, or dictionary-definition style \
questions -- prefer questions that require applying a concept, reasoning about a trade-off, \
or connecting the concept to practical experience. Mix conceptual and applied questions."""


def _build_context_block(chunks: list[dict]) -> str:
    return "\n\n".join(f"[Chunk {c['chunk_id']}] (source: {c['source']})\n{c['text']}" for c in chunks)


def generate_questions(role: str, chunks: list[dict], candidate_skills: list[str], n_questions: int) -> list[dict]:
    """
    Returns a list of:
      {"text": str, "topic": str, "difficulty": str, "source_chunk_ids": [...], "generated_from_skill": str|None}
    """
    # Cap total chunks used in the prompt — free-tier LLM APIs enforce a strict
    # tokens-per-request budget, so keep it comfortably under it.
    chunks = chunks[:8]
    context_block = _build_context_block(chunks)
    skills_str = ", ".join(candidate_skills) if candidate_skills else "no specific skills detected"

    user_prompt = f"""Role being interviewed for: {role}
Candidate's background (extracted from resume): {skills_str}

Reference material (retrieved from the role's knowledge base):
---
{context_block}
---

Generate exactly {n_questions} interview questions based ONLY on the reference material above, \
tailored where possible to the candidate's background. For each question, indicate which \
chunk ID(s) it draws from and, if applicable, which candidate skill motivated it.

Respond with ONLY a JSON array, no other text, in this exact format:
[
  {{
    "text": "...",
    "topic": "short topic label",
    "difficulty": "easy" | "medium" | "hard",
    "source_chunk_ids": ["chunk_id_1", "chunk_id_2"],
    "generated_from_skill": "skill name or null"
  }}
]"""

    raw = generate(SYSTEM_PROMPT, user_prompt)
    questions = _parse_json_array(raw)
    return questions[:n_questions]


def generate_followup_question(
    role: str, previous_question: str, previous_answer: str, remaining_chunks: list[dict]
) -> dict:
    """
    Adaptive follow-up: decides whether to probe deeper on the same topic or
    move to a new one, based on the candidate's last answer.
    """
    context_block = _build_context_block(remaining_chunks[:4])

    user_prompt = f"""Role: {role}

Previous question: {previous_question}
Candidate's answer: {previous_answer}

Available reference material for the next question:
---
{context_block}
---

Decide: if the answer revealed a gap or surface-level understanding, generate a follow-up \
question that probes deeper on the SAME concept. If the answer was strong, generate a NEW \
question on a different topic from the reference material. Ground the question only in the \
reference material provided.

Respond with ONLY a JSON object, no other text:
{{
  "text": "...",
  "topic": "short topic label",
  "difficulty": "easy" | "medium" | "hard",
  "source_chunk_ids": ["chunk_id_1"],
  "generated_from_skill": null,
  "strategy": "probe_deeper" | "new_topic"
}}"""

    raw = generate(SYSTEM_PROMPT, user_prompt)
    parsed = _parse_json_object(raw)
    return parsed


def _parse_json_array(raw: str) -> list[dict]:
    data = _extract_json(raw)
    if isinstance(data, list):
        return data
    if isinstance(data, dict) and "questions" in data and isinstance(data["questions"], list):
        return data["questions"]
    print(f"[question_generator] Failed to parse JSON array from LLM output:\n{raw}\n")
    return [
        {
            "text": "The system could not parse a structured question from the model output. "
            "Please retry.",
            "topic": "system_error",
            "difficulty": "medium",
            "source_chunk_ids": [],
            "generated_from_skill": None,
        }
    ]


def _parse_json_object(raw: str) -> dict:
    data = _extract_json(raw)
    if isinstance(data, dict):
        return data
    print(f"[question_generator] Failed to parse JSON object from LLM output:\n{raw}\n")
    return {
        "text": "The system could not parse a follow-up question. Please retry.",
        "topic": "system_error",
        "difficulty": "medium",
        "source_chunk_ids": [],
        "generated_from_skill": None,
        "strategy": "new_topic",
    }


def _extract_json(raw: str):
    cleaned = raw.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    fence_match = re.search(r"```(?:json)?\s*(.*?)\s*```", cleaned, re.DOTALL)
    if fence_match:
        try:
            return json.loads(fence_match.group(1).strip())
        except json.JSONDecodeError:
            pass

    array_match = re.search(r"\[.*\]", cleaned, re.DOTALL)
    if array_match:
        try:
            return json.loads(array_match.group(0))
        except json.JSONDecodeError:
            pass

    obj_match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if obj_match:
        try:
            return json.loads(obj_match.group(0))
        except json.JSONDecodeError:
            pass

    return None
