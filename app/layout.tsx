import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["thai", "latin"],
  weight: "variable",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aha! — ห้องเรียนที่โต้ตอบได้ แบบเข้าใจทันที",
  description:
    "ให้นักเรียนโต้ตอบ ถามคำถาม และตอบกิจกรรมได้แบบสด ๆ ขณะที่ผู้สอนเห็นสัญญาณของห้องเรียนแบบเรียลไทม์",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${notoSansThai.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
