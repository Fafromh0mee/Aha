"use client";

import Link from "next/link";
import { ArrowLeft, Check, HeartHandshake, HelpCircle, Radio, Send, Sparkles, Wifi } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useDemoState } from "@/components/demo/demo-state-provider";
import { getQuiz, reactionMeta } from "@/lib/demo-state";

export function StudentLive() {
  const { state, isReady, transport, sendReaction, sendAhaFeedback, answerQuiz, submitQuestion } = useDemoState();
  const [question, setQuestion] = useState("");
  const [ahaFeedback, setAhaFeedback] = useState("");
  const [notice, setNotice] = useState("");
  const activeQuiz = getQuiz(state, state.activeQuizId);
  const selectedAnswer = state.activeQuizId ? state.studentAnswers[state.activeQuizId] : undefined;
  const isAhaMoment = state.activityMode === "aha";
  const reactionOpen = state.session.status === "live";

  const react = (key: (typeof reactionMeta)[number]["key"], label: string) => {
    if (!reactionOpen) return;
    sendReaction(key);
    if (isAhaMoment) sendAhaFeedback(key, ahaFeedback);
    setNotice(`ส่ง “${label}” แล้ว`);
  };

  const chooseAnswer = (answer: "A" | "B" | "C" | "D") => {
    if (!activeQuiz || state.activityMode !== "quiz") return;
    answerQuiz(activeQuiz.id, answer);
    setNotice(`ส่งคำตอบข้อ ${answer} แล้ว`);
  };

  const handleQuestion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim()) return;
    submitQuestion(question);
    setQuestion("");
    setNotice("ส่งคำถามให้ผู้สอนแล้ว");
  };

  const handleAhaFeedback = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const reaction = state.ahaMoment.feedback;
    if (!reaction) return;
    sendAhaFeedback(reaction, ahaFeedback);
    setNotice("ส่ง Aha! Moment แล้ว ขอบคุณนะ");
  };

  return (
    <main className="min-h-screen bg-[#F6F2F0] px-3 py-3 sm:px-5 sm:py-6">
      <div className="mx-auto min-h-[calc(100vh-24px)] max-w-[480px] overflow-hidden rounded-[28px] border border-[#DED5D1] bg-white sm:min-h-[calc(100vh-48px)]">
        <header className="border-b border-border px-5 py-4">
          <div className="flex items-center justify-between">
            <Link href="/demo" className="flex size-11 items-center justify-center rounded-xl border border-border hover:bg-[#FAF8F7]" aria-label="กลับไปเลือกมุมมอง">
              <ArrowLeft aria-hidden="true" size={19} />
            </Link>
            <p className="text-xl font-black tracking-[-0.04em]">Aha<span className="text-[#F25A4B]">!</span></p>
            <span className="flex size-11 items-center justify-center rounded-xl bg-[#E6F7EF] text-[#2E7652]" aria-label={isReady && transport !== "connecting" ? "เชื่อมต่อแล้ว" : "กำลังเชื่อมต่อ"}>
              <Wifi aria-hidden="true" size={18} />
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-extrabold tracking-[0.13em] text-muted uppercase">{state.session.course}</p>
              <h1 className="mt-1 text-xl font-black">{state.session.topic}</h1>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-[0.12em] ${state.session.status === "ended" ? "bg-[#F1ECE9] text-muted" : "bg-[#FDE8E5] text-[#A72F27]"}`}>
              <span className={`size-1.5 rounded-full ${state.session.status === "ended" || state.session.status === "waiting" ? "bg-[#8A817D]" : "live-pulse bg-[#D93E33]"}`} /> {state.session.status === "ended" ? "ENDED" : state.session.status === "waiting" ? "WAITING" : "LIVE"}
            </span>
          </div>
        </header>

        {state.session.status === "ended" ? (
          <StudentEndedState />
        ) : (
        <div className="space-y-4 p-4 sm:p-5">
          <section className={`rounded-[20px] border p-5 ${reactionOpen ? isAhaMoment ? "border-[#E2C252] bg-[#FFF4C2]" : "border-[#F3B1AA] bg-[#FDE8E5]" : "border-border bg-[#FAF8F7]"}`} aria-labelledby="reaction-heading">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-white">{isAhaMoment ? <Sparkles aria-hidden="true" size={19} /> : <Radio aria-hidden="true" size={19} />}</span>
              <div>
                <p className="text-[10px] font-extrabold tracking-[0.12em] text-muted uppercase">Class Pulse · Always on</p>
                <h2 id="reaction-heading" className="font-black">{isAhaMoment ? "ส่ง Pulse และ Aha! Moment ก่อนจบคลาส" : "ตอนนี้เป็นอย่างไรบ้าง?"}</h2>
              </div>
            </div>
            {!reactionOpen && <p className="mt-4 rounded-xl bg-white px-3 py-2 text-center text-xs font-semibold text-muted">รอผู้สอนกด Start Class เพื่อเปิด Class Pulse</p>}
            {isAhaMoment && <p className="mt-4 rounded-xl bg-white px-3 py-2 text-center text-xs font-semibold text-muted">การเลือกสัญญาณจะอัปเดต Class Pulse และ Aha! Moment พร้อมกัน</p>}
            <div className="mt-4 grid grid-cols-2 gap-3">
              {reactionMeta.map((reaction) => {
                const selectedFeedback = state.studentReaction === reaction.key;
                return (
                <button key={reaction.key} type="button" disabled={!reactionOpen} onClick={() => react(reaction.key, reaction.label)} className={`flex min-h-[104px] flex-col items-center justify-center rounded-2xl border bg-white p-3 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-[#F25A4B] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45 ${selectedFeedback ? "border-[#F25A4B] ring-2 ring-[#F25A4B]/25" : "border-[#D8CFCA]"}`}>
                  <span className="text-3xl" aria-hidden="true">{reaction.emoji}</span>
                  <span className="mt-2 text-sm font-extrabold">{reaction.label}</span>
                  {selectedFeedback && <span className="mt-1 text-[10px] font-bold text-[#A72F27]">Pulse ล่าสุด</span>}
                </button>
                );
              })}
            </div>
            {isAhaMoment && (
              <form className="mt-4 rounded-2xl bg-white p-3" onSubmit={handleAhaFeedback}>
                <label htmlFor="aha-feedback" className="text-xs font-bold text-muted">อยากบอกอะไรเพิ่มเติมไหม? (ไม่บังคับ)</label>
                <textarea id="aha-feedback" value={ahaFeedback} onChange={(event) => setAhaFeedback(event.target.value)} rows={2} maxLength={500} placeholder="วันนี้เข้าใจอะไรเพิ่มขึ้น..." className="mt-2 w-full resize-none rounded-xl border border-[#D8CFCA] px-3 py-2 text-sm outline-none focus:border-[#201A18]" />
                <button type="submit" disabled={!state.ahaMoment.feedback} className="mt-2 min-h-11 w-full rounded-xl bg-[#201A18] px-4 text-sm font-extrabold text-white disabled:opacity-40">อัปเดต Aha! Moment</button>
              </form>
            )}
          </section>

          <section className={`rounded-[20px] border p-5 ${activeQuiz ? "border-[#C5B9F4] bg-[#F0EBFF]" : "border-border bg-white"}`} aria-labelledby="student-quiz-heading">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-white"><Sparkles aria-hidden="true" size={18} /></span>
              <div>
                <p className="text-[10px] font-extrabold tracking-[0.12em] text-muted uppercase">Quick Quiz</p>
                <h2 id="student-quiz-heading" className="font-black">{activeQuiz ? activeQuiz.label : "รอคำถามจากผู้สอน"}</h2>
              </div>
            </div>

            {activeQuiz && (
              <div className="mt-5">
                <p className="text-lg font-black leading-7">{activeQuiz.question}</p>
                <div className="mt-4 space-y-2.5">
                  {activeQuiz.options.map((option) => {
                    const selected = selectedAnswer === option.id;
                    const showingResults = state.activityMode === "results";
                    const correct = option.id === activeQuiz.correctAnswer;
                    return (
                      <button key={option.id} type="button" disabled={showingResults} onClick={() => chooseAnswer(option.id)} className={`flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 text-left text-sm font-bold transition-colors ${showingResults && correct ? "border-[#72C79A] bg-[#E6F7EF]" : selected ? "border-[#8F78E5] bg-white" : "border-[#D8CFCA] bg-white hover:border-[#8F78E5]"} disabled:cursor-default`}>
                        <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg font-black ${selected ? "bg-[#8F78E5] text-white" : "bg-[#F3F0FF]"}`}>{option.id}</span>
                        <span className="flex-1">{option.text}</span>
                        {(selected || (showingResults && correct)) && <Check aria-hidden="true" className={correct && showingResults ? "text-[#2E7652]" : "text-[#6B55BD]"} size={17} />}
                      </button>
                    );
                  })}
                </div>
                {state.activityMode === "results" && <p className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-bold">คำตอบที่ถูกคือข้อ {activeQuiz.correctAnswer}</p>}
              </div>
            )}
          </section>

          <section className="rounded-[20px] border border-border bg-[#E6F4FF] p-5" aria-labelledby="ask-heading">
            <div className="flex items-center gap-3">
              <HelpCircle aria-hidden="true" size={20} />
              <h2 id="ask-heading" className="font-black">มีคำถามไหม?</h2>
            </div>
            <form className="mt-4" onSubmit={handleQuestion}>
              <label htmlFor="student-question" className="sr-only">พิมพ์คำถามถึงผู้สอน</label>
              <textarea id="student-question" disabled={!reactionOpen} value={question} onChange={(event) => setQuestion(event.target.value)} rows={3} placeholder="พิมพ์คำถามสั้น ๆ ที่นี่..." className="w-full resize-none rounded-xl border border-[#B9D8EB] bg-white px-4 py-3 text-sm leading-6 outline-none placeholder:text-[#8A817D] focus:border-[#201A18] disabled:opacity-50" />
              <button type="submit" disabled={!reactionOpen || !question.trim()} className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#201A18] px-4 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40">
                ส่งคำถาม <Send aria-hidden="true" size={16} />
              </button>
            </form>
          </section>

          <div aria-live="polite" className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors ${notice ? "bg-[#E6F7EF] text-[#245C42]" : "bg-transparent text-transparent"}`}>
            {notice && <Check aria-hidden="true" size={17} />} {notice || "พร้อมส่ง"}
          </div>
        </div>
        )}
      </div>
    </main>
  );
}

function StudentEndedState() {
  return (
    <section className="flex min-h-[620px] flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex size-20 items-center justify-center rounded-[22px] bg-[#E6F7EF] text-[#2E7652]"><HeartHandshake aria-hidden="true" size={36} /></div>
      <p className="mt-7 text-xs font-extrabold tracking-[0.16em] text-[#2E7652] uppercase">Class complete</p>
      <h2 className="mt-4 text-4xl font-black tracking-[-0.04em]">ขอบคุณที่มีส่วนร่วม!</h2>
      <p className="mt-5 max-w-[330px] text-base leading-8 text-muted">คลาสนี้จบแล้ว ทุก Reaction คำตอบ และคำถามของคุณช่วยให้ห้องเรียนดีขึ้น</p>
      <div className="mt-8 rounded-2xl bg-[#FFF4C2] px-5 py-4 text-sm font-bold">แล้วพบกันใน Aha! Moment ครั้งต่อไป 💡</div>
    </section>
  );
}
