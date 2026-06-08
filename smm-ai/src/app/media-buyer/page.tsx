import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PageShell from "@/components/page-shell";
import { getAuthUser } from "@/lib/auth";
import { getMediaBuyerDashboard } from "@/lib/media-buyer";
import { MediaBuyerDashboard } from "./media-buyer-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Media Buyer Agent — Marketing Chef AI",
  description:
    "AI-таргетолог: находит ошибки в Meta Ads, объясняет причины и предлагает решения.",
};

export default async function MediaBuyerPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login?redirect=/media-buyer");
  }

  const data = await getMediaBuyerDashboard();

  return (
    <PageShell
      activeFeature="/media-buyer"
      badge="Media Buyer"
      title="Media Buyer Agent"
      subtitle={
        data.adAccountName
          ? `${data.adAccountName} · AI-таргетолог Meta Ads`
          : "AI-таргетолог для Meta Ads"
      }
    >
      <MediaBuyerDashboard data={data} />
    </PageShell>
  );
}
