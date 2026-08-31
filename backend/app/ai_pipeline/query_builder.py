"""
Turns (role, extracted resume skills) into a small set of retrieval queries.

Two query types are generated, on purpose:
  - Resume-driven queries: keep the interview grounded in what the candidate
    actually claims to know.
  - Role-core queries: guarantee coverage of role fundamentals even if the
    resume is thin, so the interview isn't *entirely* self-selected by the
    candidate.
"""
from app.config import settings

ROLE_CORE_TOPICS = {
    "ai_ml_engineer": [
        "core machine learning concepts and model evaluation",
        "supervised vs unsupervised learning fundamentals",
    ],
    "backend_engineer": [
        "API design and system architecture principles",
        "database design and scalability trade-offs",
    ],
}


def build_queries(role: str, flat_skills: list[str], max_skill_queries: int = 3) -> list[dict]:
    """
    Returns a list of {"query": str, "type": "resume_skill" | "role_core", "skill": str|None}
    """
    queries = []

    for skill in flat_skills[:max_skill_queries]:
        queries.append(
            {
                "query": f"{skill} concepts and practical applications relevant to a {role} interview",
                "type": "resume_skill",
                "skill": skill,
            }
        )

    for topic in ROLE_CORE_TOPICS.get(role, []):
        queries.append({"query": topic, "type": "role_core", "skill": None})

    if not queries:
        # Resume had no recognizable skills — fall back entirely to role-core coverage.
        queries.append({"query": f"fundamentals relevant to a {role} interview", "type": "role_core", "skill": None})

    return queries
