export type {
  AgentCardData,
  AgentId,
  AgentMetric,
  AgentStatus,
  AiHqDashboardData,
} from "@/lib/ai-hq/types";

export type AgentAuditSnapshot = {
  score: number;
  grade: string;
  createdAt: string;
  topIssueTitle: string | null;
};

export type AgentStatusContext = {
  userId: string;
  dataSource: "oauth" | "mock";
};
