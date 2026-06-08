import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PageShell from "@/components/page-shell";
import { getAuthUser } from "@/lib/auth";
import { getRevenueDashboard } from "@/lib/revenue";
import { RevenueDashboard } from "./revenue-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Рост выручки — Marketing Chef AI",
  description:
    "Выручка, гости, средний чек и ежедневные рекомендации AI для роста продаж ресторана на основе данных iiko.",
};

export default async function RevenuePage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login?redirect=/revenue");
  }

  const data = await getRevenueDashboard();

  return (
    <PageShell
      activeFeature="/revenue"
      badge="Рост выручки"
      title="Рост выручки"
      subtitle={
        data.restaurantName
          ? `${data.restaurantName} · советы AI на основе продаж из iiko`
          : "Советы AI на основе продаж из iiko"
      }
    >
      <RevenueDashboard data={data} />
    </PageShell>
  );
}
