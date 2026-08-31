"""
Role requirements and resume fit score calculation engine.

Defines weighted skill expectations per role and computes an explainable,
category-weighted fit score (0-100%) with matched vs. missing skill breakdowns.
"""

ROLE_REQUIREMENTS = {
    "ai_ml_engineer": {
        "ml_concepts": {
            "weight": 0.4,
            "expected": [
                "machine learning",
                "deep learning",
                "nlp",
                "computer vision",
                "neural network",
                "transformer",
                "embeddings",
                "rag",
                "llm",
                "fine-tuning",
            ],
        },
        "frameworks": {
            "weight": 0.3,
            "expected": ["pytorch", "tensorflow", "scikit-learn", "keras", "langchain"],
        },
        "languages": {
            "weight": 0.2,
            "expected": ["python", "sql", "c++", "r"],
        },
        "domains": {
            "weight": 0.1,
            "expected": ["mlops", "data pipeline", "cloud", "aws", "gcp", "docker"],
        },
    },
    "backend_engineer": {
        "domains": {
            "weight": 0.35,
            "expected": [
                "microservices",
                "distributed systems",
                "rest api",
                "database design",
                "ci/cd",
                "cloud",
                "aws",
                "docker",
                "kubernetes",
            ],
        },
        "languages": {
            "weight": 0.3,
            "expected": ["python", "java", "go", "sql", "typescript", "c#"],
        },
        "frameworks": {
            "weight": 0.25,
            "expected": ["fastapi", "flask", "django", "express", "spring boot", "node.js"],
        },
        "ml_concepts": {
            "weight": 0.1,
            "expected": ["rag", "llm"],
        },
    },
}


def compute_fit_score(extracted_skills: dict[str, list[str]], role: str) -> dict:
    """
    Computes a weighted candidate fit score (0-100) and category breakdown.
    
    Overlap per category is len(matched) / len(expected), capped at 1.0.
    Category score = overlap * weight * 100.
    Overall fit score = sum of category scores rounded to nearest integer (0-100).
    """
    reqs = ROLE_REQUIREMENTS.get(role)
    if not reqs:
        return {"score": 0, "category_breakdown": {}}

    total_weighted_score = 0.0
    category_breakdown = {}

    for cat, data in reqs.items():
        weight = data["weight"]
        expected = data["expected"]
        found_in_cat = [s.lower() for s in extracted_skills.get(cat, [])]

        matched = [term for term in expected if term.lower() in found_in_cat]
        missing = [term for term in expected if term.lower() not in found_in_cat]

        overlap = len(matched) / len(expected) if expected else 0.0
        overlap = min(overlap, 1.0)

        contribution = round(overlap * weight * 100, 1)
        total_weighted_score += contribution

        category_breakdown[cat] = {
            "matched": matched,
            "missing": missing,
            "contribution": contribution,
        }

    final_score = min(round(total_weighted_score), 100)

    return {
        "score": final_score,
        "category_breakdown": category_breakdown,
    }
