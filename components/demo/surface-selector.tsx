"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, MonitorUp, Presentation, RotateCcw, Smartphone } from "lucide-react";
import { useDemoState } from "@/components/demo/demo-state-provider";

const surfaces = [
  {
    href: "/demo/teacher",
    icon: Presentation,
    label: "Teacher",
    title: "Teacher Console",
    description: "ควบคุมกิจกรรม ดูสัญญาณ และเลือกสิ่งที่จะแสดงหน้าห้อง",
    surface: "bg-[#FDE8E5]",
  },
  {
    href: "/demo/student",
    icon: Smartphone,
    label: "Student",
    title: "Student Live",
    description: "ส่ง Reaction ตอบ Quiz และถามคำถามจากโทรศัพท์",
    surface: "bg-[#E6F4FF]",
  },
  {
    href: "/demo/display",
    icon: MonitorUp,
    label: "Classroom Display",
    title: "Shared Display",
    description: "มุมมองสำหรับจอโปรเจกเตอร์ที่อัปเดตตามกิจกรรมของห้อง",
    surface: "bg-[#FFF4C2]",
  },
] as const;

export function SurfaceSelector() {
  const { state, mode, room, resetDemo } = useDemoState();

  return (
    <main className="min-h-screen bg-white px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-[1080px]">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-muted hover:text-foreground">
            <ArrowLeft aria-hidden="true" size={18} /> กลับหน้าแรก
          </Link>
          <button type="button" onClick={resetDemo} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-bold hover:bg-[#FAF8F7]">
            <RotateCcw aria-hidden="true" size={16} /> Reset Local State
          </button>
        </div>

        <div className="mt-16 max-w-[760px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F3B1AA] bg-[#FDE8E5] px-3 py-1.5 text-[11px] font-extrabold tracking-[0.14em] text-[#A72F27]">
            <span className="live-pulse size-2 rounded-full bg-[#D93E33]" /> AHA! LIVE DEMO
          </div>
          <h1 className="mt-6 text-4xl leading-[1.12] font-black tracking-[-0.04em] sm:text-6xl">
            เลือกมุมมองสำหรับ Demo
          </h1>
          <p className="mt-5 text-base leading-8 text-muted sm:text-lg">
            Live Pitch Mode เชื่อมอุปกรณ์จริงผ่านห้อง {room} หรือเลือก Rehearsal สำหรับข้อมูลตัวอย่างในเบราว์เซอร์นี้
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href={`/demo?room=${room}`} className={`rounded-xl border px-4 py-2.5 text-sm font-bold ${mode === "live" ? "border-[#F25A4B] bg-[#FDE8E5]" : "border-border"}`}>Live Pitch · เริ่มจากศูนย์</Link>
            <Link href={`/demo?room=${room}&mode=rehearsal`} className={`rounded-xl border px-4 py-2.5 text-sm font-bold ${mode === "rehearsal" ? "border-[#8F78E5] bg-[#F0EBFF]" : "border-border"}`}>Rehearsal · Demo data</Link>
          </div>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {surfaces.map((surface) => {
            const Icon = surface.icon;
            return (
              <Link key={surface.href} href={`${surface.href}?room=${room}${mode === "rehearsal" ? "&mode=rehearsal" : ""}`} target="_blank" className="group flex min-h-[300px] flex-col rounded-[22px] border border-[#DED5D1] bg-white p-6 transition-[border-color,transform] hover:-translate-y-1 hover:border-[#F25A4B] sm:p-8">
                <div className={`flex size-14 items-center justify-center rounded-2xl ${surface.surface}`}>
                  <Icon aria-hidden="true" size={26} />
                </div>
                <p className="mt-8 text-[11px] font-extrabold tracking-[0.16em] text-[#B5352C] uppercase">{surface.label}</p>
                <h2 className="mt-2 text-2xl font-black">{surface.title}</h2>
                <p className="mt-3 flex-1 text-sm leading-7 text-muted">{surface.description}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold">
                  เปิดมุมมอง <ArrowRight aria-hidden="true" className="transition-transform group-hover:translate-x-1" size={18} />
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-[#FAF8F7] px-5 py-4 text-sm">
          <span className="font-bold">Session: {state.session.course} · {state.session.topic}</span>
          <span className="text-muted">{mode === "live" ? "Durable Object เป็นแหล่งข้อมูลหลัก · Local fallback พร้อมใช้" : "ข้อมูลซ้อมแยกจากห้อง Live"}</span>
        </div>
      </div>
    </main>
  );
}
