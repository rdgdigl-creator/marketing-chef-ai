import { mediaBuyerRuleEngine } from "@/lib/media-buyer/rule-engine";
import { getMetaConnectionStatus } from "@/lib/meta";
import { getMetaDataSource, isMetaMockMode } from "@/lib/meta/data-source";
import {
  buildMockMediaBuyerContext,
  getMetaMockSession,
} from "@/lib/meta/mock";
import { loadMediaBuyerContext } from "@/lib/media-buyer/metrics";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AgentAuditSnapshot, AgentStatus } from "./types";

export type MediaBuyerAgentStatus = {
  status: AgentStatus;
  connected: boolean;
  accountName: string | null;
  lastAudit: AgentAuditSnapshot | null;
};

async function loadLastAuditFromDb(userId: string): Promise<AgentAuditSnapshot | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("media_buyer_audits")
    .select("created_at, score, grade, issues")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  const row = data as {
    created_at: string;
    score: number;
    grade: string;
    issues?: Array<{ title?: string }>;
  };
  return {
    score: row.score,
    grade: row.grade,
    createdAt: row.created_at,
    topIssueTitle: row.issues?.[0]?.title ?? null,
  };
}

async function auditFromMockContext(): Promise<AgentAuditSnapshot | null> {
  const session = await getMetaMockSession();
  if (!session.synced) return null;
  const context = buildMockMediaBuyerContext(session);
  if (!context.hasData) return null;

  const matches = mediaBuyerRuleEngine.evaluateAll(context);
  const score = mediaBuyerRuleEngine.calculateScore(matches, context);
  const errors = mediaBuyerRuleEngine.pickErrors(matches);

  return {
    score: score.score,
    grade: score.grade,
    createdAt: new Date().toISOString(),
    topIssueTitle: errors[0]?.title ?? null,
  };
}

export async function resolveMediaBuyerStatus(
  userId: string,
): Promise<MediaBuyerAgentStatus> {
  const meta = await getMetaConnectionStatus(userId);

  if (!meta.connected) {
    return {
      status: "needs_setup",
      connected: false,
      accountName: null,
      lastAudit: null,
    };
  }

  if (!meta.selectedAdAccountId) {
    return {
      status: "needs_setup",
      connected: true,
      accountName: null,
      lastAudit: null,
    };
  }

  if (getMetaDataSource() === "mock") {
    const session = await getMetaMockSession();
    if (!session.synced) {
      return {
        status: "ready",
        connected: true,
        accountName: meta.selectedAdAccountName,
        lastAudit: null,
      };
    }
    return {
      status: "active",
      connected: true,
      accountName: meta.selectedAdAccountName,
      lastAudit: await auditFromMockContext(),
    };
  }

  const { context } = await loadMediaBuyerContext();
  const lastAudit = await loadLastAuditFromDb(userId);

  if (!context.hasData) {
    return {
      status: "ready",
      connected: true,
      accountName: meta.selectedAdAccountName,
      lastAudit: null,
    };
  }

  return {
    status: lastAudit ? "active" : "ready",
    connected: true,
    accountName: meta.selectedAdAccountName,
    lastAudit,
  };
}
