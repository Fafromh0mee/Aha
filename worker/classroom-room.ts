import { DurableObject } from "cloudflare:workers";
import {
  createLiveDemoState,
  getQuiz,
  type DemoState,
  type QuizId,
  type QuizOptionId,
  type ReactionKey,
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
};

const MAX_MESSAGE_BYTES = 4096;

function createStoredRoom(): StoredRoom {
  return {
    state: createLiveDemoState(),
    studentReactions: {},
    quizAnswers: { "quiz-1": {}, "quiz-2": {} },
    ahaResponses: {},
    resetStudentIds: [],
  };
}

function addTimelineEvent(
  state: DemoState,
  label: string,
  detail: string,
  eventKey?: string,
) {
  if (eventKey && state.timeline.some((event) => event.eventKey === eventKey)) {
    return state.timeline;
  }
  const event: TimelineEvent = {
    id: crypto.randomUUID(),
    label,
    detail,
    eventKey,
  };
  return [event, ...state.timeline].slice(0, 8);
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
      return JSON.parse(row.json) as StoredRoom;
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

    switch (action.type) {
      case "launch_interaction":
        return this.withState(room, {
          ...state,
          activeQuizId: null,
          activityMode: "interaction",
          displayMode: "interaction",
          timeline: addTimelineEvent(state, "เปิด Class Pulse", "นักเรียนส่ง Reaction ได้แล้ว"),
        });
      case "launch_quiz": {
        const quiz = getQuiz(state, action.quizId);
        return this.withState(room, {
          ...state,
          activeQuizId: action.quizId,
          activityMode: "quiz",
          displayMode: "quiz",
          timeline: addTimelineEvent(state, `เปิด ${quiz?.label ?? "Quick Quiz"}`, quiz?.question ?? ""),
        });
      }
      case "reveal_results":
        if (!state.activeQuizId || state.activityMode !== "quiz") return room;
        return this.withState(room, {
          ...state,
          activityMode: "results",
          displayMode: "results",
          timeline: addTimelineEvent(state, "เปิดผล Quiz บนจอ", "ทุกคนเห็นคำตอบที่ถูกแล้ว"),
        });
      case "show_question":
        if (!state.questions.some((question) => question.id === action.questionId)) return room;
        return this.withState(room, {
          ...state,
          selectedQuestionId: action.questionId,
          displayMode: "question",
          timeline: addTimelineEvent(state, "ส่งคำถามขึ้น Classroom Display", "พร้อมคุยกับทั้งห้อง"),
        });
      case "launch_aha":
        if (state.ahaMoment.launched) return room;
        return this.withState(room, {
          ...state,
          activityMode: "aha",
          displayMode: "celebration",
          ahaMoment: { ...state.ahaMoment, launched: true },
          timeline: addTimelineEvent(
            state,
            "ส่ง Aha! Moment ขึ้นจอ",
            "เปิดรับ feedback สุดท้ายจากห้อง",
            "aha-moment-launched",
          ),
        });
      case "end_class":
        return this.withState(room, {
          ...state,
          session: { ...state.session, status: "ended" },
          activityMode: "ended",
          displayMode: "ending",
          timeline: addTimelineEvent(
            state,
            "จบคลาสแล้ว",
            "บันทึกสรุปสัญญาณของห้องเรียบร้อย",
            "class-ended",
          ),
        });
      case "reaction":
        if (state.activityMode !== "interaction") return room;
        if (room.studentReactions[client.clientId] === action.reaction) return room;
        return this.withState(
          { ...room, studentReactions: { ...room.studentReactions, [client.clientId]: action.reaction } },
          {
            ...state,
            reactions: countReactions({ ...room.studentReactions, [client.clientId]: action.reaction }),
            timeline: addTimelineEvent(state, "Class Pulse อัปเดต", "ได้รับ Reaction จากนักเรียน"),
          },
        );
      case "answer_quiz": {
        if (state.activityMode !== "quiz" || state.activeQuizId !== action.quizId) return room;
        const answers = room.quizAnswers[action.quizId];
        if (answers[client.clientId] === action.answer) return room;
        const nextAnswers = { ...answers, [client.clientId]: action.answer };
        const quizAnswers = { ...room.quizAnswers, [action.quizId]: nextAnswers };
        const quizzes = state.quizzes.map((quiz) =>
          quiz.id === action.quizId
            ? { ...quiz, responses: countQuizAnswers(nextAnswers) }
            : quiz,
        );
        return this.withState(
          { ...room, quizAnswers },
          {
            ...state,
            quizzes,
            timeline: addTimelineEvent(state, "มีคำตอบ Quiz ใหม่", `${Object.keys(nextAnswers).length} คนตอบแล้ว`),
          },
        );
      }
      case "submit_question":
        return this.withState(room, {
          ...state,
          questions: [
            { id: crypto.randomUUID(), text: action.text, votes: 1, isNew: true },
            ...state.questions,
          ],
          timeline: addTimelineEvent(state, "มีคำถามใหม่", action.text),
        });
      case "aha_feedback": {
        if (state.activityMode !== "aha") return room;
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
            timeline: addTimelineEvent(state, "Aha! Moment อัปเดต", `${Object.keys(ahaResponses).length} คนตอบแล้ว`),
          },
        );
      }
    }
  }

  private withState(room: StoredRoom, state: DemoState): StoredRoom {
    return {
      ...room,
      state: {
        ...state,
        revision: room.state.revision + 1,
        updatedAt: Date.now(),
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
      state.ahaMoment.feedbackMessages = [];
    }

    if (client.role === "display") {
      state.questions = state.selectedQuestionId
        ? state.questions.filter((question) => question.id === state.selectedQuestionId)
        : [];
      state.timeline = [];
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
