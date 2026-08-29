import type { Metadata } from "next";
import { DemoStateProvider } from "@/components/demo/demo-state-provider";

export const metadata: Metadata = {
  title: "Live Demo | Aha!",
  description: "Aha! live classroom multi-surface demo",
};

export default function DemoLayout({ children }: LayoutProps<"/demo">) {
  return <DemoStateProvider>{children}</DemoStateProvider>;
}
