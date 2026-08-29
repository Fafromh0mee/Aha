import { DurableObject } from "cloudflare:workers";
import {
  createLiveDemoState,
  getQuiz,
  type DemoState,
  type ActivityHistoryEvent,
  type QuizId,
  type QuizOptionId,
  type ReactionKey,
  type PulseHistoryEvent,
  type TimelineEvent,
} from "../lib/demo-state";
import {
  isClientRole,
  parseClientAction,
  roleCanSend,
  type ClientAction,
  type ClientRole,
  type ServerMessage,
} from "../lib/live-protocol";

type SocketAttachment = {
  role: ClientRole;
  clientId: string;
};

type AhaResponse = {
  reaction: ReactionKey;
  feedback: string;
};

type StoredRoom = {
  state: DemoState;
  studentReactions: Record<string, ReactionKey>;
  quizAnswers: Record<QuizId, Record<string, QuizOptionId>>;
  ahaResponses: Record<string, AhaResponse>;
  resetStudentIds: string[];
  participantIds: string[];
  quizLaunchedAt: Record<QuizId, number | null>;
  quizFirstAnswersAt: Record<QuizId, Record<string, number>>;
};

const MAX_MESSAGE_BYTES = 4096;

function createStoredRoom(): StoredRoom {
  return {
    state: createLiveDemoState(),
    studentReactions: {},
    quizAnswers: { "quiz-1": {}, "quiz-2": {} },
    ahaResponses: {},
    resetStudentIds: [],
    participantIds: [],
    quizLaunchedAt: { "quiz-1": null, "quiz-2": null },
    quizFirstAnswersAt: { "quiz-1": {}, "quiz-2": {} },
  };
}

function addTimelineEvent(
  state: DemoState,
  label: string,
  detail: string,
  timestamp: number,
  eventKey?: string,
) {
  if (eventKey && state.timeline.some((event) => event.eventKey === eventKey)) {
    return state.timeline;
  }
  const event: TimelineEvent = {
    id: crypto.randomUUID(),
    label,
    detail,
    timestamp,
    eventKey,
  };
  return [event, ...state.timeline].slice(0, 8);
}

function addActivityEvent(
  state: DemoState,
  type: ActivityHistoryEvent["type"],
  label: string,
  timestamp: number,
  quizId?: QuizId,
) {
  return [{ id: crypto.randomUUID(), type, label, timestamp, quizId }, ...state.activityHistory].slice(0, 200);
}

function addPulseEvent(state: DemoState, reaction: ReactionKey, timestamp: number): PulseHistoryEvent[] {
  return [{ id: crypto.randomUUID(), reaction, timestamp }, ...state.pulseHistory].slice(0, 500);
}

function countReactions(values: Record<string, ReactionKey>) {
  const counts: Record<ReactionKey, number> = {
    understand: 0,
    confused: 0,
    slow: 0,
    aha: 0,
  };
  for (const reaction of Object.values(values)) counts[reaction] += 1;
  return counts;
}

function countQuizAnswers(values: Record<string, QuizOptionId>) {
  const counts: Record<QuizOptionId, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const answer of Object.values(values)) counts[answer] += 1;
  return counts;
}

function isSocketAttachment(value: unknown): value is SocketAttachment {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SocketAttachment>;
  return isClientRole(candidate.role ?? null) && typeof candidate.clientId === "string";
}

