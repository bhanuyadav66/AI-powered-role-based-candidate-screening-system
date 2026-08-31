const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export type ExtractedSkills = {
  languages: string[];
  frameworks: string[];
  ml_concepts: string[];
  domains: string[];
};

export type CategoryBreakdownItem = {
  matched: string[];
  missing: string[];
  contribution: number;
};

export type FitScore = {
  score: number;
  category_breakdown: Record<string, CategoryBreakdownItem>;
};

export type ResumeUploadResponse = {
  candidate_id: string;
  extracted_skills: ExtractedSkills;
  target_role: string;
  fit_score?: FitScore;
};

export type QuestionOut = {
  question_id: string;
  text: string;
  topic: string | null;
  order_index: number;
};

export type StartInterviewResponse = {
  session_id: string;
  question: QuestionOut;
};

export type SubmitAnswerResponse = {
  status: "in_progress" | "completed";
  next_question: QuestionOut | null;
};

export type SessionStatusResponse = {
  session_id: string;
  status: string;
  questions_answered: number;
  total_questions: number;
};

export type QATranscriptItem = {
  question: string;
  answer: string;
  topic: string | null;
};

export type ReportResponse = {
  session_id: string;
  summary_text: string;
  strengths: string[];
  gaps: string[];
  topic_coverage: Record<string, string>;
  transcript: QATranscriptItem[];
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      // response wasn't JSON; keep statusText
    }
    throw new ApiError(res.status, typeof detail === "string" ? detail : JSON.stringify(detail));
  }

  return res.json() as Promise<T>;
}

export const ROLES = [
  { value: "ai_ml_engineer", label: "AI/ML Engineer" },
  { value: "backend_engineer", label: "Backend Engineer" },
] as const;

export type RoleValue = (typeof ROLES)[number]["value"];

export async function uploadResume(file: File, targetRole: RoleValue): Promise<ResumeUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("target_role", targetRole);
  return request<ResumeUploadResponse>("/api/resume/upload", {
    method: "POST",
    body: formData,
  });
}

export async function startInterview(candidateId: string, role: RoleValue): Promise<StartInterviewResponse> {
  return request<StartInterviewResponse>("/api/interview/start", {
    method: "POST",
    body: JSON.stringify({ candidate_id: candidateId, role }),
  });
}

export async function submitAnswer(
  sessionId: string,
  questionId: string,
  answerText: string
): Promise<SubmitAnswerResponse> {
  return request<SubmitAnswerResponse>(`/api/interview/${sessionId}/answer`, {
    method: "POST",
    body: JSON.stringify({ question_id: questionId, answer_text: answerText }),
  });
}

export async function getSessionStatus(sessionId: string): Promise<SessionStatusResponse> {
  return request<SessionStatusResponse>(`/api/interview/${sessionId}/status`);
}

export async function getReport(sessionId: string): Promise<ReportResponse> {
  return request<ReportResponse>(`/api/report/${sessionId}`);
}
