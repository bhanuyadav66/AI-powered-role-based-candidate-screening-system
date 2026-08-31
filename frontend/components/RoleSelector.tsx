"use client";

import { ROLES, type RoleValue } from "@/lib/api";

const ROLE_INFO: Record<RoleValue, { icon: string; desc: string }> = {
  ai_ml_engineer: {
    icon: "⚡",
    desc: "Neural Nets, PyTorch/TF, LLMs, Model Serving & MLOps",
  },
  backend_engineer: {
    icon: "🛠️",
    desc: "Distributed Systems, APIs, Microservices, Databases & Cache",
  },
};

export default function RoleSelector({
  value,
  onChange,
}: {
  value: RoleValue | null;
  onChange: (role: RoleValue) => void;
}) {
  return (
    <div>
      <span className="field-label">Target Role</span>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.85rem" }}>
        {ROLES.map((role) => {
          const active = value === role.value;
          const info = ROLE_INFO[role.value as RoleValue];

          return (
            <button
              key={role.value}
              type="button"
              onClick={() => onChange(role.value as RoleValue)}
              aria-pressed={active}
              style={{
                textAlign: "left",
                padding: "1rem 1.1rem",
                borderRadius: 10,
                border: `1.5px solid ${active ? "var(--indigo)" : "var(--slate-line)"}`,
                background: active ? "rgba(99, 102, 241, 0.1)" : "rgba(0, 0, 0, 0.2)",
                boxShadow: active ? "0 0 16px var(--indigo-glow)" : "none",
                color: "var(--paper)",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
                <span style={{ fontSize: "1.2rem" }}>{info.icon}</span>
                <span style={{ fontWeight: 600, fontSize: "0.98rem" }}>{role.label}</span>
              </div>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--paper-dim)", lineHeight: 1.4 }}>
                {info.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
