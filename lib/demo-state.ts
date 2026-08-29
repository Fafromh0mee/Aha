export const DEMO_STORAGE_KEY = "aha-demo-state-v5";
export const DEMO_CHANNEL_NAME = "aha-demo-channel-v5";
export const DEMO_STATE_VERSION = 5;
export const DEFAULT_ROOM_CODE = "DEMO";

export type DemoMode = "live" | "rehearsal";
export type ReactionKey = "understand" | "confused" | "slow" | "aha";
export type QuizId = "quiz-1" | "quiz-2";
export type QuizOptionId = "A" | "B" | "C" | "D";
export type ActivityMode = "idle" | "interaction" | "quiz" | "results" | "aha" | "ended";
export type DisplayMode =
  | "idle"
  | "interaction"
  | "quiz"
  | "results"
  | "question"
  | "celebration"
  | "ending";

export type DemoQuestion = {
  id: string;
  text: string;
  votes: number;
  isNew?: boolean;
};

export type QuizOption = {
  id: QuizOptionId;
  text: string;
};

export type DemoQuiz = {
  id: QuizId;
  label: string;
  question: string;
  options: QuizOption[];
  correctAnswer: QuizOptionId | null;
  responses: Record<QuizOptionId, number>;
};

export type TimelineEvent = {
  id: string;
  label: string;
  detail: string;
  timestamp: number;
  eventKey?: string;
};

export type PulseHistoryEvent = {
  id: string;
  timestamp: number;
  reaction: ReactionKey;
};

export type ActivityHistoryEvent = {
  id: string;
  timestamp: number;
  type: "class_started" | "pulse_changed" | "quiz_launched" | "quiz_answered" | "quiz_revealed" | "question_submitted" | "aha_launched" | "aha_responded" | "class_ended";
  label: string;
  quizId?: QuizId;
};

export type DemoState = {
  version: typeof DEMO_STATE_VERSION;
  revision: number;
  updatedAt: number;
  session: {
    course: string;
    topic: string;
    connectedStudents: number;
    participantCount: number;
    status: "waiting" | "live" | "ended";
    startedAt: number | null;
    endedAt: number | null;
    durationMs: number | null;
  };
  reactions: Record<ReactionKey, number>;
  questions: DemoQuestion[];
  quizzes: DemoQuiz[];
  activeQuizId: QuizId | null;
  activityMode: ActivityMode;
  displayMode: DisplayMode;
  selectedQuestionId: string | null;
  studentReaction: ReactionKey | null;
  studentAnswers: Partial<Record<QuizId, QuizOptionId>>;
  ahaMoment: {
    launched: boolean;
    completed: boolean;
    feedback: ReactionKey | null;
    reactions: Record<ReactionKey, number>;
    responseCount: number;
    feedbackCount: number;
    feedbackMessages: string[];
  };
  timeline: TimelineEvent[];
  pulseHistory: PulseHistoryEvent[];
  activityHistory: ActivityHistoryEvent[];
  metrics: {
    interactionCount: number;
    quizResponseCount: number;
    averageQuizResponseTimeMs: number | null;
  };
};

export const reactionMeta: Array<{
  key: ReactionKey;
  emoji: string;
  label: string;
  surface: string;
}> = [
  { key: "understand", emoji: "👍", label: "เข้าใจ", surface: "#E6F7EF" },
  { key: "confused", emoji: "🤯", label: "งง", surface: "#FDEAF2" },
  { key: "slow", emoji: "🐢", label: "ตามไม่ทัน", surface: "#FFF4C2" },
  { key: "aha", emoji: "💡", label: "อ๋อ!", surface: "#E6F4FF" },
];

function createQuizDefinitions(responses?: Partial<Record<QuizId, Record<QuizOptionId, number>>>): DemoQuiz[] {
  return [
    {
      id: "quiz-1",
      label: "Quiz 1",
      question: "ดาวเคราะห์ดวงใดอยู่ใกล้ดวงอาทิตย์มากที่สุด?",
      options: [
        { id: "A", text: "โลก" },
        { id: "B", text: "ดาวอังคาร" },
        { id: "C", text: "ดาวพุธ" },
        { id: "D", text: "ดาวศุกร์" },
      ],
      correctAnswer: "C",
      responses: responses?.["quiz-1"] ?? { A: 0, B: 0, C: 0, D: 0 },
    },
    {
      id: "quiz-2",
      label: "Quiz 2",
      question: "เมืองหลวงของประเทศญี่ปุ่นคือเมืองใด?",
      options: [
        { id: "A", text: "โอซาก้า" },
        { id: "B", text: "โตเกียว" },
        { id: "C", text: "เกียวโต" },
        { id: "D", text: "ฮิโรชิมา" },
      ],
      correctAnswer: "B",
      responses: responses?.["quiz-2"] ?? { A: 0, B: 0, C: 0, D: 0 },
    },
  ];
}

