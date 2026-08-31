"use client";

const STAGES = [
  { label: "Resume Upload", sub: "PDF / Text" },
  { label: "Role Selection", sub: "Target Position" },
  { label: "AI Interview", sub: "Adaptive Questions" },
  { label: "Assessment Report", sub: "Results & Breakdown" },
] as const;

export default function ProgressRail({ activeIndex }: { activeIndex: number }) {
  return (
    <nav aria-label="Interview progress" style={{ marginBottom: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", width: "100%", overflowX: "auto", paddingBottom: "0.5rem" }}>
        {STAGES.map((stage, i) => {
          const isDone = i < activeIndex;
          const isCurrent = i === activeIndex;

          return (
            <div
              key={stage.label}
              style={{
                display: "flex",
                alignItems: "center",
                flex: i < STAGES.length - 1 ? 1 : "0 0 auto",
                minWidth: i < STAGES.length - 1 ? "140px" : "auto",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    fontFamily: "var(--font-mono)",
                    background: isCurrent
                      ? "linear-gradient(135deg, var(--indigo), #4f46e5)"
                      : isDone
                      ? "rgba(16, 185, 129, 0.15)"
                      : "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${
                      isCurrent
                        ? "var(--indigo)"
                        : isDone
                        ? "rgba(16, 185, 129, 0.4)"
                        : "var(--slate-line)"
                    }`,
                    color: isCurrent
                      ? "#ffffff"
                      : isDone
                      ? "var(--emerald)"
                      : "var(--paper-dim)",
                    boxShadow: isCurrent ? "0 0 12px var(--indigo-glow)" : "none",
                  }}
                >
                  {isDone ? "✓" : i + 1}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.82rem",
                      fontWeight: isCurrent ? 600 : 500,
                      color: isCurrent
                        ? "var(--paper)"
                        : isDone
                        ? "var(--paper)"
                        : "var(--paper-dim)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {stage.label}
                  </span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: isCurrent ? "var(--indigo)" : "var(--paper-dim)",
                      fontFamily: "var(--font-mono)",
                      opacity: 0.8,
                    }}
                  >
                    {stage.sub}
                  </span>
                </div>
              </div>

              {i < STAGES.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    margin: "0 0.8rem",
                    borderRadius: 1,
                    background: isDone
                      ? "var(--emerald)"
                      : isCurrent
                      ? "linear-gradient(90deg, var(--indigo), var(--slate-line))"
                      : "var(--slate-line)",
                    transition: "background 0.3s ease",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
