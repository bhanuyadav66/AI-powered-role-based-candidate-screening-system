# Frontend — Interview Room

Next.js (App Router) frontend for the candidate screening system.

## Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# edit .env.local if your backend isn't on localhost:8000
npm run dev
```

Open http://localhost:3000. Make sure the backend (`uvicorn app.main:app --reload --port 8000`)
is running first.

## Flow

```
/               resume upload + role select -> uploads resume, starts interview session
/interview/[id] one question at a time -> submits answers, advances until session completes
/summary/[id]   fetches the final structured report (strengths, gaps, topic coverage, transcript)
```

## Design

Built around a "quiet study room" concept rather than a typical SaaS dashboard — the subject
is a candidate under some pressure, so the UI stays calm and gets out of the way. Deep ink
background, a single warm amber accent used only for the active state and primary action,
Fraunces for headings against IBM Plex Sans for body text, with IBM Plex Mono reserved for
small technical labels (topic tags, question counters).

## Known limitation

The current question is carried in `sessionStorage` between pages rather than re-fetched from
the backend, because the API only returns the current question at `/interview/start` and
`/interview/{id}/answer` time — there's no "get current question" endpoint. This is fine for a
normal click-through flow, but a hard page refresh mid-interview will lose the current question
(you'd land on "no active interview for this session"). If extending this: add a
`GET /api/interview/{id}/current-question` endpoint on the backend and swap this page to fetch
from it on mount instead of reading sessionStorage.
