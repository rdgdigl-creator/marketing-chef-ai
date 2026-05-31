import type { Metadata } from "next";
import ReelsGeneratorForm from "./reels-form";

export const metadata: Metadata = {
  title: "Reels Studio — Marketing Chef AI",
  description: "20+ идей Reels с хуками, сценами для съёмки, подписями и промптами для Kling AI",
};

export default function ReelsGeneratorPage() {
  return <ReelsGeneratorForm />;
}
