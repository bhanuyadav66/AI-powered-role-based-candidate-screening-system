"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ProgressRail from "@/components/ProgressRail";
import QuestionCard from "@/components/QuestionCard";
import { submitAnswer, ApiError } from "@/lib/api";
import { loadInterviewState, saveInterviewState, type InterviewState } from "@/lib/session-store";

export default function InterviewPage() {
  const router = useRouter();
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;

  const [state, setState] = useState<InterviewState | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadInterviewState(sessionId);
    setState(loaded);
  }, [sessionId]);

  const handleSubmit = useCallback(async () => {
    if (!state || !answerText.trim() || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const result = await submitAnswer(state.sessionId, state.currentQuestion.question_id, answerText);
      const nextHistory = [...state.history, { question: state.currentQuestion, answerText }];

      if (result.status === "completed" || !result.next_question) {
        saveInterviewState({ ...state, history: nextHistory });
        router.push(`/summary/${state.sessionId}`);
        return;
      }

      const nextState: InterviewState = {
        ...state,
        currentQuestion: result.next_question,
        history: nextHistory,
      };
      saveInterviewState(nextState);
      setState(nextState);
      setAnswerText("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't submit that answer. Try again.");
    } finally {
      setSubmitting(false);
    }
  }, [state, answerText, submitting, router]);

  // Handle Ctrl+Enter / Cmd+Enter keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSubmit]);

  if (!state) {
    return (
      <main className="shell">
        <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
          <p className="eyebrow" style={{ color: "var(--amber)" }}>Session Expired or Not Found</p>
          <h2>No Active Interview Session</h2>
          <p className="muted" style={{ maxWidth: "48ch", margin: "0 auto 1.5rem" }}>
            We couldn&rsquo;t find an active interview session in this browser tab.
          </p>
          <button className="btn btn-secondary" onClick={() => router.push("/")}>
            ← Back to Start
          </button>
        </div>
      </main>
    );
  }

  const answeredCount = state.history.length;

  return (
    <main className="shell">
      <ProgressRail activeIndex={2} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span className="eyebrow">Interactive Evaluation Room</span>
          <h1 style={{ fontSize: "1.8rem", margin: 0 }}>Live Candidate Assessment</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span className="tag" style={{ color: "var(--indigo)", borderColor: "var(--indigo-glow)", background: "rgba(99, 102, 241, 0.1)" }}>
            Role: {state.role.replace(/_/g, " ").toUpperCase()}
          </span>
          <span className="tag" style={{ color: "var(--amber)", borderColor: "var(--amber-glow)", background: "rgba(245, 158, 11, 0.1)" }}>
            Session: #{state.sessionId.slice(0, 8)}
          </span>
        </div>
      </div>

      <QuestionCard
        question={state.currentQuestion}
        index={answeredCount}
        total={state.totalQuestions}
        answerText={answerText}
        onAnswerChange={setAnswerText}
      />

      {error && (
        <div className="error-box" style={{ marginTop: "1.25rem" }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
          Question {answeredCount + 1} of {state.totalQuestions}
        </p>

        <button
          className="btn btn-primary"
          style={{ padding: "0.85rem 2rem", fontSize: "0.98rem" }}
          disabled={submitting || !answerText.trim()}
          onClick={handleSubmit}
        >
          {submitting ? "Evaluator Processing…" : "Submit Answer & Continue →"}
        </button>
      </div>
    </main>
  );
}
