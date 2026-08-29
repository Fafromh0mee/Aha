"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  BookCheck,
  CheckCircle2,
  CircleHelp,
  LogOut,
  MonitorUp,
  PartyPopper,
  Play,
  Radio,
  RotateCcw,
  Sparkles,
  Users,
} from "lucide-react";
import { useDemoState } from "@/components/demo/demo-state-provider";
import { getQuiz, getResponseTotal, reactionMeta, type DemoQuiz, type DemoState } from "@/lib/demo-state";

export function TeacherConsole() {
  const {
    state,
    isReady,
    mode,
    room,
    transport,
    launchInteraction,
    launchQuiz,
    revealQuizResults,
    showQuestion,
    launchAhaMoment,
    endClass,
    resetDemo,
  } = useDemoState();
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const activeQuiz = getQuiz(state, state.activeQuizId);
  const resultQuiz = activeQuiz ?? state.quizzes[1];
  const totalReactions = Object.values(state.reactions).reduce((total, value) => total + value, 0);
  const sortedQuestions = [...state.questions].sort((a, b) => b.votes - a.votes);
  const strongestReaction = reactionMeta.reduce((best, reaction) =>
    state.reactions[reaction.key] > state.reactions[best.key] ? reaction : best,
  );
  const topSignal = totalReactions
    ? `${strongestReaction.emoji} “${strongestReaction.label}” เป็นสัญญาณที่ห้องส่งมากที่สุด (${state.reactions[strongestReaction.key]} คน)`
    : "ยังไม่มีสัญญาณจากห้อง กด Launch Student Interaction เพื่อเริ่ม Class Pulse";
  const pacingSignal = state.reactions.slow || state.reactions.confused
    ? `มี ${state.reactions.slow + state.reactions.confused} คนที่ส่งสัญญาณว่างงหรือตามไม่ทัน`
    : "จังหวะการเรียนยังไม่มีสัญญาณติดขัดจากนักเรียน";

  const requestEndClass = () => {
    if (state.ahaMoment.completed) {
      endClass();
      return;
    }
    setShowEndConfirmation(true);
  };

  return (
    <main className="min-h-screen bg-[#FAF8F7]">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex min-h-[72px] max-w-[1440px] items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-4">
            <Link href="/demo" className="flex size-11 items-center justify-center rounded-xl border border-border hover:bg-[#FAF8F7]" aria-label="กลับไปเลือกมุมมอง">
              <ArrowLeft aria-hidden="true" size={19} />
            </Link>
            <div>
              <p className="text-xs font-bold text-muted">Teacher Console</p>
              <p className="font-black">Aha<span className="text-[#F25A4B]">!</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={resetDemo} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-white px-3 text-sm font-bold hover:bg-[#FAF8F7]" title="ล้างข้อมูลห้องทั้งหมด">
              <RotateCcw aria-hidden="true" size={16} /> <span className="hidden md:inline">Reset Room</span>
            </button>
            <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-extrabold tracking-[0.14em] ${state.session.status === "ended" ? "border-border bg-[#F1ECE9] text-muted" : "border-[#F3B1AA] bg-[#FDE8E5] text-[#A72F27]"}`}>
              <span className={`size-2 rounded-full ${state.session.status === "ended" ? "bg-[#8A817D]" : "live-pulse bg-[#D93E33]"}`} />
              {state.session.status === "ended" ? "ENDED" : !isReady || transport === "connecting" ? "CONNECTING" : transport === "network" ? "LIVE" : "LOCAL"}
            </div>
            {state.session.status === "live" && (
              <button type="button" onClick={requestEndClass} aria-label="End Class" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#CFC3BE] bg-white px-4 text-sm font-bold text-[#6F403B] hover:border-[#9F6B64] hover:bg-[#F8F1EF]">
                <LogOut aria-hidden="true" size={16} /> <span className="hidden sm:inline">End Class</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {state.session.status === "ended" ? (
        <TeacherClassSummary state={state} />
      ) : (
      <div className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8 sm:py-8">
        <section className="flex flex-col justify-between gap-5 rounded-[20px] border border-border bg-white p-5 sm:flex-row sm:items-center sm:p-7">
          <div>
            <p className="text-xs font-extrabold tracking-[0.14em] text-[#B5352C] uppercase">{state.session.course}</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] sm:text-4xl">{state.session.topic}</h1>
            <p className="mt-2 text-sm text-muted">Room {room} · {mode === "rehearsal" ? "Rehearsal data" : "Live Pitch Mode"}</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-[#E6F7EF] px-5 py-4">
            <Users aria-hidden="true" size={22} />
            <div>
              <p className="text-2xl font-black">{state.session.connectedStudents}</p>
              <p className="text-xs font-bold text-muted">นักเรียนเชื่อมต่อ</p>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[20px] border border-border bg-white p-5 sm:p-7" aria-labelledby="teacher-controls">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-extrabold tracking-[0.14em] text-muted uppercase">Live Controls</p>
              <h2 id="teacher-controls" className="mt-1 text-xl font-black">เปิดกิจกรรมให้ทั้งห้อง</h2>
            </div>
            <p className="text-xs font-semibold text-muted">Student และ Display จะอัปเดตทันที</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <ControlButton disabled={state.ahaMoment.launched} active={state.activityMode === "interaction"} onClick={launchInteraction} icon={Radio} label="Launch Student Interaction" />
            <ControlButton disabled={state.ahaMoment.launched} active={state.activeQuizId === "quiz-1" && state.activityMode === "quiz"} onClick={() => launchQuiz("quiz-1")} icon={Play} label="Launch Quiz 1" />
            <ControlButton disabled={state.ahaMoment.launched} active={state.activeQuizId === "quiz-2" && state.activityMode === "quiz"} onClick={() => launchQuiz("quiz-2")} icon={Play} label="Launch Quiz 2" />
            <ControlButton disabled={!activeQuiz || state.ahaMoment.launched} active={state.activityMode === "results"} onClick={revealQuizResults} icon={MonitorUp} label="Reveal Results" />
            <ControlButton disabled={state.ahaMoment.launched} active={state.activityMode === "aha"} onClick={launchAhaMoment} icon={PartyPopper} label={state.ahaMoment.completed ? "Aha! Moment Complete" : state.ahaMoment.launched ? "Collecting Aha! Feedback" : "Aha! Moment"} />
          </div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
          <div className="space-y-5">
            <section className="rounded-[20px] border border-border bg-white p-5 sm:p-7" aria-labelledby="class-pulse">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold tracking-[0.14em] text-muted uppercase">Class Pulse</p>
                  <h2 id="class-pulse" className="mt-1 text-xl font-black">สัญญาณของห้อง</h2>
                </div>
                <span className="text-sm font-bold text-muted">รวม {totalReactions}</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {reactionMeta.map((reaction) => (
                  <div key={reaction.key} className="rounded-2xl border border-border p-4" style={{ background: reaction.surface }}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-2xl" aria-hidden="true">{reaction.emoji}</span>
                      <span className="text-3xl font-black">{state.reactions[reaction.key]}</span>
                    </div>
                    <p className="mt-4 text-sm font-bold">{reaction.label}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2" aria-label="Teacher insights">
              <InsightCard icon={Sparkles} label="Top learning signal" text={topSignal} surface="bg-[#FDE8E5]" />
              <InsightCard icon={Radio} label="Pacing signal" text={pacingSignal} surface="bg-[#FFF4C2]" />
            </section>

            <QuizResults quiz={resultQuiz} isActive={Boolean(activeQuiz)} isRevealed={state.activityMode === "results"} />

            <section className="rounded-[20px] border border-border bg-white p-5 sm:p-7" aria-labelledby="questions-heading">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold tracking-[0.14em] text-muted uppercase">Questions</p>
                  <h2 id="questions-heading" className="mt-1 text-xl font-black">คำถามจากห้องเรียน</h2>
                </div>
                <CircleHelp aria-hidden="true" className="text-[#B5352C]" size={23} />
              </div>
              <ol className="mt-5 divide-y divide-border">
                {sortedQuestions.length === 0 && <li className="py-6 text-center text-sm font-semibold text-muted">ยังไม่มีคำถามจากนักเรียน</li>}
                {sortedQuestions.map((question) => (
                  <li key={question.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {question.isNew && <span className="rounded-full bg-[#FDE8E5] px-2 py-0.5 text-[9px] font-extrabold text-[#A72F27]">NEW</span>}
                        <span className="text-xs font-bold text-muted">{question.votes} คนสงสัย</span>
                      </div>
                      <p className="mt-1.5 font-bold leading-7">{question.text}</p>
                    </div>
                    <button type="button" disabled={state.ahaMoment.launched} onClick={() => showQuestion(question.id)} className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 ${state.selectedQuestionId === question.id && state.displayMode === "question" ? "border-[#F25A4B] bg-[#FDE8E5]" : "border-border hover:bg-[#FAF8F7]"}`}>
                      <MonitorUp aria-hidden="true" size={16} /> ขึ้นจอ
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <aside className="rounded-[20px] border border-border bg-white p-5 sm:p-7 xl:self-start" aria-labelledby="timeline-heading">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#E6F4FF]"><Radio aria-hidden="true" size={19} /></span>
              <div>
                <p className="text-xs font-extrabold tracking-[0.14em] text-muted uppercase">Live Timeline</p>
                <h2 id="timeline-heading" className="font-black">เกิดอะไรขึ้นในห้อง</h2>
              </div>
            </div>
            <ol className="mt-6 space-y-1">
              {state.timeline.length === 0 && <li className="py-6 text-center text-sm font-semibold text-muted">Timeline จะเริ่มเมื่อเปิดกิจกรรม</li>}
              {state.timeline.map((event, index) => (
                <li key={event.id} className="relative grid grid-cols-[16px_1fr] gap-3 pb-5 last:pb-0">
                  {index < state.timeline.length - 1 && <span className="absolute top-3 bottom-0 left-[7px] w-px bg-border" />}
                  <span className={`relative mt-1.5 size-3 rounded-full border-2 border-white ${index === 0 ? "bg-[#F25A4B]" : "bg-[#CFC6C2]"}`} />
                  <div>
                    <p className="text-sm font-bold leading-6">{event.label}</p>
                    <p className="mt-0.5 text-xs leading-5 text-muted">{event.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </div>
      )}

      {showEndConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#201A18]/55 px-5" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="end-class-title" className="w-full max-w-[520px] rounded-[22px] border border-[#D8CFCA] bg-white p-6 shadow-[0_20px_50px_rgba(32,26,24,0.16)] sm:p-8">
            <div className="flex size-12 items-center justify-center rounded-xl bg-[#FFF4C2]"><PartyPopper aria-hidden="true" size={22} /></div>
            <h2 id="end-class-title" className="mt-5 text-2xl font-black leading-9">ยังไม่ได้ส่ง Aha! Moment ให้ห้อง ต้องการส่งก่อนจบคลาสไหม?</h2>
            <p className="mt-3 text-sm leading-7 text-muted">Aha! Moment จะเปิดรับ feedback สุดท้ายจากนักเรียนก่อนปิด session</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => { launchAhaMoment(); setShowEndConfirmation(false); }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#F25A4B] px-4 text-sm font-extrabold hover:bg-[#E94F45]">
                <PartyPopper aria-hidden="true" size={17} /> ส่ง Aha! Moment
              </button>
              <button type="button" onClick={() => { endClass(); setShowEndConfirmation(false); }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#B9908A] bg-white px-4 text-sm font-bold text-[#75433D] hover:bg-[#F8F1EF]">
                <LogOut aria-hidden="true" size={17} /> จบคลาสเลย
              </button>
            </div>
            <button type="button" onClick={() => setShowEndConfirmation(false)} className="mt-3 min-h-11 w-full rounded-xl text-sm font-bold text-muted hover:bg-[#FAF8F7]">ยกเลิก</button>
          </section>
        </div>
      )}
    </main>
  );
}

function TeacherClassSummary({ state }: { state: DemoState }) {
  const totalReactions = Object.values(state.reactions).reduce((total, value) => total + value, 0);
  const quizResponses = state.quizzes.reduce((total, quiz) => total + getResponseTotal(quiz), 0);
  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8 sm:py-12">
      <section className="rounded-[22px] border border-border bg-white p-6 sm:p-9">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#E6F7EF] px-3 py-1.5 text-xs font-extrabold text-[#2E7652]"><BookCheck aria-hidden="true" size={16} /> CLASS COMPLETE</div>
            <h1 className="mt-5 text-3xl font-black tracking-[-0.035em] sm:text-5xl">สรุปคลาส {state.session.topic}</h1>
            <p className="mt-3 text-base text-muted">{state.session.course} · บันทึกสัญญาณของห้องเรียบร้อยแล้ว</p>
          </div>
          <Link href="/demo" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-bold hover:bg-[#FAF8F7]">กลับ Demo Home</Link>
        </div>
        <div className="mt-9 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryMetric value={String(state.session.connectedStudents)} label="นักเรียน" surface="bg-[#E6F4FF]" />
          <SummaryMetric value={String(totalReactions)} label="Class Pulse" surface="bg-[#FDEAF2]" />
          <SummaryMetric value={String(quizResponses)} label="Quiz answers" surface="bg-[#FFF4C2]" />
          <SummaryMetric value={String(state.questions.length)} label="คำถาม" surface="bg-[#E6F7EF]" />
        </div>
      </section>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="rounded-[20px] border border-border bg-white p-6 sm:p-7">
          <p className="text-xs font-extrabold tracking-[0.14em] text-muted uppercase">End-of-class signal</p>
          <h2 className="mt-2 text-xl font-black">Aha! Moment</h2>
          <div className={`mt-5 rounded-2xl p-5 ${state.ahaMoment.completed ? "bg-[#E6F7EF]" : "bg-[#F8F1EF]"}`}>
            <p className="font-bold">{state.ahaMoment.completed ? `ได้รับ Aha! Moment จาก ${state.ahaMoment.responseCount} คน` : "จบคลาสโดยไม่มี Aha! Moment feedback"}</p>
            {state.ahaMoment.completed && <p className="mt-2 text-sm text-muted">ความคิดเห็นเพิ่มเติม {state.ahaMoment.feedbackCount} ข้อ</p>}
          </div>
        </section>
        <section className="rounded-[20px] border border-border bg-white p-6 sm:p-7">
          <p className="text-xs font-extrabold tracking-[0.14em] text-muted uppercase">Summary insight</p>
          <h2 className="mt-2 text-xl font-black">สิ่งที่ควรกลับมาทบทวน</h2>
          <p className="mt-5 rounded-2xl bg-[#FDE8E5] p-5 font-bold leading-7">“{state.questions.length ? `มีคำถามจากห้อง ${state.questions.length} ข้อสำหรับนำไปทบทวน` : "ห้องเรียนจบลงโดยไม่มีคำถามที่ค้างอยู่"}”</p>
        </section>
      </div>
    </div>
  );
}

function SummaryMetric({ value, label, surface }: { value: string; label: string; surface: string }) {
  return <div className={`rounded-2xl border border-[#DED5D1] p-5 ${surface}`}><p className="text-3xl font-black sm:text-4xl">{value}</p><p className="mt-2 text-xs font-bold text-muted">{label}</p></div>;
}

function ControlButton({ icon: Icon, label, active = false, disabled = false, onClick }: { icon: typeof Play; label: string; active?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`flex min-h-14 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-extrabold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${active ? "border-[#F25A4B] bg-[#F25A4B]" : "border-[#CDC3BE] bg-white hover:border-[#F25A4B] hover:bg-[#FDE8E5]"}`}>
      <Icon aria-hidden="true" size={17} /> {label}
    </button>
  );
}

function InsightCard({ icon: Icon, label, text, surface }: { icon: typeof Sparkles; label: string; text: string; surface: string }) {
  return (
    <article className={`rounded-[20px] border border-[#DED5D1] p-5 sm:p-6 ${surface}`}>
      <div className="flex items-center gap-2 text-xs font-extrabold tracking-[0.12em] text-[#6A3430] uppercase"><Icon aria-hidden="true" size={17} /> {label}</div>
      <p className="mt-4 text-base font-bold leading-7">“{text}”</p>
    </article>
  );
}

function QuizResults({ quiz, isActive, isRevealed }: { quiz: DemoQuiz; isActive: boolean; isRevealed: boolean }) {
  const total = getResponseTotal(quiz);
  return (
    <section className="rounded-[20px] border border-border bg-white p-5 sm:p-7" aria-labelledby="quiz-results-heading">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-extrabold tracking-[0.14em] text-muted uppercase">{isActive ? "Live Quiz Results" : "Quiz Preview"}</p>
          <h2 id="quiz-results-heading" className="mt-1 text-xl font-black">{quiz.label}: {quiz.question}</h2>
        </div>
        <span className="shrink-0 rounded-full bg-[#E6F7EF] px-3 py-1.5 text-xs font-bold">{total} คำตอบ</span>
      </div>
      <div className="mt-6 space-y-4">
        {quiz.options.map((option) => {
          const count = quiz.responses[option.id];
          const percentage = total ? Math.round((count / total) * 100) : 0;
          const correct = isRevealed && option.id === quiz.correctAnswer;
          return (
            <div key={option.id}>
              <div className="mb-2 flex items-center gap-3 text-sm">
                <span className={`flex size-7 items-center justify-center rounded-lg font-black ${correct ? "bg-[#BFE8D2]" : "bg-[#F1ECE9]"}`}>{option.id}</span>
                <span className="min-w-0 flex-1 font-bold">{option.text}</span>
                {correct && <CheckCircle2 aria-label="คำตอบที่ถูก" className="text-[#2E7652]" size={17} />}
                <span className="w-9 text-right font-black">{count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#F1ECE9]"><div className={`h-full rounded-full ${correct ? "bg-[#72C79A]" : "bg-[#F5A49C]"}`} style={{ width: `${percentage}%` }} /></div>
            </div>
          );
        })}
      </div>
      {!isRevealed && <p className="mt-6 rounded-2xl bg-[#FAF8F7] p-4 text-sm font-semibold text-muted">คำตอบที่ถูกจะปรากฏหลังเลือก Reveal Results</p>}
    </section>
  );
}
