import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  BarChart3,
  DoorOpen,
  MessageCircleQuestion,
  Radio,
  Smartphone,
  Sparkles,
  Zap,
} from "lucide-react";
import { LiveSignals } from "@/components/landing/live-signals";
import { ProductPreview } from "@/components/landing/product-preview";

const demoButtonClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#F25A4B] px-5 py-3 text-sm font-extrabold text-[#201A18] transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-[#E94F45] active:translate-y-0 active:bg-[#E94F45]";

const steps = [
  {
    number: "01",
    icon: DoorOpen,
    title: "เปิดห้องเรียน",
    description: "สร้างห้องและให้นักเรียนเข้าร่วมจากโทรศัพท์ได้อย่างรวดเร็ว",
    surface: "bg-[#FDE8E5]",
  },
  {
    number: "02",
    icon: Smartphone,
    title: "นักเรียนโต้ตอบ",
    description: "ส่ง Reaction ถามคำถาม และตอบกิจกรรมได้โดยไม่ขัดจังหวะการสอน",
    surface: "bg-[#E6F4FF]",
  },
  {
    number: "03",
    icon: BarChart3,
    title: "ครูเห็นสัญญาณ",
    description: "มองเห็นจังหวะที่ห้องเข้าใจ สับสน หรือตามไม่ทันแบบเรียลไทม์",
    surface: "bg-[#E6F7EF]",
  },
] as const;

