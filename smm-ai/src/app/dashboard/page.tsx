import type { Metadata } from "next";
import MarketerDashboard from "./marketer-dashboard";

export const metadata: Metadata = {
  title: "AI Маркетолог — Marketing Chef AI",
  description: "Чат с ИИ маркетологом, стратегии, акции, контент-идеи и анализ бизнеса",
};

export default function DashboardPage() {
  return <MarketerDashboard />;
}
