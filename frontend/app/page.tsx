"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProgressRail from "@/components/ProgressRail";
import ResumeUploader from "@/components/ResumeUploader";
import RoleSelector from "@/components/RoleSelector";
import { uploadResume, startInterview, ApiError, type RoleValue, type ResumeUploadResponse } from "@/lib/api";
import { saveInterviewState } from "@/lib/session-store";

export default function HomePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [role, setRole] = useState<RoleValue | null>(null);
  const [uploadData, setUploadData] = useState<ResumeUploadResponse | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-analyze fit score when both file and role are selected
  useEffect(() => {
    let cancelled = false;

    if (!file || !role) {
      setUploadData(null);
      return;
    }

    async function analyze() {
      setAnalyzing(true);
      setError(null);
      try {
        const res = await uploadResume(file!, role!);
        if (!cancelled) {
          setUploadData(res);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Couldn't analyze resume. Check backend connection.");
        }
      } finally {
        if (!cancelled) setAnalyzing(false);
      }
    }

    analyze();

    return () => {
      cancelled = true;
    };
  }, [file, role]);

  const canStart = !!file && !!role && !loading && !analyzing;

  async function handleStart() {
    if (!file || !role) return;
    setLoading(true);
    setError(null);

    try {
      let candidateId = uploadData?.candidate_id;

      if (!candidateId) {
        const res = await uploadResume(file, role);
        candidateId = res.candidate_id;
      }

      const startResult = await startInterview(candidateId, role);

      saveInterviewState({
        sessionId: startResult.session_id,
        role,
        candidateId,
        currentQuestion: startResult.question,
        history: [],
        totalQuestions: 6,
      });

      router.push(`/interview/${startResult.session_id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong starting the interview. Check that the backend is running.");
      }
      setLoading(false);
    }
  }

  const fitScore = uploadData?.fit_score;

  const getScoreBadge = (score: number) => {
    if (score >= 70) return { label: "Strong Alignment", color: "var(--emerald)", bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.3)" };
    if (score >= 40) return { label: "Moderate Alignment", color: "var(--amber)", bg: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.3)" };
    return { label: "Developing Alignment", color: "var(--rust)", bg: "rgba(239, 68, 68, 0.12)", border: "rgba(239, 68, 68, 0.3)" };
  };

  return (
    <main className="shell">
      <ProgressRail activeIndex={file && role ? 1 : file ? 1 : 0} />

      <div style={{ marginBottom: "2rem" }}>
        <p className="eyebrow">
          <span>❖</span> AI-Guided Candidate Screening
        </p>
        <h1>Tailored Technical Interview & Evaluation</h1>
        <p className="muted" style={{ maxWidth: "72ch", fontSize: "1.02rem" }}>
          Upload your resume and choose your target position. Questions adapt dynamically based on your background experience and role knowledge benchmarks.
        </p>
      </div>

      <div className="grid-2col">
        {/* Setup Form Card */}
        <div className="card card-hover" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <ResumeUploader file={file} onSelect={setFile} />
          <RoleSelector value={role} onChange={setRole} />

          {/* Fit Score Analysis Preview Section */}
          {analyzing && (
            <div style={{ padding: "1rem", borderRadius: 8, background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--slate-line)", textAlign: "center" }}>
              <span className="eyebrow" style={{ color: "var(--indigo)" }}>Analyzing Resume Taxonomy Match…</span>
            </div>
          )}

          {fitScore && !analyzing && (
            <div style={{ padding: "1.1rem", borderRadius: 10, background: "rgba(0, 0, 0, 0.25)", border: "1px solid var(--slate-line)", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span className="eyebrow" style={{ color: "var(--cyan)", margin: 0 }}>Resume & Role Alignment</span>
                  <p style={{ margin: "0.2rem 0 0", fontSize: "0.82rem", color: "var(--paper-dim)" }}>
                    Here&rsquo;s how your background maps to this role:
                  </p>
                </div>
                {(() => {
                  const badge = getScoreBadge(fitScore.score);
                  return (
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "1.35rem", fontWeight: 700, color: badge.color, fontFamily: "var(--font-mono)" }}>
                        {fitScore.score}%
                      </span>
                      <div style={{ fontSize: "0.7rem", color: badge.color, fontFamily: "var(--font-mono)", fontWeight: 500 }}>
                        {badge.label}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Category Breakdown Badges */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.2rem" }}>
                {Object.entries(fitScore.category_breakdown).map(([category, item]) => {
                  const hasMatched = item.matched.length > 0;
                  return (
                    <span
                      key={category}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.72rem",
                        padding: "0.2rem 0.55rem",
                        borderRadius: 4,
                        background: hasMatched ? "rgba(16, 185, 129, 0.1)" : "rgba(255, 255, 255, 0.04)",
                        border: `1px solid ${hasMatched ? "rgba(16, 185, 129, 0.25)" : "var(--slate-line)"}`,
                        color: hasMatched ? "var(--emerald)" : "var(--paper-dim)",
                      }}
                    >
                      {category.replace("_", " ")}: {item.matched.length} matched
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {error && <div className="error-box">{error}</div>}

          <button
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.9rem", fontSize: "1rem", marginTop: "0.5rem" }}
            disabled={!canStart}
            onClick={handleStart}
          >
            {loading ? "Initializing AI Evaluator Engine…" : "Begin AI Interview →"}
          </button>
        </div>

        {/* Feature Overview Card */}
        <div className="card" style={{ background: "rgba(17, 24, 39, 0.6)", backdropFilter: "blur(8px)", display: "flex", flexDirection: "column", gap: "1.2rem", justifyContent: "center" }}>
          <div style={{ borderBottom: "1px solid var(--slate-line)", paddingBottom: "0.8rem", marginBottom: "0.4rem" }}>
            <span className="eyebrow" style={{ color: "var(--cyan)" }}>Platform Expectations</span>
            <h2 style={{ fontSize: "1.25rem", margin: 0 }}>What to expect in your session</h2>
          </div>

          <div className="feature-item">
            <div className="feature-icon">🎯</div>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.92rem", color: "var(--paper)" }}>
                6 Dynamic Questions
              </p>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--paper-dim)" }}>
                Deep dives tailored to real engineering scenarios, architecture, and problem-solving.
              </p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon">🧠</div>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.92rem", color: "var(--paper)" }}>
                Resume Contextual Extraction
              </p>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--paper-dim)" }}>
                Skills and projects extracted directly from your PDF to challenge actual domain claims.
              </p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon">📊</div>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.92rem", color: "var(--paper)" }}>
                Instant Assessment Report
              </p>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--paper-dim)" }}>
                Recruiter-ready breakdown highlighting key strengths, coverage matrix, and skill gaps.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
