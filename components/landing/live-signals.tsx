import { BarChart3, MessageCircle, Radio, Zap } from "lucide-react";

const events = [
  {
    icon: Radio,
    label: "นักเรียน 12 คนกด “เข้าใจ”",
    time: "เมื่อสักครู่",
    surface: "bg-[#E6F7EF]",
    iconColor: "text-[#2E7652]",
  },
  {
    icon: MessageCircle,
    label: "มีคำถามใหม่ในห้องเรียน",
    time: "10 วินาทีที่แล้ว",
    surface: "bg-[#E6F4FF]",
    iconColor: "text-[#306D91]",
  },
  {
    icon: BarChart3,
    label: "78% ตอบ Quick Quiz แล้ว",
    time: "กำลังอัปเดต",
    surface: "bg-[#FFF4C2]",
    iconColor: "text-[#80650B]",
  },
] as const;

export function LiveSignals() {
  return (
    <div className="relative rounded-[24px] border border-[#DCD3CF] bg-white p-4 sm:p-6">
      <div className="absolute -top-3 right-6 flex items-center gap-2 rounded-full border border-[#F3B1AA] bg-[#FDE8E5] px-3 py-1.5 text-[10px] font-extrabold tracking-[0.16em] text-[#A72F27]">
        <span className="live-pulse size-2 rounded-full bg-[#D93E33]" /> LIVE FEED
      </div>
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <p className="text-xs font-bold text-muted">ห้องเรียนของคุณ</p>
          <p className="mt-1 font-bold">สัญญาณล่าสุด</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#FDE8E5] text-[#B5352C]">
          <Zap aria-hidden="true" size={19} />
        </div>
      </div>
      <ol className="mt-3 space-y-1">
        {events.map((event) => {
          const Icon = event.icon;
          return (
            <li key={event.label} className="flex items-center gap-3 rounded-2xl border border-transparent p-3 transition-colors hover:border-border hover:bg-[#FAF8F7]">
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${event.surface} ${event.iconColor}`}>
                <Icon aria-hidden="true" size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{event.label}</span>
                <span className="mt-0.5 block text-[11px] text-muted">{event.time}</span>
              </span>
              <span className="size-2 shrink-0 rounded-full bg-[#F25A4B]" />
            </li>
          );
        })}
      </ol>
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
        <SignalStat value="42" label="คนในห้อง" />
        <SignalStat value="86%" label="มีส่วนร่วม" />
        <SignalStat value="3" label="คำถามใหม่" />
      </div>
    </div>
  );
}

function SignalStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-[#FAF8F7] px-2 py-3">
      <p className="text-lg font-black">{value}</p>
      <p className="text-[10px] font-semibold text-muted">{label}</p>
    </div>
  );
}
