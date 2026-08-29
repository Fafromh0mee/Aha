"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  createLiveDemoState, createRehearsalDemoState, DEFAULT_ROOM_CODE, DEMO_CHANNEL_NAME,
  DEMO_STORAGE_KEY, getQuiz, isDemoState, type DemoMode, type DemoState, type QuizId,
  type QuizOption, type ReactionKey,
} from "@/lib/demo-state";
import { type ClientAction, type ClientRole, type ServerMessage } from "@/lib/live-protocol";

type TransportStatus = "connecting" | "network" | "local";
type DemoStateContextValue = {
  state: DemoState; isReady: boolean; mode: DemoMode; room: string;
  transport: TransportStatus; studentJoinUrl: string;
  launchInteraction: () => void; sendReaction: (reaction: ReactionKey) => void;
  launchQuiz: (quizId: QuizId) => void;
  answerQuiz: (quizId: QuizId, answer: QuizOption["id"]) => void;
  revealQuizResults: () => void; showQuestion: (questionId: string) => void;
  launchAhaMoment: () => void;
  sendAhaFeedback: (reaction: ReactionKey, feedback?: string) => void;
  endClass: () => void; submitQuestion: (text: string) => void; resetDemo: () => void;
};

const DemoStateContext = createContext<DemoStateContextValue | null>(null);

function addTimelineEvent(state: DemoState, label: string, detail: string, eventKey?: string) {
  if (eventKey && state.timeline.some((event) => event.eventKey === eventKey)) return state.timeline;
  return [{ id: crypto.randomUUID(), label, detail, eventKey }, ...state.timeline].slice(0, 8);
}

function isNewer(incoming: DemoState, current: DemoState) {
  return incoming.revision > current.revision ||
    (incoming.revision === current.revision && incoming.updatedAt > current.updatedAt);
}

function getRole(pathname: string): ClientRole | null {
  if (pathname.endsWith("/teacher")) return "teacher";
  if (pathname.endsWith("/student")) return "student";
  if (pathname.endsWith("/display")) return "display";
  return null;
}

function createClientId(role: ClientRole, room: string) {
  const key = `aha-client-id:${room}:${role}`;
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.sessionStorage.setItem(key, id);
  return id;
}

