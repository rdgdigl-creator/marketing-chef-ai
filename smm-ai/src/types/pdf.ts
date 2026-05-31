import type { SupportedFileType } from "@/lib/file-types";

export type DocumentType =
  | "restaurant_menu"
  | "sales_report"
  | "marketing_plan"
  | "commercial_proposal"
  | "financial_report"
  | "business_plan"
  | "other";

export type ConsultantMode = "marketing" | "business";

export type SwotAnalysis = {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
};

export type ActionPlan = {
  days7: string[];
  days30: string[];
  days90: string[];
};

/** Результат анализа документа (AI Document Analyzer) */
export type DocumentAnalysis = {
  documentType: DocumentType;
  detectedFileType: SupportedFileType;
  /** Извлечённый текст для RAG и чата с документом */
  documentText: string;
  /** 1. Краткое резюме */
  summary: string;
  /** 2. Основные выводы */
  keyFindings: string[];
  /** 3. SWOT-анализ */
  swot: SwotAnalysis;
  /** 4. Рекомендации */
  recommendations: string[];
  /** 5. План действий (7 / 30 / 90 дней) */
  actionPlan: ActionPlan;
  /** 6. Возможности увеличения прибыли */
  profitGrowthOpportunities: string[];
  /** 7. Идеи автоматизации через ИИ */
  automationIdeas: string[];
  /** 8. Маркетинговые идеи */
  marketingRecommendations: string[];
};

/** @deprecated Используйте DocumentAnalysis */
export type PdfAnalysis = DocumentAnalysis;

export type PdfDocument = {
  id: string;
  file_name: string;
  document_text: string;
  analysis: DocumentAnalysis;
  consultant_mode: ConsultantMode;
  created_at: string;
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  restaurant_menu: "Меню ресторана",
  sales_report: "Отчёт продаж",
  marketing_plan: "Маркетинговый план",
  commercial_proposal: "Коммерческое предложение",
  financial_report: "Финансовый отчёт",
  business_plan: "Бизнес-план",
  other: "Другой документ",
};

export const CONSULTANT_MODE_LABELS: Record<ConsultantMode, string> = {
  marketing: "Marketing Chef AI",
  business: "AI Бизнес Консультант",
};
