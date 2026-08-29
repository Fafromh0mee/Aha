"use client";

import Link from "next/link";
import QRCode from "react-qr-code";
import { ArrowLeft, CheckCircle2, HeartHandshake, HelpCircle, PartyPopper, Radio, Users } from "lucide-react";
import { useDemoState } from "@/components/demo/demo-state-provider";
import { getQuiz, getResponseTotal, reactionMeta, type DemoQuiz } from "@/lib/demo-state";

export function ClassroomDisplay() {
  const { state, isReady, room, studentJoinUrl, transport } = useDemoState();
  const activeQuiz = getQuiz(state, state.activeQuizId);
  const selectedQuestion = state.questions.find((question) => question.id === state.selectedQuestionId) ?? null;

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-8">
        <div className="flex items-center gap-4">
          <Link href="/demo" className="flex size-12 items-center justify-center rounded-xl border border-border hover:bg-[#FAF8F7]" aria-label="กลับไปเลือกมุมมอง">
            <ArrowLeft aria-hidden="true" size={21} />
          </Link>
          <div>
            <p className="text-xs font-extrabold tracking-[0.14em] text-muted uppercase">{state.session.course}</p>
            <h1 className="text-xl font-black sm:text-2xl">{state.session.topic}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-sm font-bold text-muted"><Users aria-hidden="true" size={18} /> {state.session.connectedStudents} คน</span>
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold tracking-[0.12em] ${state.session.status === "ended" || state.session.status === "waiting" ? "bg-[#F1ECE9] text-muted" : "bg-[#FDE8E5] text-[#A72F27]"}`}>
            <span className={`size-2 rounded-full ${state.session.status === "ended" || state.session.status === "waiting" ? "bg-[#8A817D]" : "live-pulse bg-[#D93E33]"}`} /> {state.session.status === "ended" ? "ENDED" : state.session.status === "waiting" ? "WAITING" : !isReady || transport === "connecting" ? "CONNECTING" : transport === "network" ? "LIVE" : "LOCAL"}
          </span>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:py-14">
        <div className="w-full max-w-[1280px]">
          {state.displayMode === "idle" && <IdleDisplay room={room} studentJoinUrl={studentJoinUrl} connected={state.session.connectedStudents} />}
          {state.displayMode === "interaction" && <ReactionDisplay reactions={state.reactions} />}
          {state.displayMode === "quiz" && activeQuiz && <QuizQuestionDisplay quiz={activeQuiz} />}
          {state.displayMode === "results" && activeQuiz && <QuizResultDisplay quiz={activeQuiz} />}
          {state.displayMode === "question" && selectedQuestion && <QuestionDisplay text={selectedQuestion.text} votes={selectedQuestion.votes} />}
          {state.displayMode === "celebration" && <CelebrationDisplay />}
          {state.displayMode === "ending" && <EndingDisplay />}
        </div>
      </div>

      {state.displayMode !== "idle" && state.displayMode !== "ending" && (
        <aside className="fixed right-4 bottom-14 hidden items-center gap-3 rounded-2xl border border-border bg-white p-3 lg:flex" aria-label="เข้าร่วมห้อง">
          <div className="bg-white p-1"><QRCode value={studentJoinUrl} size={62} aria-hidden="true" /></div>
          <div><p className="text-[10px] font-extrabold tracking-[0.12em] text-muted uppercase">Join room</p><p className="text-lg font-black">{room}</p></div>
        </aside>
      )}

      <footer className="flex items-center justify-between border-t border-border px-5 py-3 text-xs font-bold text-muted sm:px-8">
        <span>Aha! Classroom Display</span>
        <span>Read the room, in real time.</span>
      </footer>
    </main>
  );
}

function IdleDisplay({ room, studentJoinUrl, connected }: { room: string; studentJoinUrl: string; connected: number }) {
  return (
    <section className="mx-auto grid max-w-[1100px] items-center gap-8 lg:grid-cols-[1fr_380px] lg:text-left">
      <div className="text-center lg:text-left">
        <div className="mx-auto flex size-20 items-center justify-center rounded-[22px] bg-[#FDE8E5] text-[#B5352C] lg:mx-0"><Radio aria-hidden="true" size={36} /></div>
        <p className="mt-7 text-sm font-extrabold tracking-[0.2em] text-[#B5352C] uppercase">Aha! Live Classroom</p>
        <h2 className="mt-4 text-5xl leading-[1.08] font-black tracking-[-0.045em] sm:text-7xl">สแกนเพื่อ<br />เข้าร่วมห้อง</h2>
        <p className="mt-6 text-lg font-semibold text-muted sm:text-2xl">รอผู้สอนเปิดกิจกรรม · เชื่อมต่อแล้ว {connected} คน</p>
      </div>
      <div className="mx-auto w-full max-w-[380px] rounded-[24px] border border-border bg-[#FAF8F7] p-6 text-center">
        <div className="mx-auto w-fit rounded-2xl bg-white p-4"><QRCode value={studentJoinUrl} size={220} aria-label={`QR code สำหรับเข้าร่วมห้อง ${room}`} /></div>
        <p className="mt-5 text-xs font-extrabold tracking-[0.16em] text-muted uppercase">Room code</p>
        <p className="mt-1 text-5xl font-black tracking-[0.12em]">{room}</p>
        <p className="mt-4 break-all text-sm font-semibold text-muted">{studentJoinUrl}</p>
      </div>
    </section>
  );
}

function ReactionDisplay({ reactions }: { reactions: Record<(typeof reactionMeta)[number]["key"], number> }) {
  return (
    <section aria-labelledby="display-reactions">
      <div className="text-center">
        <p className="text-sm font-extrabold tracking-[0.2em] text-[#B5352C] uppercase">Class Pulse · Live</p>
        <h2 id="display-reactions" className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-6xl">ตอนนี้เป็นอย่างไรบ้าง?</h2>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        {reactionMeta.map((reaction, index) => (
          <article key={reaction.key} className={`relative overflow-hidden rounded-[24px] border border-[#D8CFCA] p-5 text-center sm:p-8 ${index === 0 ? "lg:-translate-y-3" : ""}`} style={{ background: reaction.surface }}>
            <span className="emoji-burst block text-5xl sm:text-7xl" aria-hidden="true">{reaction.emoji}</span>
            <p className="mt-5 text-lg font-black sm:text-2xl">{reaction.label}</p>
            <p className="mt-2 text-5xl font-black tracking-[-0.05em] sm:text-7xl">{reactions[reaction.key]}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function QuizQuestionDisplay({ quiz }: { quiz: DemoQuiz }) {
  return (
    <section className="mx-auto max-w-[1100px]">
      <div className="flex items-center justify-between gap-4">
        <span className="rounded-full bg-[#F0EBFF] px-4 py-2 text-sm font-extrabold text-[#5C47A8]">{quiz.label} · LIVE</span>
        <span className="text-sm font-bold text-muted">ตอบแล้ว {getResponseTotal(quiz)} คน</span>
      </div>
      <h2 className="mt-8 text-4xl leading-[1.15] font-black tracking-[-0.04em] text-balance sm:text-6xl lg:text-7xl">{quiz.question}</h2>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {quiz.options.map((option, index) => (
          <div key={option.id} className={`flex min-h-24 items-center gap-5 rounded-[20px] border border-[#D8CFCA] p-5 sm:p-6 ${["bg-[#FDE8E5]", "bg-[#E6F4FF]", "bg-[#FFF4C2]", "bg-[#E6F7EF]"][index]}`}>
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white text-xl font-black">{option.id}</span>
            <span className="text-lg font-black sm:text-2xl">{option.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function QuizResultDisplay({ quiz }: { quiz: DemoQuiz }) {
  const total = getResponseTotal(quiz);
  return (
    <section className="mx-auto max-w-[1100px]">
      <div className="text-center">
        <p className="text-sm font-extrabold tracking-[0.2em] text-[#B5352C] uppercase">Class Quiz Result</p>
        <h2 className="mt-4 text-3xl leading-tight font-black tracking-[-0.035em] sm:text-5xl">{quiz.question}</h2>
        <p className="mt-3 text-lg font-bold text-muted">ทั้งหมด {total} คำตอบ</p>
      </div>
      <div className="mt-9 grid gap-3">
        {quiz.options.map((option) => {
          const count = quiz.responses[option.id];
          const percentage = total ? Math.round((count / total) * 100) : 0;
          const correct = option.id === quiz.correctAnswer;
          return (
            <div key={option.id} className={`relative overflow-hidden rounded-[18px] border p-4 sm:p-5 ${correct ? "border-[#72C79A] bg-[#E6F7EF]" : "border-[#D8CFCA] bg-white"}`}>
              <div className="absolute inset-y-0 left-0 bg-[#FDE8E5]" style={{ width: `${percentage}%` }} aria-hidden="true" />
              <div className="relative flex items-center gap-4">
                <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-lg font-black ${correct ? "bg-[#72C79A]" : "bg-[#F1ECE9]"}`}>{option.id}</span>
                <span className="min-w-0 flex-1 text-base font-black sm:text-xl">{option.text}</span>
                {correct && <CheckCircle2 aria-label="คำตอบที่ถูก" className="shrink-0 text-[#2E7652]" size={24} />}
                <span className="shrink-0 text-2xl font-black sm:text-3xl">{count}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function QuestionDisplay({ text, votes }: { text: string; votes: number }) {
  return (
    <section className="mx-auto max-w-[1000px] text-center">
      <div className="mx-auto flex size-20 items-center justify-center rounded-[22px] bg-[#E6F4FF]"><HelpCircle aria-hidden="true" size={38} /></div>
      <p className="mt-8 text-sm font-extrabold tracking-[0.2em] text-[#306D91] uppercase">Popular Question</p>
      <h2 className="mt-6 text-4xl leading-[1.2] font-black tracking-[-0.04em] text-balance sm:text-6xl lg:text-7xl">“{text}”</h2>
      <p className="mt-8 text-xl font-bold text-muted sm:text-2xl">มี {votes} คนสงสัยเรื่องนี้</p>
    </section>
  );
}

function CelebrationDisplay() {
  return (
    <section className="relative mx-auto max-w-[1000px] overflow-hidden rounded-[28px] border border-[#D8CFCA] bg-[#FFF4C2] px-6 py-16 text-center sm:py-20">
      <span className="celebration-float absolute top-8 left-[8%] text-5xl" aria-hidden="true">🎉</span>
      <span className="celebration-float absolute top-12 right-[10%] text-5xl [animation-delay:240ms]" aria-hidden="true">✨</span>
      <span className="celebration-float absolute bottom-8 left-[18%] text-4xl [animation-delay:480ms]" aria-hidden="true">💡</span>
      <PartyPopper aria-hidden="true" className="mx-auto text-[#B5352C]" size={56} />
      <p className="mt-8 text-sm font-extrabold tracking-[0.2em] text-[#80650B] uppercase">Aha! Moment</p>
      <h2 className="mt-4 text-5xl font-black tracking-[-0.05em] sm:text-7xl lg:text-8xl">ก่อนจบคลาส...</h2>
      <p className="mt-7 text-xl font-bold sm:text-3xl">ส่ง Aha! Moment ของคุณจากโทรศัพท์ 💡</p>
    </section>
  );
}

function EndingDisplay() {
  return (
    <section className="relative mx-auto max-w-[1050px] overflow-hidden rounded-[28px] border border-[#D8CFCA] bg-[#E6F7EF] px-6 py-16 text-center sm:py-20">
      <span className="celebration-float absolute top-10 left-[9%] text-5xl" aria-hidden="true">✨</span>
      <span className="celebration-float absolute right-[10%] bottom-10 text-5xl [animation-delay:320ms]" aria-hidden="true">💡</span>
      <div className="mx-auto flex size-20 items-center justify-center rounded-[22px] bg-white text-[#2E7652]"><HeartHandshake aria-hidden="true" size={38} /></div>
      <p className="mt-8 text-sm font-extrabold tracking-[0.2em] text-[#2E7652] uppercase">Today&apos;s Aha! Moment</p>
      <h2 className="mt-5 text-5xl leading-[1.1] font-black tracking-[-0.05em] sm:text-7xl lg:text-8xl">ขอบคุณทุกคน<br />สำหรับวันนี้!</h2>
      <p className="mt-7 text-xl font-bold text-[#416A55] sm:text-3xl">ทุกสัญญาณช่วยให้เราเรียนรู้ไปด้วยกัน</p>
    </section>
  );
}
