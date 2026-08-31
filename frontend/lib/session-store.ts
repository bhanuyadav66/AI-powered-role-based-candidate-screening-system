import type { QuestionOut } from "./api";

export type InterviewProgressEntry = {
  question: QuestionOut;
  answerText: string;
};

export type InterviewState = {
  sessionId: string;
  role: string;
  candidateId: string;
  currentQuestion: QuestionOut;
  history: InterviewProgressEntry[];
  totalQuestions: number;
};

const KEY_PREFIX = "interview_state_";

export function saveInterviewState(state: InterviewState) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(`${KEY_PREFIX}${state.sessionId}`, JSON.stringify(state));
}

export function loadInterviewState(sessionId: string): InterviewState | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(`${KEY_PREFIX}${sessionId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as InterviewState;
  } catch {
    return null;
  }
}

export function clearInterviewState(sessionId: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(`${KEY_PREFIX}${sessionId}`);
}
