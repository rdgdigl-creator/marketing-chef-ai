import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PageShell from "@/components/page-shell";
import { ProfileSidebar } from "@/components/profile-sidebar";
import { getAuthContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMetaConnectionStatus, listMetaAdAccounts } from "@/lib/meta";
import { IikoIntegrationCard } from "./iiko-integration-card";
import { MetaIntegrationCard } from "./meta-integration-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Интеграции — Marketing Chef AI",
};

async function getProjectCount(userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("marketing_projects")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
}

type IikoConnectionRow = {
  organization_name: string | null;
  api_login: string | null;
  is_active: boolean;
  sync_status: string;
  last_sync_at: string | null;
  error_message: string | null;
};

async function getIikoConnection(
  userId: string,
): Promise<IikoConnectionRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("iiko_connections")
    .select(
      "organization_name, api_login, is_active, sync_status, last_sync_at, error_message",
    )
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as IikoConnectionRow | null) ?? null;
}

type IntegrationsPageProps = {
  searchParams: Promise<{ meta?: string; meta_error?: string }>;
};

export default async function ProfileIntegrationsPage({
  searchParams,
}: IntegrationsPageProps) {
  const { user } = await getAuthContext();
  if (!user) redirect("/login?redirect=/profile/integrations");

  const params = await searchParams;

  const [projectCount, connection, metaStatus, metaAccounts] = await Promise.all([
    getProjectCount(user.id),
    getIikoConnection(user.id),
    getMetaConnectionStatus(user.id),
    listMetaAdAccounts(user.id),
  ]);

  // В браузер уходит только имя интеграции (API Login), без секрета (API Key).
  const apiLogin = connection?.api_login?.trim() || null;

  return (
    <PageShell
      badge="Интеграции"
      title="Интеграции"
      subtitle="Подключите внешние сервисы к Marketing Chef AI"
    >
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <ProfileSidebar projectCount={projectCount} />
        <div className="space-y-6">
          <IikoIntegrationCard
            connected={Boolean(connection)}
            apiLogin={apiLogin}
            organizationName={connection?.organization_name || null}
            syncStatus={connection?.sync_status ?? null}
            lastSyncAt={connection?.last_sync_at ?? null}
            errorMessage={connection?.error_message ?? null}
          />
          <MetaIntegrationCard
            mockMode={metaStatus.dataSource === "mock" || !metaStatus.oauthAvailable}
            oauthAvailable={metaStatus.oauthAvailable}
            dataSource={metaStatus.dataSource}
            connected={metaStatus.connected}
            metaUserName={metaStatus.metaUserName}
            syncStatus={metaStatus.syncStatus}
            lastSyncAt={metaStatus.lastSyncAt}
            errorMessage={metaStatus.errorMessage}
            selectedAdAccountId={metaStatus.selectedAdAccountId}
            selectedAdAccountName={metaStatus.selectedAdAccountName}
            adAccounts={metaAccounts}
            oauthSuccess={params.meta === "connected"}
            oauthError={params.meta_error ?? null}
          />
        </div>
      </div>
    </PageShell>
  );
}