const features = [
  {
    icon: Radio,
    eyebrow: "Live Reactions",
    title: "เข้าใจนักเรียนได้ผ่านกิจกรรม interaction ในห้องเรียน",
    description:
      "เห็นความเข้าใจและความสับสนของห้องได้ทันที ผ่าน Reaction ที่ส่งง่ายจากมือถือ",
    surface: "bg-[#FDEAF2]",
    iconSurface: "bg-[#F6C8D9]",
  },
  {
    icon: MessageCircleQuestion,
    eyebrow: "Questions",
    title: "เปิดกว้างสำหรับทุกคำถาม",
    description:
      "เปิดพื้นที่ให้นักเรียนถามได้ระหว่างเรียน แม้ในห้องใหญ่หรือในจังหวะที่ยังไม่กล้ายกมือ",
    surface: "bg-[#E6F4FF]",
    iconSurface: "bg-[#C7E6FA]",
  },
  {
    icon: Zap,
    eyebrow: "Quick Quiz",
    title: "เช็กความเข้าใจได้ในไม่กี่นาที",
    description:
      "เช็กความเข้าใจด้วย Quiz เกมสั้น ๆ และเห็นภาพรวมคำตอบโดยไม่ต้องสลับเครื่องมือ",
    surface: "bg-[#FFF4C2]",
    iconSurface: "bg-[#F6DE7A]",
  },
  {
    icon: BarChart3,
    eyebrow: "Classroom Insights",
    title: "เข้าใจภาพรวมเพื่อพัฒนาห้องเรียนให้ตรงจุด",
    description:
      "รวม Reaction คำถาม และคำตอบไว้ในภาพเดียว เพื่อช่วยตัดสินใจว่าจะไปต่อหรืออธิบายเพิ่ม",
    surface: "bg-[#E6F7EF]",
    iconSurface: "bg-[#BFE8D2]",
  },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <a
        href="#main-content"
        className="fixed top-3 left-3 z-50 -translate-y-24 rounded-lg bg-[#201A18] px-4 py-2 text-sm font-bold text-white transition-transform focus:translate-y-0"
      >
        ข้ามไปยังเนื้อหาหลัก
      </a>
      <SiteHeader />
      <main id="main-content">
        <Hero />
        <HowItWorks />
        <FeatureGrid />
        <LiveSection />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="border-b border-border bg-white">
      <nav
        className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-5 sm:px-8"
        aria-label="เมนูหลัก"
      >
        <a
          href="#main-content"
          className="group inline-flex items-baseline text-[26px] font-black tracking-[-0.04em]"
          aria-label="Aha! หน้าแรก"
        >
          Aha
          <span className="text-[#F25A4B] transition-transform group-hover:-rotate-6">
            !
          </span>
        </a>
        <div className="hidden items-center gap-7 md:flex">
          <a
            className="text-sm font-semibold text-muted hover:text-foreground"
            href="#how-it-works"
          >
            วิธีใช้งาน
          </a>
          <a
            className="text-sm font-semibold text-muted hover:text-foreground"
            href="#features"
          >
            ฟีเจอร์
          </a>
          <a
            className="text-sm font-semibold text-muted hover:text-foreground"
            href="#live-signals"
          >
            Live Signals
          </a>
        </div>
        <Link
          href="/demo"
          className={`${demoButtonClass} min-h-11 px-4 py-2.5`}
        >
          ลองใช้งาน Demo <ArrowRight aria-hidden="true" size={17} />
        </Link>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative border-b border-border">
      <div className="pointer-events-none absolute top-24 left-[5%] hidden size-3 rotate-12 bg-[#FFF4C2] lg:block" />
      <div className="pointer-events-none absolute right-[4%] bottom-20 hidden size-5 rounded-full border-4 border-[#F6C8D9] lg:block" />
      <div className="mx-auto grid max-w-[1200px] items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.82fr_1.18fr] lg:gap-12 lg:py-24">
        <div className="max-w-[620px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F3B1AA] bg-[#FDE8E5] px-3 py-1.5 text-[11px] font-extrabold tracking-[0.13em] text-[#A72F27]">
            <span className="live-pulse size-2 rounded-full bg-[#D93E33]" />{" "}
            LIVE CLASSROOM SIGNALS
          </div>
          <h1 className="mt-6 text-[clamp(2.6rem,6vw,4.6rem)] leading-[1.08] font-black tracking-[-0.045em] text-balance">
            รู้ทันที ว่าห้องเรียนกำลัง
            <span className="relative inline-block whitespace-nowrap">
              รู้สึกยังไง
              <span
                className="absolute right-0 -bottom-1 left-0 h-1.5 -rotate-1 bg-[#F25A4B]"
                aria-hidden="true"
              />
            </span>
          </h1>
          <p className="mt-7 max-w-[590px] text-[17px] leading-8 text-muted sm:text-lg">
            ให้นักเรียนโต้ตอบ ถามคำถาม และตอบกิจกรรมได้แบบสด ๆ
            ขณะที่ผู้สอนเห็นภาพรวมของห้องเรียน โดยไม่ต้องรอถึงข้อสอบ
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/demo" className={demoButtonClass}>
              ลองใช้งาน Demo <ArrowRight aria-hidden="true" size={18} />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#CDC3BE] bg-white px-5 py-3 text-sm font-bold transition-colors hover:bg-[#FAF8F7]"
            >
              ดูวิธีการทำงาน <ArrowDownRight aria-hidden="true" size={18} />
            </a>
          </div>
          <p className="mt-5 flex items-center gap-2 text-xs font-bold tracking-[0.08em] text-muted uppercase">
            <Sparkles aria-hidden="true" className="text-[#D94338]" size={15} />{" "}
            Read the room, in real time.
          </p>
        </div>
        <ProductPreview />
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-6 px-5 py-20 sm:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-[1200px]">
        <SectionHeading
          eyebrow="HOW IT WORKS"
          title="เริ่มห้องที่คุยกันได้ ใน 3 ขั้นตอน"
          description="ออกแบบมาให้เริ่มง่ายทั้งฝั่งผู้สอนและนักเรียน โดยไม่เพิ่มความวุ่นวายระหว่างคาบ"
        />
        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <li
                key={step.number}
                className="relative rounded-[20px] border border-border bg-white p-6 sm:p-7"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex size-12 items-center justify-center rounded-xl ${step.surface}`}
                  >
                    <Icon aria-hidden="true" size={22} />
                  </span>
                  <span className="text-3xl font-black text-[#DED5D1]">
                    {step.number}
                  </span>
                </div>
                <h3 className="mt-7 text-xl font-extrabold">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">
                  {step.description}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function FeatureGrid() {
  return (
    <section
      id="features"
      className="scroll-mt-6 border-y border-border bg-[#FAF8F7] px-5 py-20 sm:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-[1200px]">
        <SectionHeading
          eyebrow="BUILT FOR THE MOMENT"
          title="ทุกเสียงในห้อง กลายเป็นสัญญาณที่มองเห็นได้"
          description="เครื่องมือสั้น กระชับ และอยู่ในจังหวะเดียวกับการสอนสด"
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.eyebrow}
                className={`grid gap-6 rounded-[20px] border border-[#DED5D1] p-6 sm:grid-cols-[auto_1fr] sm:p-8 ${feature.surface}`}
              >
                <div
                  className={`flex size-12 items-center justify-center rounded-xl ${feature.iconSurface}`}
                >
                  <Icon aria-hidden="true" size={22} />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold tracking-[0.15em] text-muted uppercase">
                    {feature.eyebrow}
                  </p>
                  <h3 className="mt-2 text-xl font-extrabold sm:text-2xl">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-muted">
                    {feature.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LiveSection() {
  return (
    <section
      id="live-signals"
      className="scroll-mt-6 px-5 py-20 sm:px-8 lg:py-28"
    >
      <div className="mx-auto grid max-w-[1080px] items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <p className="text-xs font-extrabold tracking-[0.18em] text-[#B5352C] uppercase">
            The room is live
          </p>
          <h2 className="mt-4 text-4xl leading-[1.17] font-black tracking-[-0.035em] text-balance sm:text-5xl">
            ทุกปัญหารับรู้ได้แบบ real-time
          </h2>
          <p className="mt-6 text-base leading-8 text-muted sm:text-lg">
            Aha!
            เปลี่ยนความเงียบในห้องให้เป็นสัญญาณที่ครูผู้สอนอ่านได้ทันทีว่าใครเริ่มเข้าใจ
            ตรงไหนยังสับสน และเมื่อไรควรหยุดถามเพิ่ม
          </p>
          <div className="mt-8 flex items-center gap-3 border-l-4 border-[#F25A4B] pl-4">
            <span className="text-sm font-bold">
              ไม่ต้องเดาอารมณ์ในห้องอีกต่อไป
            </span>
          </div>
        </div>
        <LiveSignals />
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="px-5 pb-20 sm:px-8 lg:pb-28">
      <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[24px] bg-[#201A18] px-6 py-14 text-white sm:px-12 lg:flex lg:items-center lg:justify-between lg:gap-16 lg:px-16 lg:py-16">
        <div
          className="absolute top-0 right-12 h-3 w-28 bg-[#F25A4B]"
          aria-hidden="true"
        />
        <div
          className="absolute right-4 bottom-4 size-16 rounded-full border-[10px] border-[#413936]"
          aria-hidden="true"
        />
        <div className="relative max-w-2xl">
          <p className="text-xs font-bold tracking-[0.18em] text-[#F6B3AC] uppercase">
            Ready for an Aha! moment?
          </p>
          <h2 className="mt-4 text-3xl leading-tight font-black tracking-[-0.03em] sm:text-4xl">
            พร้อมเข้าใจนักเรียนแบบเรียลไทม์หรือยัง?
          </h2>
          <p className="mt-4 text-base leading-7 text-[#D8D0CD]">
            ทดลองดูว่า Aha! จะช่วยให้ทุกคนในห้องมีส่วนร่วมได้อย่างไร
          </p>
        </div>
        <Link
          href="/demo"
          className={`${demoButtonClass} relative mt-8 shrink-0 lg:mt-0`}
        >
          ลองใช้งาน Demo <ArrowRight aria-hidden="true" size={18} />
        </Link>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-2xl font-black tracking-[-0.04em]">
            Aha<span className="text-[#F25A4B]">!</span>
          </p>
          <p className="mt-2 text-sm text-muted">
            Turn classroom reactions into learning signals.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-muted">
          <a href="#how-it-works" className="hover:text-foreground">
            วิธีใช้งาน
          </a>
          <a href="#features" className="hover:text-foreground">
            ฟีเจอร์
          </a>
          <a href="#live-signals" className="hover:text-foreground">
            Live Signals
          </a>
        </div>
        <p className="text-xs text-muted">© 2026 Aha!</p>
      </div>
    </footer>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-[720px]">
      <p className="text-xs font-extrabold tracking-[0.18em] text-[#B5352C] uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-3xl leading-[1.2] font-black tracking-[-0.035em] text-balance sm:text-5xl">
        {title}
      </h2>
      <p className="mt-5 max-w-[620px] text-base leading-8 text-muted sm:text-lg">
        {description}
      </p>
    </div>
  );
}