function normalizeRoom(value: unknown): StoredRoom {
  const fallback = createStoredRoom();
  if (!value || typeof value !== "object") return fallback;
  const candidate = value as Partial<StoredRoom>;
  if (!candidate.state || typeof candidate.state !== "object") return fallback;

  const previous = candidate.state as Partial<DemoState>;
  const previousSession: Partial<DemoState["session"]> = previous.session ?? {};
  const migratedAt = typeof previous.updatedAt === "number" && previous.updatedAt > 0
    ? previous.updatedAt
    : Date.now();
  const status = previousSession.status === "ended"
    ? "ended"
    : previousSession.status === "live"
      ? "live"
      : "waiting";
  const startedAt = typeof previousSession.startedAt === "number"
    ? previousSession.startedAt
    : status === "waiting" ? null : migratedAt;
  const endedAt = typeof previousSession.endedAt === "number"
    ? previousSession.endedAt
    : status === "ended" ? migratedAt : null;
  const timeline = Array.isArray(previous.timeline)
    ? previous.timeline.map((event) => ({ ...event, timestamp: typeof event.timestamp === "number" ? event.timestamp : migratedAt }))
    : [];
  const state: DemoState = {
    ...fallback.state,
    ...previous,
    version: fallback.state.version,
    session: {
      ...fallback.state.session,
      ...previousSession,
      status,
      startedAt,
      endedAt,
      durationMs: typeof previousSession.durationMs === "number"
        ? previousSession.durationMs
        : endedAt && startedAt ? Math.max(0, endedAt - startedAt) : null,
      participantCount: typeof previousSession.participantCount === "number"
        ? previousSession.participantCount
        : typeof previousSession.connectedStudents === "number" ? previousSession.connectedStudents : 0,
    },
    timeline,
    pulseHistory: Array.isArray(previous.pulseHistory) ? previous.pulseHistory : [],
    activityHistory: Array.isArray(previous.activityHistory) ? previous.activityHistory : [],
    metrics: previous.metrics && typeof previous.metrics.interactionCount === "number"
      ? previous.metrics
      : fallback.state.metrics,
  };

  return {
    state,
    studentReactions: candidate.studentReactions ?? {},
    quizAnswers: candidate.quizAnswers ?? fallback.quizAnswers,
    ahaResponses: candidate.ahaResponses ?? {},
    resetStudentIds: candidate.resetStudentIds ?? [],
    participantIds: candidate.participantIds ?? [],
    quizLaunchedAt: candidate.quizLaunchedAt ?? fallback.quizLaunchedAt,
    quizFirstAnswersAt: candidate.quizFirstAnswersAt ?? fallback.quizFirstAnswersAt,
  };
}

