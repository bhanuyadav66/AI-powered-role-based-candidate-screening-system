"use client";

import type { ReportResponse } from "@/lib/api";

const COVERAGE_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  strong: { color: "var(--emerald)", bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.3)" },
  adequate: { color: "var(--amber)", bg: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.3)" },
  weak: { color: "var(--rust)", bg: "rgba(239, 68, 68, 0.12)", border: "rgba(239, 68, 68, 0.3)" },
};

export default function SummaryReport({ report }: { report: ReportResponse }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* Executive Summary Hero Card */}
      <div className="card" style={{ background: "linear-gradient(135deg, rgba(17, 24, 39, 0.9), rgba(31, 41, 61, 0.8))", border: "1px solid var(--indigo-glow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <span className="eyebrow" style={{ margin: 0 }}>📊 AI Executive Assessment</span>
          <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--emerald)", background: "rgba(16,185,129,0.1)", padding: "0.1rem 0.5rem", borderRadius: 4 }}>
            Evaluation Verified
          </span>
        </div>
        <h2 style={{ fontSize: "1.35rem", marginBottom: "0.75rem" }}>Candidate Performance Overview</h2>
        <p style={{ margin: 0, fontSize: "1rem", lineHeight: 1.6, color: "var(--paper)" }}>
          {report.summary_text}
        </p>
      </div>

      {/* Topic Coverage & Matrix Grid */}
      <div className="card">
        <p className="eyebrow" style={{ color: "var(--cyan)" }}>Topic Competency Coverage</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginTop: "0.85rem" }}>
          {Object.entries(report.topic_coverage).map(([topic, level]) => {
            const style = COVERAGE_STYLE[level] || { color: "var(--paper-dim)", bg: "rgba(255,255,255,0.05)", border: "var(--slate-line)" };
            return (
              <span
                key={topic}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.78rem",
                  color: style.color,
                  background: style.bg,
                  border: `1px solid ${style.border}`,
                  borderRadius: 6,
                  padding: "0.3rem 0.75rem",
                  fontWeight: 500,
                }}
              >
                <span>●</span>
                <span>{topic}</span>
                <span style={{ opacity: 0.75, textTransform: "capitalize" }}>({level})</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Strengths & Gaps 2-Column Split */}
      <div className="grid-2col-equal" style={{ display: "grid", gap: "1.5rem" }}>
        {/* Strengths */}
        <div className="card" style={{ borderLeft: "3px solid var(--emerald)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.8rem" }}>
            <span style={{ fontSize: "1.1rem" }}>✅</span>
            <p className="eyebrow" style={{ color: "var(--emerald)", margin: 0 }}>
              Demonstrated Strengths ({report.strengths.length})
            </p>
          </div>
          <ul style={{ margin: 0, paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {report.strengths.map((s, i) => (
              <li key={i} style={{ fontSize: "0.92rem", color: "var(--paper)", lineHeight: 1.5 }}>
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Gaps */}
        <div className="card" style={{ borderLeft: "3px solid var(--rust)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.8rem" }}>
            <span style={{ fontSize: "1.1rem" }}>⚠️</span>
            <p className="eyebrow" style={{ color: "var(--rust)", margin: 0 }}>
              Identified Skill Gaps ({report.gaps.length})
            </p>
          </div>
          <ul style={{ margin: 0, paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {report.gaps.map((g, i) => (
              <li key={i} style={{ fontSize: "0.92rem", color: "var(--paper)", lineHeight: 1.5 }}>
                {g}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Transcript Log */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <p className="eyebrow" style={{ color: "var(--indigo)" }}>Full Q&A Transcript</p>
            <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Session Answers Log</h2>
          </div>
          <span className="tag" style={{ color: "var(--paper-dim)" }}>
            {report.transcript.length} Questions Answered
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {report.transcript.map((item, i) => (
            <div key={i} className="card card-hover" style={{ background: "rgba(17, 24, 39, 0.7)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.72rem",
                    color: "var(--paper-dim)",
                    background: "rgba(255, 255, 255, 0.05)",
                    padding: "0.2rem 0.55rem",
                    borderRadius: 4,
                  }}
                >
                  Q{i + 1}
                </span>
                {item.topic && <span className="tag">{item.topic}</span>}
              </div>

              <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--paper)", marginBottom: "0.85rem", lineHeight: 1.4 }}>
                {item.question}
              </h3>

              <div
                style={{
                  background: "rgba(0, 0, 0, 0.25)",
                  border: "1px solid var(--slate-line)",
                  borderRadius: 8,
                  padding: "1rem",
                }}
              >
                <p className="field-label" style={{ margin: "0 0 0.4rem", fontSize: "0.75rem", color: "var(--indigo)" }}>
                  Candidate Answer
                </p>
                <div
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    fontSize: "0.93rem",
                    lineHeight: 1.6,
                    color: item.answer ? "var(--paper)" : "var(--paper-dim)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {item.answer || "(not answered)"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
