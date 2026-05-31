"use client";

import type { ReactNode } from "react";
import CreativeGenerator from "@/components/creative-generator";
import { FILE_TYPE_LABELS, type SupportedFileType } from "@/lib/file-types";
import {
  DOCUMENT_TYPE_LABELS,
  type ConsultantMode,
  type DocumentAnalysis,
} from "@/types/pdf";

type DocumentAnalysisResultsProps = {
  fileName: string;
  fileType: SupportedFileType;
  analysis: DocumentAnalysis;
  consultantMode: ConsultantMode;
  documentId: string | null;
  saveWarning: string | null;
  sourceImageBase64?: string;
  onTalkWithDocument: () => void;
};

function SectionHeader({
  icon,
  title,
  subtitle,
  delayClass,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  delayClass?: string;
}) {
  return (
    <div className={`${delayClass ?? ""} mb-5 flex items-start gap-3`}>
      <span className="inline-flex shrink-0 rounded-xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/10 p-2.5 text-[#8B5CF6]">
        {icon}
      </span>
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function BulletList({
  items,
  variant,
}: {
  items: string[];
  variant: "positive" | "negative" | "neutral" | "warning";
}) {
  const dotClass =
    variant === "positive"
      ? "bg-emerald-400"
      : variant === "negative"
        ? "bg-red-400"
        : variant === "warning"
          ? "bg-amber-400"
          : "bg-[#8B5CF6]";

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li
          key={index}
          className="flex gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-[#8B5CF6]/20 hover:bg-white/[0.04]"
        >
          <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
          <p className="text-sm leading-relaxed text-zinc-300">{item}</p>
        </li>
      ))}
    </ul>
  );
}

function SwotGrid({ swot }: { swot: DocumentAnalysis["swot"] }) {
  const quadrants = [
    { title: "Сильные стороны", items: swot.strengths, variant: "positive" as const },
    { title: "Слабые стороны", items: swot.weaknesses, variant: "negative" as const },
    { title: "Возможности", items: swot.opportunities, variant: "positive" as const },
    { title: "Угрозы", items: swot.threats, variant: "warning" as const },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {quadrants.map((q) => (
        <div
          key={q.title}
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
        >
          <h4 className="mb-3 text-sm font-semibold text-white">{q.title}</h4>
          <BulletList items={q.items} variant={q.variant} />
        </div>
      ))}
    </div>
  );
}

function ActionPlanSections({ plan }: { plan: DocumentAnalysis["actionPlan"] }) {
  const phases = [
    { title: "7 дней", items: plan.days7 },
    { title: "30 дней", items: plan.days30 },
    { title: "90 дней", items: plan.days90 },
  ];

  return (
    <div className="space-y-6">
      {phases.map((phase) => (
        <div key={phase.title}>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#8B5CF6]">
            {phase.title}
          </h4>
          <BulletList items={phase.items} variant="neutral" />
        </div>
      ))}
    </div>
  );
}

const DocIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);

export default function DocumentAnalysisResults({
  fileName,
  fileType,
  analysis,
  documentId,
  saveWarning,
  sourceImageBase64,
  onTalkWithDocument,
}: DocumentAnalysisResultsProps) {
  const documentLabel = DOCUMENT_TYPE_LABELS[analysis.documentType];
  const formatLabel = FILE_TYPE_LABELS[fileType];

  const sections: {
    title: string;
    subtitle?: string;
    content: ReactNode;
    border?: string;
    delay?: string;
  }[] = [
    {
      title: "1. Краткое резюме",
      content: (
        <p className="text-base leading-relaxed text-zinc-200 whitespace-pre-line">
          {analysis.summary}
        </p>
      ),
      delay: "animate-fade-up-delay-1",
    },
    {
      title: "2. Основные выводы",
      content: <BulletList items={analysis.keyFindings} variant="neutral" />,
      delay: "animate-fade-up-delay-2",
    },
    {
      title: "3. SWOT-анализ",
      subtitle: "Сильные и слабые стороны, возможности и угрозы",
      content: <SwotGrid swot={analysis.swot} />,
    },
    {
      title: "4. Рекомендации",
      content: <BulletList items={analysis.recommendations} variant="positive" />,
    },
    {
      title: "5. План действий",
      subtitle: "7 дней · 30 дней · 90 дней",
      content: <ActionPlanSections plan={analysis.actionPlan} />,
    },
    {
      title: "6. Возможности увеличения прибыли",
      content: (
        <BulletList items={analysis.profitGrowthOpportunities} variant="positive" />
      ),
      border: "border-[#8B5CF6]/15",
    },
    {
      title: "7. Идеи автоматизации через ИИ",
      content: <BulletList items={analysis.automationIdeas} variant="neutral" />,
    },
    {
      title: "8. Маркетинговые идеи",
      content: (
        <BulletList items={analysis.marketingRecommendations} variant="neutral" />
      ),
    },
  ];

  return (
    <section className="space-y-6">
      <div className="animate-fade-up card-shine rounded-2xl border border-[#8B5CF6]/20 bg-white/[0.03] p-6 backdrop-blur-sm md:p-8">
        <p className="text-sm font-medium uppercase tracking-widest text-[#8B5CF6]">
          Анализ завершён
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
          {fileName}
        </h2>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-4 py-1.5 text-sm font-medium text-[#8B5CF6]">
            {documentLabel}
          </span>
          <span className="inline-flex items-center rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-1.5 text-sm text-zinc-300">
            {formatLabel}
          </span>
        </div>

        {saveWarning && (
          <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            Документ проанализирован, но не сохранён в Supabase: {saveWarning}. Выполните
            SQL из{" "}
            <code className="text-xs">supabase/apply_all.sql</code> в Supabase SQL Editor
            (см. <code className="text-xs">supabase/README.md</code>)
          </p>
        )}
      </div>

      {sections.map((section) => (
        <div
          key={section.title}
          className={`card-shine rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm md:p-8 ${section.border ?? ""} ${section.delay ?? ""}`}
        >
          <SectionHeader icon={<DocIcon />} title={section.title} subtitle={section.subtitle} />
          {section.content}
        </div>
      ))}

      <CreativeGenerator
        context={{
          sourceType: "document",
          fileName,
          documentType: analysis.documentType,
          summary: analysis.summary,
          keyFindings: analysis.keyFindings,
          marketingRecommendations: analysis.marketingRecommendations,
        }}
        sourceImageBase64={sourceImageBase64}
        documentId={documentId ?? undefined}
      />

      <div className="card-shine rounded-2xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/[0.04] p-6 backdrop-blur-sm md:p-8">
        <SectionHeader
          icon={<DocIcon />}
          title="9. Поговорить с документом"
          subtitle="Задайте вопросы по содержимому — ИИ использует документ и анализ как контекст"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onTalkWithDocument}
            disabled={!documentId}
            className="inline-flex items-center gap-2 rounded-full bg-[#8B5CF6] px-5 py-2.5 text-sm font-medium text-white shadow-[0_0_30px_rgba(139,92,246,0.25)] transition-all hover:bg-[#7C3AED] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
            Поговорить с документом
          </button>
          {!documentId && (
            <span className="text-sm text-zinc-400">
              {saveWarning
                ? "Чат недоступен без сохранения документа в Supabase"
                : "Сохраните документ в Supabase для чата"}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
