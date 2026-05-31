import type { Metadata } from "next";
import AiChat from "./ai-chat";

export const metadata: Metadata = {
  title: "AI Чат — Marketing Chef AI",
  description:
    "Marketing Chef AI и AI Бизнес Консультант — маркетинг, стратегия и рост прибыли",
};

export default function AiPage() {
  return <AiChat />;
}
