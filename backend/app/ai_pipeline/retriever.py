"""
Vector DB retrieval wrapper. Deduplicates overlapping chunks retrieved across
multiple queries so downstream question generation doesn't see repeats.
"""
import chromadb

from app.config import settings
from app.ai_pipeline.ingestion import get_embedder, _get_chroma_client


def _collection_name_for_role(role: str) -> str:
    kb_folder = settings.role_kb_map.get(role, role)
    return f"kb_{kb_folder}"


def retrieve_for_queries(role: str, queries: list[dict]) -> list[dict]:
    """
    queries: output of query_builder.build_queries
    Returns deduped list of {"chunk_id", "text", "source", "matched_query", "skill"}
    """
    client = _get_chroma_client()
    collection_name = _collection_name_for_role(role)

    try:
        collection = client.get_collection(collection_name)
    except Exception:
        raise RuntimeError(
            f"No vector collection found for role '{role}'. "
            f"Run `python ingest_kb.py` first to build the knowledge base index."
        )

    embedder = get_embedder()
    seen_ids: set[str] = set()
    results: list[dict] = []

    for q in queries:
        query_embedding = embedder.encode([q["query"]]).tolist()
        res = collection.query(query_embeddings=query_embedding, n_results=settings.top_k_per_query)

        ids = res["ids"][0]
        docs = res["documents"][0]
        metas = res["metadatas"][0]

        for chunk_id, doc, meta in zip(ids, docs, metas):
            if chunk_id in seen_ids:
                continue
            seen_ids.add(chunk_id)
            results.append(
                {
                    "chunk_id": chunk_id,
                    "text": doc,
                    "source": meta.get("source"),
                    "matched_query": q["query"],
                    "skill": q["skill"],
                }
            )

    return results