export class ClassroomRoom extends DurableObject<CloudflareEnv> {
  constructor(ctx: DurableObjectState, env: CloudflareEnv) {
    super(ctx, env);
    void this.ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS room_state (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          json TEXT NOT NULL
        )
      `);
      const existing = this.ctx.storage.sql
        .exec<{ count: number }>("SELECT COUNT(*) AS count FROM room_state WHERE id = 1")
        .one();
      if (existing.count === 0) {
        this.ctx.storage.sql.exec(
          "INSERT INTO room_state (id, json) VALUES (1, ?)",
          JSON.stringify(createStoredRoom()),
        );
      }
      this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
    });
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response("Expected a WebSocket upgrade", { status: 426 });
    }

    const url = new URL(request.url);
    const role = url.searchParams.get("role");
    if (!isClientRole(role)) {
      return Response.json({ error: "Invalid client role" }, { status: 400 });
    }

    const requestedId = url.searchParams.get("clientId");
    const clientId = requestedId && /^[A-Za-z0-9-]{8,80}$/.test(requestedId)
      ? requestedId
      : crypto.randomUUID();

    if (role === "student") {
      for (const socket of this.ctx.getWebSockets("student")) {
        const attachment = socket.deserializeAttachment();
        if (isSocketAttachment(attachment) && attachment.clientId === clientId) {
          socket.close(4001, "Replaced by a newer connection");
        }
      }
    }

    const [client, server] = Object.values(new WebSocketPair());
    const attachment: SocketAttachment = { role, clientId };
    this.ctx.acceptWebSocket(server, [role]);
    server.serializeAttachment(attachment);

    let room = this.readRoom();
    if (role === "student" && room.resetStudentIds.includes(clientId)) {
      room = {
        ...room,
        resetStudentIds: room.resetStudentIds.filter((id) => id !== clientId),
      };
      this.writeRoom(room);
    }
    if (role === "student" && !room.participantIds.includes(clientId)) {
      room = this.withState(
        { ...room, participantIds: [...room.participantIds, clientId] },
        {
          ...room.state,
          session: {
            ...room.state.session,
            participantCount: room.state.session.participantCount + 1,
          },
        },
        Date.now(),
      );
      this.writeRoom(room);
    }
    const welcome: ServerMessage = {
      type: "welcome",
      clientId,
      room: url.searchParams.get("room") ?? "DEMO",
      state: this.stateForClient(room, attachment),
    };
    server.send(JSON.stringify(welcome));
    this.broadcast(room);

    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(socket: WebSocket, message: string | ArrayBuffer): void {
    const attachment = socket.deserializeAttachment();
    if (!isSocketAttachment(attachment)) {
      socket.send(JSON.stringify({ type: "error", message: "Missing client session" } satisfies ServerMessage));
      return;
    }

    if (typeof message !== "string" || message.length > MAX_MESSAGE_BYTES) {
      socket.send(JSON.stringify({ type: "error", message: "Invalid message" } satisfies ServerMessage));
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(message);
    } catch {
      socket.send(JSON.stringify({ type: "error", message: "Malformed JSON" } satisfies ServerMessage));
      return;
    }

    const action = parseClientAction(parsed);
    if (!action || !roleCanSend(attachment.role, action)) {
      socket.send(JSON.stringify({ type: "error", message: "Action not allowed" } satisfies ServerMessage));
      return;
    }

    const room = this.readRoom();
    const next = this.applyAction(room, attachment, action);
    if (next === room) return;
    this.writeRoom(next);
    this.broadcast(next);
  }

  webSocketClose(): void {
    this.broadcast(this.readRoom());
  }

  webSocketError(): void {
    this.broadcast(this.readRoom());
  }

  private readRoom(): StoredRoom {
    const row = this.ctx.storage.sql
      .exec<{ json: string }>("SELECT json FROM room_state WHERE id = 1")
      .one();
    try {
      const parsed: unknown = JSON.parse(row.json);
      const normalized = normalizeRoom(parsed);
      if (normalized.state.version !== (parsed as { state?: { version?: number } }).state?.version) {
        this.writeRoom(normalized);
      }
      return normalized;
    } catch {
      const clean = createStoredRoom();
      this.writeRoom(clean);
      return clean;
    }
  }

  private writeRoom(room: StoredRoom): void {
    this.ctx.storage.sql.exec(
      "UPDATE room_state SET json = ? WHERE id = 1",
      JSON.stringify(room),
    );
  }

  private applyAction(
    room: StoredRoom,
    client: SocketAttachment,
    action: ClientAction,
  ): StoredRoom {
    if (action.type === "reset_room") {
      const clean = createStoredRoom();
      clean.state.revision = room.state.revision + 1;
      clean.state.updatedAt = Date.now();
      for (const socket of this.ctx.getWebSockets("student")) {
        const attachment = socket.deserializeAttachment();
        if (isSocketAttachment(attachment)) clean.resetStudentIds.push(attachment.clientId);
        socket.close(4002, "Room reset");
      }
      return clean;
    }

    if (room.state.session.status === "ended") return room;
    const state = room.state;
    const timestamp = Date.now();

    switch (action.type) {
      case "start_class":
        if (state.session.status !== "waiting") return room;
        return this.withState(room, {
          ...state,
          activeQuizId: null,
          activityMode: "idle",
          displayMode: "interaction",
          session: { ...state.session, status: "live", startedAt: timestamp, endedAt: null, durationMs: null },
          timeline: addTimelineEvent(state, "เริ่มคลาส", "เปิด Class Pulse ตลอดทั้ง session", timestamp, "class-started"),
          activityHistory: addActivityEvent(state, "class_started", "เริ่มคลาส", timestamp),
        }, timestamp);
      case "launch_quiz": {
        if (state.session.status !== "live") return room;
        const quiz = getQuiz(state, action.quizId);
        return this.withState({
          ...room,
          quizLaunchedAt: { ...room.quizLaunchedAt, [action.quizId]: timestamp },
        }, {
          ...state,
          activeQuizId: action.quizId,
          activityMode: "quiz",
          displayMode: "quiz",
          timeline: addTimelineEvent(state, `เปิด ${quiz?.label ?? "Quick Quiz"}`, quiz?.question ?? "", timestamp),
          activityHistory: addActivityEvent(state, "quiz_launched", quiz?.label ?? "Quick Quiz", timestamp, action.quizId),
        }, timestamp);
      }
      case "reveal_results":
        if (state.session.status !== "live" || !state.activeQuizId || state.activityMode !== "quiz") return room;
        return this.withState(room, {
          ...state,
          activityMode: "results",
          displayMode: "results",
          timeline: addTimelineEvent(state, "เปิดผล Quiz บนจอ", "ทุกคนเห็นคำตอบที่ถูกแล้ว", timestamp),
          activityHistory: addActivityEvent(state, "quiz_revealed", "เปิดผล Quiz", timestamp, state.activeQuizId),
        }, timestamp);
      case "show_question":
        if (state.session.status !== "live") return room;
        if (!state.questions.some((question) => question.id === action.questionId)) return room;
        return this.withState(room, {
          ...state,
          selectedQuestionId: action.questionId,
          displayMode: "question",
          timeline: addTimelineEvent(state, "ส่งคำถามขึ้น Classroom Display", "พร้อมคุยกับทั้งห้อง", timestamp),
        }, timestamp);
      case "launch_aha":
        if (state.session.status !== "live" || state.ahaMoment.launched) return room;
        return this.withState(room, {
          ...state,
          activityMode: "aha",
          displayMode: "celebration",
          ahaMoment: { ...state.ahaMoment, launched: true },
          timeline: addTimelineEvent(
            state,
            "ส่ง Aha! Moment ขึ้นจอ",
            "เปิดรับ feedback สุดท้ายจากห้อง",
            timestamp,
            "aha-moment-launched",
          ),
          activityHistory: addActivityEvent(state, "aha_launched", "Aha! Moment", timestamp),
        }, timestamp);
      case "end_class":
        if (state.session.status !== "live") return room;
        return this.withState(room, {
          ...state,
          session: {
            ...state.session,
            status: "ended",
            endedAt: timestamp,
            durationMs: Math.max(0, timestamp - (state.session.startedAt ?? timestamp)),
          },
          activityMode: "ended",
          displayMode: "ending",
          timeline: addTimelineEvent(
            state,
            "จบคลาสแล้ว",
            "บันทึกสรุปสัญญาณของห้องเรียบร้อย",
            timestamp,
            "class-ended",
          ),
          activityHistory: addActivityEvent(state, "class_ended", "จบคลาส", timestamp),
        }, timestamp);
      case "reaction":
        if (state.session.status !== "live") return room;
        if (room.studentReactions[client.clientId] === action.reaction) return room;
        return this.withState(
          { ...room, studentReactions: { ...room.studentReactions, [client.clientId]: action.reaction } },
          {
            ...state,
            reactions: countReactions({ ...room.studentReactions, [client.clientId]: action.reaction }),
            pulseHistory: addPulseEvent(state, action.reaction, timestamp),
            metrics: { ...state.metrics, interactionCount: state.metrics.interactionCount + 1 },
            timeline: addTimelineEvent(state, "Class Pulse อัปเดต", "ได้รับ Reaction จากนักเรียน", timestamp),
            activityHistory: addActivityEvent(state, "pulse_changed", "Class Pulse อัปเดต", timestamp),
          },
          timestamp,
        );
      case "answer_quiz": {
        if (state.session.status !== "live" || state.activityMode !== "quiz" || state.activeQuizId !== action.quizId) return room;
        const answers = room.quizAnswers[action.quizId];
        if (answers[client.clientId] === action.answer) return room;
        const nextAnswers = { ...answers, [client.clientId]: action.answer };
        const quizAnswers = { ...room.quizAnswers, [action.quizId]: nextAnswers };
        const firstAnswers = room.quizFirstAnswersAt[action.quizId];
        const firstAnsweredAt = firstAnswers[client.clientId] ?? timestamp;
        const quizFirstAnswersAt = {
          ...room.quizFirstAnswersAt,
          [action.quizId]: { ...firstAnswers, [client.clientId]: firstAnsweredAt },
        };
        const responseTimes = Object.entries(quizFirstAnswersAt).flatMap(([quizId, answersForQuiz]) => {
          const launchedAt = room.quizLaunchedAt[quizId as QuizId];
          return launchedAt ? Object.values(answersForQuiz).map((answeredAt) => Math.max(0, answeredAt - launchedAt)) : [];
        });
        const averageQuizResponseTimeMs = responseTimes.length
          ? Math.round(responseTimes.reduce((total, value) => total + value, 0) / responseTimes.length)
          : null;
        const quizResponseCount = Object.values(quizFirstAnswersAt)
          .reduce((total, answersForQuiz) => total + Object.keys(answersForQuiz).length, 0);
        const quizzes = state.quizzes.map((quiz) =>
          quiz.id === action.quizId
            ? { ...quiz, responses: countQuizAnswers(nextAnswers) }
            : quiz,
        );
        return this.withState(
          { ...room, quizAnswers, quizFirstAnswersAt },
          {
            ...state,
            quizzes,
            metrics: {
              ...state.metrics,
              interactionCount: state.metrics.interactionCount + 1,
              quizResponseCount,
              averageQuizResponseTimeMs,
            },
            timeline: addTimelineEvent(state, "มีคำตอบ Quiz ใหม่", `${Object.keys(nextAnswers).length} คนตอบแล้ว`, timestamp),
            activityHistory: addActivityEvent(state, "quiz_answered", `มีคำตอบ ${action.quizId}`, timestamp, action.quizId),
          },
          timestamp,
        );
      }
      case "submit_question":
        if (state.session.status !== "live") return room;
        return this.withState(room, {
          ...state,
          questions: [
            { id: crypto.randomUUID(), text: action.text, votes: 1, isNew: true },
            ...state.questions,
          ],
          metrics: { ...state.metrics, interactionCount: state.metrics.interactionCount + 1 },
          timeline: addTimelineEvent(state, "มีคำถามใหม่", action.text, timestamp),
          activityHistory: addActivityEvent(state, "question_submitted", "มีคำถามใหม่", timestamp),
        }, timestamp);
      case "aha_feedback": {
        if (state.session.status !== "live" || state.activityMode !== "aha") return room;
        const previous = room.ahaResponses[client.clientId];
        if (previous?.reaction === action.reaction && previous.feedback === (action.feedback ?? "")) {
          return room;
        }
        const ahaResponses = {
          ...room.ahaResponses,
          [client.clientId]: { reaction: action.reaction, feedback: action.feedback ?? "" },
        };
        const feedbackMessages = Object.values(ahaResponses)
          .map((response) => response.feedback)
          .filter(Boolean);
        return this.withState(
          { ...room, ahaResponses },
          {
            ...state,
            ahaMoment: {
              ...state.ahaMoment,
              completed: Object.keys(ahaResponses).length > 0,
              reactions: countReactions(
                Object.fromEntries(
                  Object.entries(ahaResponses).map(([id, response]) => [id, response.reaction]),
                ),
              ),
              responseCount: Object.keys(ahaResponses).length,
              feedbackCount: feedbackMessages.length,
              feedbackMessages,
            },
            metrics: { ...state.metrics, interactionCount: state.metrics.interactionCount + 1 },
            timeline: addTimelineEvent(state, "Aha! Moment อัปเดต", `${Object.keys(ahaResponses).length} คนตอบแล้ว`, timestamp),
            activityHistory: addActivityEvent(state, "aha_responded", "ได้รับ Aha! Moment", timestamp),
          },
          timestamp,
        );
      }
    }
  }

  private withState(room: StoredRoom, state: DemoState, timestamp = Date.now()): StoredRoom {
    return {
      ...room,
      state: {
        ...state,
        revision: room.state.revision + 1,
        updatedAt: timestamp,
      },
    };
  }

  private connectedStudentCount(room: StoredRoom): number {
    const ids = new Set<string>();
    for (const socket of this.ctx.getWebSockets("student")) {
      const attachment = socket.deserializeAttachment();
      if (isSocketAttachment(attachment) && !room.resetStudentIds.includes(attachment.clientId)) {
        ids.add(attachment.clientId);
      }
    }
    return ids.size;
  }

  private stateForClient(room: StoredRoom, client: SocketAttachment): DemoState {
    const state = structuredClone(room.state);
    state.session.connectedStudents = this.connectedStudentCount(room);

    if (client.role === "student") {
      state.studentReaction = room.studentReactions[client.clientId] ?? null;
      state.studentAnswers = {
        "quiz-1": room.quizAnswers["quiz-1"][client.clientId],
        "quiz-2": room.quizAnswers["quiz-2"][client.clientId],
      };
      state.ahaMoment.feedback = room.ahaResponses[client.clientId]?.reaction ?? null;
      state.questions = [];
      state.timeline = [];
      state.pulseHistory = [];
      state.activityHistory = [];
      state.ahaMoment.feedbackMessages = [];
    }

    if (client.role === "display") {
      state.questions = state.selectedQuestionId
        ? state.questions.filter((question) => question.id === state.selectedQuestionId)
        : [];
      state.timeline = [];
      state.pulseHistory = [];
      state.activityHistory = [];
      state.studentAnswers = {};
      state.studentReaction = null;
      state.ahaMoment.feedback = null;
      state.ahaMoment.feedbackMessages = [];
    }

    if (client.role !== "teacher" && state.activityMode !== "results" && state.activityMode !== "ended") {
      state.quizzes = state.quizzes.map((quiz) => ({ ...quiz, correctAnswer: null }));
    }

    return state;
  }

  private broadcast(room: StoredRoom): void {
    for (const socket of this.ctx.getWebSockets()) {
      if (socket.readyState !== WebSocket.OPEN) continue;
      const attachment = socket.deserializeAttachment();
      if (!isSocketAttachment(attachment)) continue;
      const message: ServerMessage = {
        type: "state",
        state: this.stateForClient(room, attachment),
      };
      try {
        socket.send(JSON.stringify(message));
      } catch (error) {
        console.error(JSON.stringify({ message: "websocket broadcast failed", error: String(error) }));
      }
    }
  }
}
