from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.core.db import init_db
from app.api import routes_resume, routes_interview, routes_report

app = FastAPI(
    title="AI-Powered Candidate Screening System",
    description="RAG-driven role-based technical interview backend.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Catch-all so the API always returns structured JSON, never a raw 500 trace.
    return JSONResponse(status_code=500, content={"detail": f"Internal server error: {exc}"})


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(routes_resume.router)
app.include_router(routes_interview.router)
app.include_router(routes_report.router)
