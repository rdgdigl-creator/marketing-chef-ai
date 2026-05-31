import type { Metadata } from "next";
import PageShell from "@/components/page-shell";
import AnalyzeDocumentForm from "./analyze-pdf-form";

export const metadata: Metadata = {
  title: "Анализ документов — Marketing Chef AI",
  description: "Анализ PDF, Word, Excel и PowerPoint для ресторанного бизнеса",
};

export default function AnalyzeDocumentPage() {
  return (
    <PageShell
      activeFeature="/analyze-pdf"
      badge="Анализ документов"
      title="Анализ документов для ресторанов"
      subtitle="Загрузите PDF, DOCX, XLSX или PPTX — AI проанализирует меню, отчёты и маркетинговые материалы с точки зрения ресторанного бизнеса."
    >
      <AnalyzeDocumentForm />
    </PageShell>
  );
}
