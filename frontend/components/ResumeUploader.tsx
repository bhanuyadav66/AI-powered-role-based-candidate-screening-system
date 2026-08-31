"use client";

import { useRef, useState } from "react";

export default function ResumeUploader({
  file,
  onSelect,
}: {
  file: File | null;
  onSelect: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    onSelect(fileList[0]);
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div>
      <span className="field-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Candidate Resume</span>
        <span style={{ fontSize: "0.75rem", color: "var(--indigo)" }}>PDF or Plain Text</span>
      </span>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        role="button"
        tabIndex={0}
        style={{
          border: `1.5px dashed ${
            file
              ? "var(--indigo)"
              : dragOver
              ? "var(--cyan)"
              : "var(--slate-line)"
          }`,
          borderRadius: 10,
          padding: "1.75rem 1.25rem",
          textAlign: "center",
          cursor: "pointer",
          background: file
            ? "rgba(99, 102, 241, 0.06)"
            : dragOver
            ? "rgba(6, 182, 212, 0.08)"
            : "rgba(0, 0, 0, 0.2)",
          transition: "all 0.2s ease",
          position: "relative",
        }}
      >
        {file ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", overflow: "hidden" }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: "var(--indigo-glow)",
                  color: "var(--indigo)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.2rem",
                  flexShrink: 0,
                }}
              >
                📄
              </div>
              <div style={{ overflow: "hidden" }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.92rem", color: "var(--paper)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {file.name}
                </p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--paper-dim)", fontFamily: "var(--font-mono)" }}>
                  {formatBytes(file.size)} · Ready for extraction
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(null);
              }}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--slate-line)",
                color: "var(--paper-dim)",
                borderRadius: 6,
                padding: "0.3rem 0.6rem",
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
              Change
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--slate-line)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.1rem",
                color: "var(--indigo)",
                marginBottom: "0.2rem",
              }}
            >
              ⬆
            </div>
            <p style={{ margin: 0, fontWeight: 500, color: "var(--paper)", fontSize: "0.92rem" }}>
              Drop your resume here, or <span style={{ color: "var(--indigo)", textDecoration: "underline" }}>browse files</span>
            </p>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--paper-dim)" }}>
              Upload PDF or plain text resume to calibrate question context
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,text/plain"
          onChange={(e) => handleFiles(e.target.files)}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}
