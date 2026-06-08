import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PageShell from "@/components/page-shell";
import { getAuthUser } from "@/lib/auth";
import { getAiHqDashboard } from "@/lib/agents";
import { AiHqDashboard } from "./ai-hq-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Штаб ИИ — Marketing Chef AI",
  description:
    "Центр управления AI-агентами: аналитика, таргетинг, креативы, конкуренты и ROI.",
};

export default async function AiHqPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login?redirect=/ai-hq");
  }

  const data = await getAiHqDashboard();

  return (
    <PageShell
      activeFeature="/ai-hq"
      badge="Штаб ИИ"
      title="Штаб ИИ"
      subtitle="Центр управления AI-агентами Marketing Chef"
    >
      <AiHqDashboard data={data} />
    </PageShell>
  );
}
