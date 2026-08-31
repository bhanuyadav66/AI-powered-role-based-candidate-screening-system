"""
Knowledge ingestion pipeline.

Run this OFFLINE (via ingest_kb.py) whenever the source PDFs change — not on
every API request. It:
  1. Loads role-specific PDFs from knowledge_base/<role_folder>/
  2. Chunks them with paragraph-aware splitting + overlap (context preservation)
  3. Embeds each chunk with a local sentence-transformers model (no API key needed)
  4. Persists everything into a per-role Chroma collection on disk

Chunking strategy rationale (documented here so it's easy to defend in the demo):
  - ~500 tokens per chunk keeps enough context for a coherent question, while
    staying well within LLM context limits when we retrieve top-k chunks.
  - ~15% overlap prevents losing a concept that straddles a chunk boundary.
  - We split on paragraph breaks first, and only fall back to hard token cuts
    for unusually long paragraphs — this preserves semantic coherence far
    better than fixed-size character slicing.
"""
import os
import re
import uuid

import chromadb
import pymupdf

from app.config import settings

_embedder = None


def get_embedder():
    global _embedder
    if _embedder is None:
        # Imported lazily, not at module load time: sentence-transformers pulls
        # in torch, which is slow and memory-heavy to import. Deferring this
        # until the first actual embedding call lets the web server bind its
        # port immediately on startup instead of stalling during import and
        # getting killed by the platform's port-scan timeout.
        from sentence_transformers import SentenceTransformer

        _embedder = SentenceTransformer(settings.embedding_model)
    return _embedder


def _get_chroma_client() -> chromadb.PersistentClient:
    os.makedirs(settings.vector_store_dir, exist_ok=True)
    return chromadb.PersistentClient(path=settings.vector_store_dir)


def extract_text_from_pdf(pdf_path: str) -> str:
    doc = pymupdf.open(pdf_path)
    text = "\n\n".join(page.get_text("text") for page in doc)
    doc.close()
    return text


def _approx_token_count(text: str) -> int:
    # Cheap approximation (~4 chars/token) — good enough for chunk sizing, avoids
    # pulling in a tokenizer dependency just for this.
    return max(1, len(text) // 4)


def chunk_text(text: str, source: str) -> list[dict]:
    """Paragraph-aware chunking with overlap. Returns list of {text, source, chunk_id}."""
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]

    chunks: list[str] = []
    current: list[str] = []
    current_tokens = 0

    for para in paragraphs:
        para_tokens = _approx_token_count(para)

        if para_tokens > settings.chunk_size_tokens:
            # Long paragraph: flush current buffer, then hard-split this paragraph.
            if current:
                chunks.append(" ".join(current))
                current, current_tokens = [], 0
            words = para.split()
            step = max(1, settings.chunk_size_tokens * 4 // max(1, len(words[0]) + 1))
            for i in range(0, len(words), step):
                chunks.append(" ".join(words[i : i + step]))
            continue

        if current_tokens + para_tokens > settings.chunk_size_tokens and current:
            chunks.append(" ".join(current))
            # carry overlap forward
            overlap_words = " ".join(current).split()[-settings.chunk_overlap_tokens :]
            current = [" ".join(overlap_words)] if overlap_words else []
            current_tokens = _approx_token_count(" ".join(current))

        current.append(para)
        current_tokens += para_tokens

    if current:
        chunks.append(" ".join(current))

    return [
        {"text": c, "source": source, "chunk_id": f"{source}::{i}::{uuid.uuid4().hex[:8]}"}
        for i, c in enumerate(chunks)
        if c.strip()
    ]


def ingest_role(role_folder: str, collection_name: str) -> int:
    """
    Ingests all PDFs under knowledge_base/<role_folder>/ into a Chroma collection
    named <collection_name>. Returns the number of chunks stored.
    """
    kb_path = os.path.join(settings.knowledge_base_dir, role_folder)
    if not os.path.isdir(kb_path):
        raise FileNotFoundError(f"No knowledge base folder found at {kb_path}")

    pdf_files = [f for f in os.listdir(kb_path) if f.lower().endswith(".pdf")]
    if not pdf_files:
        print(f"[ingestion] Warning: no PDFs found in {kb_path}")
        return 0

    client = _get_chroma_client()
    # Fresh collection each run keeps ingestion idempotent.
    try:
        client.delete_collection(collection_name)
    except Exception:
        pass
    collection = client.create_collection(collection_name)

    embedder = get_embedder()
    total_chunks = 0

    for pdf_file in pdf_files:
        pdf_path = os.path.join(kb_path, pdf_file)
        print(f"[ingestion] Processing {pdf_file} ...")
        text = extract_text_from_pdf(pdf_path)
        chunks = chunk_text(text, source=pdf_file)

        if not chunks:
            continue

        embeddings = embedder.encode([c["text"] for c in chunks], show_progress_bar=False).tolist()
        collection.add(
            ids=[c["chunk_id"] for c in chunks],
            documents=[c["text"] for c in chunks],
            embeddings=embeddings,
            metadatas=[{"source": c["source"]} for c in chunks],
        )
        total_chunks += len(chunks)
        print(f"[ingestion]   -> {len(chunks)} chunks stored")

    return total_chunks
