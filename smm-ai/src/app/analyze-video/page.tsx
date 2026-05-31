import type { Metadata } from "next";
import VideoAnalysisForm from "./video-form";

export const metadata: Metadata = {
  title: "Анализ видео — Marketing Chef AI",
  description: "Анализ видео для рекламы ресторана с рекомендациями для Meta Ads",
};

export default function AnalyzeVideoPage() {
  return <VideoAnalysisForm />;
}
