# AI-Powered Role-Based Candidate Screening System

A RAG-based technical interview system that generates role-specific interview questions
grounded in a candidate's resume and a curated knowledge base, conducts an adaptive
interview, and produces a structured evaluation report.

Built for the PGAGI AI/ML & Backend Engineering Intern assignment.

## Architecture

```
Resume upload → resume_parser (skill extraction, fit score)
             → query_builder (skills + role → retrieval queries)
             → retriever (Chroma similarity search)
             → question_generator (LLM, grounded in retrieved chunks)
             → stored as Question rows with source_chunk_ids (traceability)
             → Answer submitted → adaptive follow-up generated
             → on completion → report_service builds structured summary
```

Frontend (Next.js) → Backend (FastAPI) → Groq LLM (question generation, reports)
↓
Chroma (vector store) + SQLite (sessions, Q&A, reports)


## Tech Stack

- **Backend**: FastAPI, SQLAlchemy, SQLite
- **RAG**: ChromaDB (vector store), sentence-transformers (local embeddings — MiniLM)
- **LLM**: Groq (`llama-3.1-8b-instant`) — question generation, adaptive follow-ups, report generation
- **Frontend**: Next.js (App Router), TypeScript
- **Resume parsing**: PyMuPDF + a curated skills taxonomy (explainable, no black-box NER)

## Setup — Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt

copy .env.example .env         # Windows — use `cp` on macOS/Linux
```

Edit `backend/.env` and set your Groq API key (free tier: console.groq.com/keys).

**Add knowledge base PDFs.** Download the role-relevant PDFs from the assignment's
resource list and place them:

backend/knowledge_base/ai_ml/ -> e.g. Tom Mitchell - Machine Learning.pdf
backend/knowledge_base/backend/ -> a backend/systems design reference PDF


**Ingest the knowledge base** (run once, and again whenever the PDFs change):

```bash
python ingest_kb.py
```

This chunks each PDF, embeds the chunks locally, and persists them into a Chroma vector
store under `backend/vector_store/`.

**Run the API:**

```bash
uvicorn app.main:app --reload --port 8000
```

Interactive API docs: http://localhost:8000/docs

## Setup — Frontend

In a separate terminal:

```bash
cd frontend
npm install
copy .env.local.example .env.local     # Windows — use `cp` on macOS/Linux
npm run dev
```

Open http://localhost:3000. Make sure the backend is already running on port 8000.

## Running the full demo locally

1. Start the backend (`uvicorn app.main:app --reload --port 8000`)
2. Start the frontend (`npm run dev`)
3. Open http://localhost:3000
4. Upload a resume, pick a role — see the resume-role fit score
5. Answer the generated interview questions (adaptive follow-ups adjust based on answer quality)
6. View the final structured summary report

## Design Decisions

- **SQLite** for zero-setup persistence — swap to Postgres by changing `DATABASE_URL`
  in `.env`, no code changes needed.
- **Chroma (embedded)** instead of a hosted vector DB — no infra to stand up, persists
  to disk, sufficient for this scope.
- **Local embeddings** (sentence-transformers, MiniLM) so ingestion and retrieval don't
  cost API credits; **Groq** for generation, for its fast free tier.
- **Traceability**: every generated `Question` stores the `source_chunk_ids` it was
  grounded in, satisfying the Context → Question → Answer → Storage requirement.
- **Adaptive follow-ups**: after each answer, the next question either probes deeper
  on the same topic (if the answer was weak) or moves to a new topic (if strong).
- **Resume-role fit score**: a weighted keyword-overlap score (not a literal "ATS score",
  which would overclaim what's actually computed) between extracted resume skills and a
  curated per-role expected-skills list, with a category-by-category breakdown so the
  score is explainable rather than a black-box number.
- **Chunking strategy**: paragraph-aware splitting (~500 tokens, ~15% overlap) rather
  than fixed-size character slicing, to preserve semantic coherence within each chunk.

## Known Limitations

- **Live deployment was attempted and abandoned** for this submission (Render hit a
  512MB free-tier memory limit loading the embedding model; Railway's free trial ran
  out) — the system runs and was demoed locally instead.
- The frontend carries the current interview question in `sessionStorage` between
  pages rather than re-fetching it from the backend, since the API only returns the
  current question at `/interview/start` and `/interview/{id}/answer` time. A hard
  page refresh mid-interview loses the current question.
- SQLite persistence is local-only; sessions, answers, and reports don't survive a
  fresh clone/setup on another machine.

## Demo Video
[click](https://drive.google.com/file/d/1YXwZa3-u6jtByZmIdq9sj6EbQqzK4Hy4/view?usp=sharing)