function createBaseState(): DemoState {
  return {
    version: DEMO_STATE_VERSION,
    revision: 0,
    updatedAt: 0,
    session: {
      course: "Aha! Live Classroom",
      topic: "Demo Session",
      connectedStudents: 0,
      participantCount: 0,
      status: "waiting",
      startedAt: null,
      endedAt: null,
      durationMs: null,
    },
    reactions: { understand: 0, confused: 0, slow: 0, aha: 0 },
    questions: [],
    quizzes: createQuizDefinitions(),
    activeQuizId: null,
    activityMode: "idle",
    displayMode: "idle",
    selectedQuestionId: null,
    studentReaction: null,
    studentAnswers: {},
    ahaMoment: {
      launched: false,
      completed: false,
      feedback: null,
      reactions: { understand: 0, confused: 0, slow: 0, aha: 0 },
      responseCount: 0,
      feedbackCount: 0,
      feedbackMessages: [],
    },
    timeline: [],
    pulseHistory: [],
    activityHistory: [],
    metrics: {
      interactionCount: 0,
      quizResponseCount: 0,
      averageQuizResponseTimeMs: null,
    },
  };
}

export function createLiveDemoState(): DemoState {
  return createBaseState();
}

export function createRehearsalDemoState(): DemoState {
  return {
    ...createBaseState(),
    session: {
      course: "Aha! Live Classroom",
      topic: "Demo Session",
      connectedStudents: 21,
      participantCount: 21,
      status: "live",
      startedAt: 0,
      endedAt: null,
      durationMs: null,
    },
    reactions: { understand: 10, confused: 4, slow: 2, aha: 4 },
    questions: [
      { id: "question-1", text: "ทำไมดาวพุธถึงไม่ใช่ดาวที่ร้อนที่สุด?", votes: 8 },
      { id: "question-2", text: "ดาวศุกร์ร้อนกว่าดาวพุธเพราะอะไร?", votes: 6 },
      { id: "question-3", text: "โตเกียวเป็นเมืองหลวงมาตั้งแต่เมื่อไร?", votes: 5 },
      { id: "question-4", text: "เกียวโตเคยเป็นเมืองหลวงใช่ไหม?", votes: 4 },
    ],
    quizzes: createQuizDefinitions({
      "quiz-1": { A: 2, B: 1, C: 12, D: 3 },
      "quiz-2": { A: 3, B: 11, C: 4, D: 1 },
    }),
    timeline: [
      { id: "seed-1", label: "โหลดข้อมูล Rehearsal แล้ว", detail: "สำหรับซ้อม Demo เท่านั้น", timestamp: 0 },
      { id: "seed-2", label: "นักเรียนจำลอง 21 คน", detail: "Live Pitch Mode จะเริ่มจาก 0", timestamp: 1 },
    ],
  };
}

export function createInitialDemoState(): DemoState {
  return createLiveDemoState();
}

export function isDemoState(value: unknown): value is DemoState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<DemoState>;
  return (
    candidate.version === DEMO_STATE_VERSION &&
    typeof candidate.revision === "number" &&
    typeof candidate.updatedAt === "number" &&
    candidate.session?.course === "Aha! Live Classroom" &&
    Array.isArray(candidate.questions) &&
    Array.isArray(candidate.quizzes) &&
    Array.isArray(candidate.timeline) &&
    Array.isArray(candidate.pulseHistory) &&
    Array.isArray(candidate.activityHistory) &&
    (candidate.studentReaction === null || reactionMeta.some((reaction) => reaction.key === candidate.studentReaction)) &&
    typeof candidate.ahaMoment?.responseCount === "number" &&
    typeof candidate.session?.participantCount === "number" &&
    typeof candidate.metrics?.interactionCount === "number"
  );
}

export function getQuiz(state: DemoState, quizId: QuizId | null) {
  return state.quizzes.find((quiz) => quiz.id === quizId) ?? null;
}

export function getResponseTotal(quiz: DemoQuiz) {
  return Object.values(quiz.responses).reduce((total, count) => total + count, 0);
}
