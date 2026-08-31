# Backend — AI-Powered Candidate Screening System

FastAPI service implementing the RAG pipeline: resume parsing, retrieval,
question generation, adaptive follow-ups, and report generation.

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and set GROQ_API_KEY (free tier: https://console.groq.com/keys)
```

## 1. Add knowledge base PDFs

Download the role-relevant PDFs from the assignment's resource list and place them:

```
knowledge_base/ai_ml/       -> e.g. Tom Mitchell - Machine Learning.pdf
knowledge_base/backend/     -> a backend-systems reference PDF
```

## 2. Ingest the knowledge base (run once, and whenever PDFs change)

```bash
python ingest_kb.py
```

This chunks each PDF, embeds the chunks locally (sentence-transformers, no
API key needed), and persists them into a Chroma vector store per role under
`vector_store/`.

## 3. Run the API

```bash
uvicorn app.main:app --reload --port 8000
```

Interactive API docs: http://localhost:8000/docs

## Architecture

```
Resume upload -> resume_parser (extract skills)
              -> query_builder (skills + role -> queries)
              -> retriever (Chroma similarity search)
              -> question_generator (LLM, grounded in retrieved chunks)
              -> stored as Question rows with source_chunk_ids (traceability)
              -> Answer submitted -> adaptive follow-up generated
              -> on completion -> report_service builds structured summary
```

See the top-level `docs/architecture.md` for the full design write-up.

## Key design decisions

- **SQLite by default** for zero-setup persistence; swap to Postgres by
  changing `DATABASE_URL` in `.env` — no code changes needed.
- **Chroma (embedded)** instead of a hosted vector DB — no infra to stand up,
  persists to disk, good enough for this scope. Swap for Pinecone/Qdrant in
  `ai_pipeline/ingestion.py` + `retriever.py` if scaling further.
- **Local embeddings (sentence-transformers)** so ingestion doesn't cost API
  credits; **Groq** for generation, since it has a fast free tier.
- **Traceability**: every `Question` row stores the `source_chunk_ids` it was
  generated from, satisfying the assignment's Context→Question→Answer→Storage
  requirement.
- **Adaptive follow-ups**: after each answer, the next question is generated
  based on whether the previous answer was strong (move to a new topic) or
  weak (probe deeper) — see `question_generator.generate_followup_question`.