function websocketUrl(room: string, role: ClientRole, clientId: string) {
  const configuredOrigin = process.env.NEXT_PUBLIC_AHA_LIVE_ORIGIN?.trim();
  const url = new URL("/api/live", configuredOrigin || window.location.origin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("room", room);
  url.searchParams.set("role", role);
  url.searchParams.set("clientId", clientId);
  return url.toString();
}

export function DemoStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(createLiveDemoState);
  const [isReady, setIsReady] = useState(false);
  const [mode, setMode] = useState<DemoMode>("live");
  const [room, setRoom] = useState(DEFAULT_ROOM_CODE);
  const [transport, setTransport] = useState<TransportStatus>("connecting");
  const [studentJoinUrl, setStudentJoinUrl] = useState(`/demo/student?room=${DEFAULT_ROOM_CODE}`);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const transportRef = useRef<TransportStatus>("connecting");
  const modeRef = useRef<DemoMode>("live");
  const storageKeyRef = useRef(DEMO_STORAGE_KEY);

  const updateTransport = useCallback((next: TransportStatus) => {
    transportRef.current = next;
    setTransport(next);
  }, []);

  useEffect(() => {
    let disposed = false;
    let reconnectTimer: number | undefined;
    let heartbeatTimer: number | undefined;
    const params = new URLSearchParams(window.location.search);
    const nextMode: DemoMode = params.get("mode") === "rehearsal" ? "rehearsal" : "live";
    const requestedRoom = params.get("room")?.trim().toUpperCase();
    const nextRoom = requestedRoom && /^[A-Z0-9-]{1,24}$/.test(requestedRoom) ? requestedRoom : DEFAULT_ROOM_CODE;
    const role = getRole(window.location.pathname);
    const storageKey = `${DEMO_STORAGE_KEY}:${nextMode}:${nextRoom}`;
    storageKeyRef.current = storageKey;
    modeRef.current = nextMode;
    const nextStudentJoinUrl = `${window.location.origin}/demo/student?room=${encodeURIComponent(nextRoom)}`;

    let initial = nextMode === "rehearsal" ? createRehearsalDemoState() : createLiveDemoState();
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed: unknown = JSON.parse(stored);
        if (isDemoState(parsed)) initial = parsed;
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }

    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel(`${DEMO_CHANNEL_NAME}:${nextMode}:${nextRoom}`);
      channel.onmessage = (event: MessageEvent<unknown>) => {
        if (transportRef.current !== "network" && isDemoState(event.data)) {
          setState((current) => isNewer(event.data as DemoState, current) ? event.data as DemoState : current);
        }
      };
      channelRef.current = channel;
    }

    const handleStorage = (event: StorageEvent) => {
      if (transportRef.current === "network" || event.key !== storageKey || !event.newValue) return;
      try {
        const parsed: unknown = JSON.parse(event.newValue);
        if (isDemoState(parsed)) setState((current) => isNewer(parsed, current) ? parsed : current);
      } catch {
        // Ignore malformed fallback state from another tab.
      }
    };
    window.addEventListener("storage", handleStorage);

    const connect = () => {
      if (disposed || nextMode === "rehearsal" || !role) return;
      updateTransport("connecting");
      const socket = new WebSocket(websocketUrl(nextRoom, role, createClientId(role, nextRoom)));
      socketRef.current = socket;
      socket.onopen = () => {
        if (disposed) return;
        updateTransport("network");
        heartbeatTimer = window.setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) socket.send("ping");
        }, 25_000);
      };
      socket.onmessage = (event) => {
        if (event.data === "pong" || typeof event.data !== "string") return;
        try {
          const message = JSON.parse(event.data) as ServerMessage;
          if ((message.type === "welcome" || message.type === "state") && isDemoState(message.state)) setState(message.state);
        } catch {
          // Ignore non-protocol messages.
        }
      };
      socket.onclose = (event) => {
        if (heartbeatTimer) window.clearInterval(heartbeatTimer);
        if (socketRef.current === socket) socketRef.current = null;
        if (disposed) return;
        updateTransport("local");
        if (event.code !== 4002) reconnectTimer = window.setTimeout(connect, 3_000);
      };
      socket.onerror = () => socket.close();
    };

    queueMicrotask(() => {
      if (disposed) return;
      setMode(nextMode);
      setRoom(nextRoom);
      setStudentJoinUrl(nextStudentJoinUrl);
      setState(initial);
      setIsReady(true);
      if (nextMode === "rehearsal" || !role) updateTransport("local");
      else connect();
    });

    return () => {
      disposed = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (heartbeatTimer) window.clearInterval(heartbeatTimer);
      window.removeEventListener("storage", handleStorage);
      channelRef.current?.close();
      channelRef.current = null;
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [updateTransport]);

  useEffect(() => {
    if (!isReady) return;
    window.localStorage.setItem(storageKeyRef.current, JSON.stringify(state));
    channelRef.current?.postMessage(state);
  }, [isReady, state]);

  const commit = useCallback((recipe: (current: DemoState) => DemoState) => {
    setState((current) => {
      const next = recipe(current);
      return next === current ? current : { ...next, revision: current.revision + 1, updatedAt: Date.now() };
    });
  }, []);

  const dispatch = useCallback((action: ClientAction, fallback: (current: DemoState) => DemoState) => {
    if (modeRef.current === "live" && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(action));
    } else {
      commit(fallback);
    }
  }, [commit]);

  const launchInteraction = useCallback(() => dispatch({ type: "launch_interaction" }, (current) => ({
    ...current, activeQuizId: null, activityMode: "interaction", displayMode: "interaction",
    timeline: addTimelineEvent(current, "เปิด Class Pulse", "นักเรียนส่ง Reaction ได้แล้ว"),
  })), [dispatch]);

  const sendReaction = useCallback((reaction: ReactionKey) => dispatch({ type: "reaction", reaction }, (current) => {
    if (current.session.status === "ended" || current.activityMode !== "interaction" || current.studentReaction === reaction) return current;
    const reactions = { ...current.reactions };
    if (current.studentReaction) reactions[current.studentReaction] = Math.max(0, reactions[current.studentReaction] - 1);
    reactions[reaction] += 1;
    return { ...current, reactions, studentReaction: reaction, timeline: addTimelineEvent(current, "Class Pulse อัปเดต", "ได้รับ Reaction จากนักเรียน") };
  }), [dispatch]);

  const launchQuiz = useCallback((quizId: QuizId) => dispatch({ type: "launch_quiz", quizId }, (current) => {
    const quiz = getQuiz(current, quizId);
    return { ...current, activeQuizId: quizId, activityMode: "quiz", displayMode: "quiz", timeline: addTimelineEvent(current, `เปิด ${quiz?.label ?? "Quick Quiz"}`, quiz?.question ?? "") };
  }), [dispatch]);

  const answerQuiz = useCallback((quizId: QuizId, answer: QuizOption["id"]) => dispatch({ type: "answer_quiz", quizId, answer }, (current) => {
    if (current.activityMode !== "quiz" || current.activeQuizId !== quizId) return current;
    const previous = current.studentAnswers[quizId];
    if (previous === answer) return current;
    return {
      ...current,
      quizzes: current.quizzes.map((quiz) => {
        if (quiz.id !== quizId) return quiz;
        const responses = { ...quiz.responses };
        if (previous) responses[previous] = Math.max(0, responses[previous] - 1);
        responses[answer] += 1;
        return { ...quiz, responses };
      }),
      studentAnswers: { ...current.studentAnswers, [quizId]: answer },
      timeline: addTimelineEvent(current, "มีคำตอบ Quiz ใหม่", `นักเรียนเลือกข้อ ${answer}`),
    };
  }), [dispatch]);

  const revealQuizResults = useCallback(() => dispatch({ type: "reveal_results" }, (current) => current.activeQuizId ? {
    ...current, activityMode: "results", displayMode: "results", timeline: addTimelineEvent(current, "เปิดผล Quiz บนจอ", "ทุกคนเห็นคำตอบที่ถูกแล้ว"),
  } : current), [dispatch]);

  const showQuestion = useCallback((questionId: string) => dispatch({ type: "show_question", questionId }, (current) => ({
    ...current, selectedQuestionId: questionId, displayMode: "question", timeline: addTimelineEvent(current, "ส่งคำถามขึ้น Classroom Display", "พร้อมคุยกับทั้งห้อง"),
  })), [dispatch]);

  const launchAhaMoment = useCallback(() => dispatch({ type: "launch_aha" }, (current) => current.ahaMoment.launched ? current : {
    ...current, activityMode: "aha", displayMode: "celebration", ahaMoment: { ...current.ahaMoment, launched: true },
    timeline: addTimelineEvent(current, "ส่ง Aha! Moment ขึ้นจอ", "เปิดรับ feedback สุดท้ายจากห้อง", "aha-moment-launched"),
  }), [dispatch]);

  const sendAhaFeedback = useCallback((reaction: ReactionKey, feedback = "") => dispatch({ type: "aha_feedback", reaction, feedback }, (current) => {
    if (current.activityMode !== "aha") return current;
    const previous = current.ahaMoment.feedback;
    if (previous === reaction && current.ahaMoment.feedbackMessages[0] === feedback.trim()) return current;
    const reactions = { ...current.ahaMoment.reactions };
    if (previous) reactions[previous] = Math.max(0, reactions[previous] - 1);
    reactions[reaction] += 1;
    const messages = feedback.trim() ? [feedback.trim()] : [];
    return {
      ...current,
      ahaMoment: { ...current.ahaMoment, completed: true, feedback: reaction, reactions, responseCount: 1, feedbackCount: messages.length, feedbackMessages: messages },
      timeline: addTimelineEvent(current, "ได้รับ Aha! Moment feedback", "นักเรียนส่งความรู้สึกก่อนจบคลาสแล้ว", "aha-feedback-received"),
    };
  }), [dispatch]);

  const endClass = useCallback(() => dispatch({ type: "end_class" }, (current) => current.session.status === "ended" ? current : {
    ...current, session: { ...current.session, status: "ended" }, activityMode: "ended", displayMode: "ending",
    timeline: addTimelineEvent(current, "จบคลาสแล้ว", "บันทึกสรุปสัญญาณของห้องเรียบร้อย", "class-ended"),
  }), [dispatch]);

  const submitQuestion = useCallback((text: string) => {
    const cleaned = text.trim();
    if (!cleaned) return;
    dispatch({ type: "submit_question", text: cleaned }, (current) => ({
      ...current, questions: [{ id: crypto.randomUUID(), text: cleaned, votes: 1, isNew: true }, ...current.questions],
      timeline: addTimelineEvent(current, "มีคำถามใหม่", cleaned),
    }));
  }, [dispatch]);

  const resetDemo = useCallback(() => dispatch({ type: "reset_room" }, (current) => ({
    ...(modeRef.current === "rehearsal" ? createRehearsalDemoState() : createLiveDemoState()),
    revision: current.revision + 1, updatedAt: Date.now(),
  })), [dispatch]);

  const value = useMemo<DemoStateContextValue>(() => ({
    state, isReady, mode, room, transport, studentJoinUrl, launchInteraction, sendReaction,
    launchQuiz, answerQuiz, revealQuizResults, showQuestion, launchAhaMoment, sendAhaFeedback,
    endClass, submitQuestion, resetDemo,
  }), [state, isReady, mode, room, transport, studentJoinUrl, launchInteraction, sendReaction, launchQuiz, answerQuiz, revealQuizResults, showQuestion, launchAhaMoment, sendAhaFeedback, endClass, submitQuestion, resetDemo]);

  return <DemoStateContext.Provider value={value}>{children}</DemoStateContext.Provider>;
}

export function useDemoState() {
  const context = useContext(DemoStateContext);
  if (!context) throw new Error("useDemoState must be used inside DemoStateProvider");
  return context;
}
