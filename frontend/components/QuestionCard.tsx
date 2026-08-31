"use client";

import type { QuestionOut } from "@/lib/api";

export default function QuestionCard({
  question,
  index,
  total,
  answerText,
  onAnswerChange,
}: {
  question: QuestionOut;
  index: number;
  total: number;
  answerText: string;
  onAnswerChange: (text: string) => void;
}) {
  const wordCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;
  const charCount = answerText.length;

  return (
    <div className="grid-2col" style={{ alignItems: "stretch" }}>
      {/* Left Panel: Question Context & AI Prompt */}
      <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "#ffffff",
                background: "linear-gradient(135deg, var(--indigo), #4f46e5)",
                padding: "0.25rem 0.75rem",
                borderRadius: 9999,
                fontWeight: 600,
              }}
            >
              Question {index + 1} of {total}
            </span>

            {question.topic && <span className="tag">🏷️ {question.topic}</span>}
          </div>

          <h2 style={{ fontSize: "1.35rem", lineHeight: 1.4, color: "var(--paper)", marginBottom: "1.2rem" }}>
            {question.text}
          </h2>
        </div>

        <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--slate-line)", borderRadius: 8, padding: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--amber)", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.3rem" }}>
            <span>💡 Evaluation Tip</span>
          </div>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--paper-dim)", lineHeight: 1.4 }}>
            Be specific. Structure your answer with clear bullet points, trade-offs, or pseudo-code where relevant.
          </p>
        </div>
      </div>

      {/* Right Panel: Candidate Answer Workspace */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label className="field-label" htmlFor="answer" style={{ margin: 0, fontWeight: 600, color: "var(--paper)" }}>
            Candidate Response Workspace
          </label>
          <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--paper-dim)" }}>
            {wordCount} words · {charCount} chars
          </span>
        </div>

        <textarea
          id="answer"
          rows={11}
          value={answerText}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Type or paste your answer here... Bullet points and code snippets are welcome."
          style={{
            flex: 1,
            minHeight: "220px",
            fontFamily: "var(--font-body)",
            lineHeight: 1.6,
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem", color: "var(--paper-dim)" }}>
          <span>Press <kbd style={{ background: "rgba(255,255,255,0.1)", padding: "0.15rem 0.4rem", borderRadius: 4, fontFamily: "var(--font-mono)" }}>Ctrl</kbd> + <kbd style={{ background: "rgba(255,255,255,0.1)", padding: "0.15rem 0.4rem", borderRadius: 4, fontFamily: "var(--font-mono)" }}>Enter</kbd> to submit</span>
        </div>
      </div>
    </div>
  );
}
