import type { SupportedFileType } from "@/lib/file-types";
import { FILE_TYPE_LABELS } from "@/lib/file-types";
import type { ConsultantMode } from "@/types/pdf";

const MARKETING_SYSTEM = `Ты Marketing Chef AI — эксперт по маркетингу ресторанного и HoReCa-бизнеса.

Проанализируй загруженный документ (любой формат: отчёт, меню, план, таблица, презентация, изображение).
Дай глубокий бизнес-разбор с фокусом на практическую пользу для владельца ресторана или маркетолога.
Все тексты на русском. Будь конкретным, структурированным и ориентированным на действия.`;

const BUSINESS_SYSTEM = `Ты AI Бизнес Консультант — опытный стратегический консультант для малого и среднего бизнеса (HoReCa, ритейл, услуги).

Проанализируй загруженный документ как независимый эксперт: финансы, маркетинг, операции, риски, рост прибыли.
Все тексты на русском. Думай как советник владельцу: что делать, в каком порядке, какие риски.`;

export function getAnalyzeSystemPrompt(mode: ConsultantMode): string {
  return mode === "business" ? BUSINESS_SYSTEM : MARKETING_SYSTEM;
}

export function getAnalyzeUserPrompt(
  fileName: string,
  fileType: SupportedFileType,
  mode: ConsultantMode,
  extractedText: string,
): string {
  const focus =
    mode === "business"
      ? "Учитывай универсальную бизнес-логику: выручка, маржа, cash flow, команда, конкуренция."
      : "Учитывай специфику ресторанного бизнеса, если документ к нему относится.";

  const typeLabel = FILE_TYPE_LABELS[fileType];
  const textBlock = extractedText.trim()
    ? `\n\n=== ИЗВЛЕЧЁННОЕ СОДЕРЖИМОЕ ДОКУМЕНТА ===\n${extractedText.slice(0, 20000)}`
    : "\n\n(Текст извлечён из вложенного файла или изображения — используй всё доступное содержимое.)";

  return `Проанализируй документ «${fileName}» (тип файла: ${typeLabel}).

1. Сохрани максимально полный текст документа в поле documentText (для поиска и чата, до 15000 символов).
2. Укажи detectedFileType: "${fileType}".
3. Определи тип документа (documentType).
4. Составь разделы анализа строго по схеме JSON:
   - summary — краткое резюме (3–5 предложений)
   - keyFindings — основные выводы (5–8 пунктов)
   - swot — SWOT-анализ:
     • strengths — сильные стороны (4–6)
     • weaknesses — слабые стороны (4–6)
     • opportunities — возможности (4–6)
     • threats — угрозы (4–6)
   - recommendations — рекомендации (5–8)
   - actionPlan — план действий по срокам:
     • days7 — шаги на ближайшие 7 дней (3–5)
     • days30 — шаги на 30 дней (4–6)
     • days90 — шаги на 90 дней (4–6)
   - profitGrowthOpportunities — возможности увеличения прибыли (4–8)
   - automationIdeas — идеи автоматизации через ИИ (4–8)
   - marketingRecommendations — маркетинговые идеи (4–8)

${focus}${textBlock}`;
}

const stringArray = (min: number, max: number, desc: string) => ({
  type: "array" as const,
  items: { type: "string" as const },
  minItems: min,
  maxItems: max,
  description: desc,
});

export const DOCUMENT_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    documentType: {
      type: "string",
      enum: [
        "restaurant_menu",
        "sales_report",
        "marketing_plan",
        "commercial_proposal",
        "financial_report",
        "business_plan",
        "other",
      ],
    },
    detectedFileType: {
      type: "string",
      enum: ["pdf", "docx", "xlsx", "pptx", "csv", "txt", "md", "jpg", "png"],
    },
    documentText: {
      type: "string",
      description:
        "Полный или максимально полный извлечённый текст документа для RAG, до 15000 символов",
    },
    summary: {
      type: "string",
      description: "Краткое резюме документа",
    },
    keyFindings: stringArray(5, 8, "Основные выводы"),
    swot: {
      type: "object",
      properties: {
        strengths: stringArray(4, 6, "Сильные стороны"),
        weaknesses: stringArray(4, 6, "Слабые стороны"),
        opportunities: stringArray(4, 6, "Возможности"),
        threats: stringArray(4, 6, "Угрозы"),
      },
      required: ["strengths", "weaknesses", "opportunities", "threats"],
      additionalProperties: false,
    },
    recommendations: stringArray(5, 8, "Рекомендации"),
    actionPlan: {
      type: "object",
      properties: {
        days7: stringArray(3, 5, "Шаги на 7 дней"),
        days30: stringArray(4, 6, "Шаги на 30 дней"),
        days90: stringArray(4, 6, "Шаги на 90 дней"),
      },
      required: ["days7", "days30", "days90"],
      additionalProperties: false,
    },
    profitGrowthOpportunities: stringArray(4, 8, "Возможности увеличения прибыли"),
    automationIdeas: stringArray(4, 8, "Идеи автоматизации через ИИ"),
    marketingRecommendations: stringArray(4, 8, "Маркетинговые идеи"),
  },
  required: [
    "documentType",
    "detectedFileType",
    "documentText",
    "summary",
    "keyFindings",
    "swot",
    "recommendations",
    "actionPlan",
    "profitGrowthOpportunities",
    "automationIdeas",
    "marketingRecommendations",
  ],
  additionalProperties: false,
} as const;

/** @deprecated */
export const PDF_ANALYSIS_SCHEMA = DOCUMENT_ANALYSIS_SCHEMA;

export const DOCUMENT_CHAT_MARKETING_PROMPT = `Ты Marketing Chef AI. Отвечай на вопросы по загруженному документу и результатам его анализа.

Используй только контекст документа и анализа. Если данных недостаточно — честно скажи.
Отвечай на русском, структурированно, с практическими шагами.`;

export const DOCUMENT_CHAT_BUSINESS_PROMPT = `Ты AI Бизнес Консультант. Отвечай на вопросы владельца бизнеса по загруженному документу.

Опирайся на контекст документа, фрагменты и готовый анализ. Давай стратегические и операционные советы.
Если в документе нет данных — укажи это и предложи, что уточнить.
Отвечай на русском, по делу, с приоритетами и метриками где уместно.`;

export const AI_CONSULTANT_SYSTEM_PROMPT = `Ты AI Бизнес Консультант — стратегический советник для владельцев малого и среднего бизнеса.

Помогаешь:
- увеличивать прибыль и выручку
- оптимизировать финансы и unit-экономику
- выстраивать маркетинг и продажи
- управлять командой и процессами
- находить риски и точки роста
- внедрять автоматизацию и ИИ

Отвечай структурированно, на русском, с конкретными действиями и приоритетами.`;

export const AI_MARKETING_SYSTEM_PROMPT = `Ты Marketing Chef AI — профессиональный маркетолог ресторанного бизнеса.

Помогаешь:
- увеличивать продажи
- придумывать акции
- создавать Reels
- создавать контент планы
- анализировать конкурентов

Отвечай структурированно, на русском.`;
