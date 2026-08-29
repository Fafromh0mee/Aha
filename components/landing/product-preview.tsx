import {
  BarChart3,
  Check,
  MessageCircleQuestion,
  Radio,
  Users,
} from "lucide-react";

const reactions = [
  { emoji: "👍", label: "เข้าใจ", value: 68, color: "bg-[#BDEBD3]" },
  { emoji: "🤯", label: "งง", value: 14, color: "bg-[#F7C9DA]" },
  { emoji: "🐢", label: "ตามไม่ทัน", value: 11, color: "bg-[#FFE993]" },
  { emoji: "💡", label: "อ๋อ!", value: 7, color: "bg-[#C9E8FF]" },
] as const;

export function ProductPreview() {
  return (
    <div
      className="relative mx-auto w-full max-w-[660px] pb-3 lg:pb-14"
      role="img"
      aria-label="ตัวอย่างหน้าจอ Aha! สำหรับผู้สอนและนักเรียน"
    >
      <div className="overflow-hidden rounded-[24px] border border-[#DED5D1] bg-white shadow-[0_20px_50px_rgba(32,26,24,0.10)]">
        <div className="flex h-11 items-center gap-2 border-b border-border bg-[#FAF8F7] px-4">
          <span className="size-2.5 rounded-full bg-[#F25A4B]" />
          <span className="size-2.5 rounded-full bg-[#FFD66E]" />
          <span className="size-2.5 rounded-full bg-[#9EDDBE]" />
          <div className="ml-2 h-5 w-28 rounded-md border border-border bg-white" />
        </div>

        <div className="p-4 sm:p-5 lg:pr-28">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
            <div>
              <p className="text-[10px] font-bold tracking-[0.18em] text-muted uppercase">
                ชีววิทยา 101
              </p>
              <p className="mt-1 text-base font-bold sm:text-lg">การสังเคราะห์ด้วยแสง</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDE8E5] px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-[#A72F27]">
                <span className="live-pulse size-1.5 rounded-full bg-[#D93E33]" />
                LIVE
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted">
                <Users aria-hidden="true" size={14} /> 42 คน
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold">สัญญาณของห้อง</p>
                <Radio aria-hidden="true" className="text-[#D94338]" size={16} />
              </div>
              <div className="mt-4 space-y-3">
                {reactions.map((reaction) => (
                  <div key={reaction.label}>
                    <div className="mb-1.5 flex items-center justify-between text-[11px]">
                      <span className="font-semibold">
                        <span aria-hidden="true">{reaction.emoji}</span>{" "}
                        {reaction.label}
                      </span>
                      <span className="font-bold">{reaction.value}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#F1ECE9]">
                      <div
                        className={`h-full rounded-full ${reaction.color}`}
                        style={{ width: `${reaction.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-border bg-[#E6F4FF] p-4">
                <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.12em] text-[#2E617E] uppercase">
                  <MessageCircleQuestion aria-hidden="true" size={14} />
                  คำถามล่าสุด
                </div>
                <p className="mt-2 text-xs font-semibold leading-5">
                  ถ้าแสงน้อยลง อัตราการสังเคราะห์ด้วยแสงจะเปลี่ยนอย่างไรคะ?
                </p>
                <p className="mt-2 text-[10px] text-muted">มี 6 คนสงสัยเรื่องนี้</p>
              </div>

              <div className="rounded-2xl border border-border bg-[#FFF9DE] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.12em] text-[#745C0B] uppercase">
                    <BarChart3 aria-hidden="true" size={14} />
                    Quick Quiz
                  </div>
                  <span className="text-[10px] font-bold">78%</span>
                </div>
                <p className="mt-2 text-xs font-semibold">ตอบแล้ว 33 จาก 42 คน</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
                  <div className="h-full w-[78%] rounded-full bg-[#E9BE37]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 ml-auto w-[190px] rounded-[26px] border-[5px] border-[#201A18] bg-white p-2 shadow-[0_14px_30px_rgba(32,26,24,0.12)] sm:w-[210px] lg:absolute lg:right-0 lg:bottom-0 lg:mt-0">
        <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-[#201A18]" />
        <div className="rounded-[17px] bg-[#FAF8F7] px-3 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black">Aha!</span>
            <span className="flex items-center gap-1 text-[9px] font-bold text-[#A72F27]">
              <span className="live-pulse size-1.5 rounded-full bg-[#D93E33]" /> LIVE
            </span>
          </div>
          <p className="mt-4 text-center text-[11px] font-bold">ตอนนี้เป็นอย่างไรบ้าง?</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {reactions.map((reaction, index) => (
              <div
                key={reaction.label}
                className={`flex min-h-14 flex-col items-center justify-center rounded-xl border border-[#E8E1DE] text-center ${
                  index === 0 ? "bg-[#E6F7EF]" : "bg-white"
                }`}
              >
                <span aria-hidden="true" className="text-base">{reaction.emoji}</span>
                <span className="mt-0.5 text-[9px] font-semibold">{reaction.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-center gap-1 text-[9px] font-semibold text-[#307052]">
            <Check aria-hidden="true" size={11} /> ส่งสัญญาณแล้ว
          </div>
        </div>
      </div>
    </div>
  );
}
