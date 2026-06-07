import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PageShell from "@/components/page-shell";
import { getAuthUser } from "@/lib/auth";
import { getSalesAnalytics } from "@/lib/sales/analytics";
import { AnalyticsDashboard } from "./analytics-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Аналитика бизнеса — Marketing Chef AI",
  description:
    "Выручка, средний чек, популярные товары, продажи по дням и часам, динамика роста и рекомендации AI.",
};

export default async function AnalyticsPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  const analytics = await getSalesAnalytics();

  return (
    <PageShell
      activeFeature="/analytics"
      badge="Аналитика бизнеса"
      title="Аналитика бизнеса"
      subtitle="Реальные данные продаж из iiko, динамика роста и рекомендации вашего AI-директора."
    >
      <AnalyticsDashboard analytics={analytics} />
    </PageShell>
  );
}
