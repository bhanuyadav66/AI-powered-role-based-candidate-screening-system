"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProgressRail from "@/components/ProgressRail";
import SummaryReport from "@/components/SummaryReport";
import { getReport, ApiError, type ReportResponse } from "@/lib/api";
import { clearInterviewState } from "@/lib/session-store";

export default function SummaryPage() {
  const router = useRouter();
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;

  const [report, setReport] = useState<ReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await getReport(sessionId);
        if (!cancelled) {
          setReport(result);
          clearInterviewState(sessionId);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Couldn't load the interview report. Check that the backend is running."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <main className="shell">
      <ProgressRail activeIndex={3} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <p className="eyebrow" style={{ color: "var(--emerald)" }}>
            <span>✓</span> Screening Evaluation Complete
          </p>
          <h1 style={{ margin: 0 }}>Candidate Assessment Dashboard</h1>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            className="btn btn-secondary"
            onClick={() => window.print()}
            style={{ fontSize: "0.85rem", padding: "0.6rem 1rem" }}
          >
            🖨️ Export / Print Report
          </button>
          <button
            className="btn btn-primary"
            onClick={() => router.push("/")}
            style={{ fontSize: "0.85rem", padding: "0.6rem 1rem" }}
          >
            + Start New Screening
          </button>
        </div>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: "center", padding: "3.5rem 1.5rem" }}>
          <div className="pulse-dot" style={{ width: 14, height: 14, margin: "0 auto 1rem", background: "var(--indigo)" }} />
          <h2>Synthesizing Candidate Report…</h2>
          <p className="muted" style={{ maxWidth: "44ch", margin: "0 auto" }}>
            Extracting candidate topic coverage, compiling strengths, and scoring identified skill gaps.
          </p>
        </div>
      )}

      {error && <div className="error-box">{error}</div>}

      {report && <SummaryReport report={report} />}
    </main>
  );
}
