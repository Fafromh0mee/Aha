import type { DemoState, QuizId, QuizOptionId, ReactionKey } from "./demo-state";

export type ClientRole = "teacher" | "student" | "display";

export type ClientAction =
  | { type: "start_class" }
  | { type: "launch_quiz"; quizId: QuizId }
  | { type: "reveal_results" }
  | { type: "show_question"; questionId: string }
  | { type: "launch_aha" }
  | { type: "end_class" }
  | { type: "reset_room" }
  | { type: "reaction"; reaction: ReactionKey }
  | { type: "answer_quiz"; quizId: QuizId; answer: QuizOptionId }
  | { type: "submit_question"; text: string }
  | { type: "aha_feedback"; reaction: ReactionKey; feedback?: string };

export type ServerMessage =
  | { type: "welcome"; clientId: string; room: string; state: DemoState }
  | { type: "state"; state: DemoState }
  | { type: "error"; message: string };

const teacherActions = new Set([
  "start_class",
  "launch_quiz",
  "reveal_results",
  "show_question",
  "launch_aha",
  "end_class",
  "reset_room",
]);

const studentActions = new Set([
  "reaction",
  "answer_quiz",
  "submit_question",
  "aha_feedback",
]);

export function roleCanSend(role: ClientRole, action: ClientAction) {
  return role === "teacher"
    ? teacherActions.has(action.type)
    : role === "student" && studentActions.has(action.type);
}

export function isClientRole(value: string | null): value is ClientRole {
  return value === "teacher" || value === "student" || value === "display";
}

export function isReactionKey(value: unknown): value is ReactionKey {
  return value === "understand" || value === "confused" || value === "slow" || value === "aha";
}

export function isQuizId(value: unknown): value is QuizId {
  return value === "quiz-1" || value === "quiz-2";
}

export function isQuizOptionId(value: unknown): value is QuizOptionId {
  return value === "A" || value === "B" || value === "C" || value === "D";
}

export function parseClientAction(value: unknown): ClientAction | null {
  if (!value || typeof value !== "object" || !("type" in value)) return null;
  const message = value as Record<string, unknown>;
  switch (message.type) {
    case "start_class":
    case "reveal_results":
    case "launch_aha":
    case "end_class":
    case "reset_room":
      return { type: message.type };
    case "launch_quiz":
      return isQuizId(message.quizId) ? { type: message.type, quizId: message.quizId } : null;
    case "show_question":
      return typeof message.questionId === "string" && message.questionId.length <= 100
        ? { type: message.type, questionId: message.questionId }
        : null;
    case "reaction":
      return isReactionKey(message.reaction) ? { type: message.type, reaction: message.reaction } : null;
    case "answer_quiz":
      return isQuizId(message.quizId) && isQuizOptionId(message.answer)
        ? { type: message.type, quizId: message.quizId, answer: message.answer }
        : null;
    case "submit_question":
      return typeof message.text === "string" && message.text.trim().length > 0 && message.text.length <= 280
        ? { type: message.type, text: message.text.trim() }
        : null;
    case "aha_feedback":
      return isReactionKey(message.reaction) &&
        (message.feedback === undefined || (typeof message.feedback === "string" && message.feedback.length <= 500))
        ? { type: message.type, reaction: message.reaction, feedback: typeof message.feedback === "string" ? message.feedback.trim() : undefined }
        : null;
    default:
      return null;
  }
}
