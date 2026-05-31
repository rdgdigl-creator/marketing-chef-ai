"use client";

import { useRef, useState } from "react";
import {
  ACCEPT_FILE_TYPES,
  detectFileType,
  FILE_TYPE_LABELS,
  type SupportedFileType,
} from "@/lib/file-types";
import type { ConsultantMode, DocumentAnalysis } from "@/types/pdf";
import { CONSULTANT_MODE_LABELS } from "@/types/pdf";
import DocumentChat from "./document-chat";
import DocumentAnalysisResults from "./pdf-analysis-results";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Не удалось прочитать файл"));
      }
    };
    reader.onerror = () => reject(new Error("Ошибка чтения файла"));
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

type AnalysisResult = {
  fileName: string;
  fileType: SupportedFileType;
  analysis: DocumentAnalysis;
  consultantMode: ConsultantMode;
  documentId: string | null;
  saveWarning: string | null;
  sourceImageBase64?: string;
};

export default function AnalyzeDocumentForm() {
  const [file, setFile] = useState<File | null>(null);
  const [detectedType, setDetectedType] = useState<SupportedFileType | null>(null);
  const [consultantMode, setConsultantMode] = useState<ConsultantMode>("business");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    const type = detectFileType(selected.name, selected.type);

    if (!type) {
      setError(
        "Неподдерживаемый формат. Допустимы: PDF, DOCX, XLSX, PPTX, CSV, TXT, MD, JPG, PNG",
      );
      return;
    }

    if (selected.size > MAX_FILE_BYTES) {
      setError("Размер файла не должен превышать 10 МБ");
      return;
    }

    setFile(selected);
    setDetectedType(type);
    setResult(null);
    setError(null);
    setChatOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file || !detectedType) {
      setError("Загрузите документ");
      return;
    }

    setError(null);
    setIsLoading(true);
    setResult(null);
    setChatOpen(false);

    try {
      const fileBase64 = await fileToBase64(file);

      const response = await fetch("/api/analyze-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64,
          fileName: file.name,
          mimeType: file.type,
          consultantMode,
          saveToDatabase: true,
        }),
      });

      const data = (await response.json()) as {
        analysis?: DocumentAnalysis;
        fileName?: string;
        fileType?: SupportedFileType;
        consultantMode?: ConsultantMode;
        documentId?: string | null;
        saveWarning?: string | null;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Не удалось проанализировать документ");
      }

      if (!data.analysis) {
        throw new Error("Пустой ответ от сервера");
      }

      const isImage = detectedType === "jpg" || detectedType === "png";

      setResult({
        fileName: data.fileName ?? file.name,
        fileType: data.fileType ?? detectedType,
        analysis: data.analysis,
        consultantMode: data.consultantMode ?? consultantMode,
        documentId: data.documentId ?? null,
        saveWarning: data.saveWarning ?? null,
        sourceImageBase64: isImage ? fileBase64 : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card-shine rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm md:p-8">
          <p className="text-sm font-medium text-zinc-300">Режим анализа</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(["marketing", "business"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setConsultantMode(mode)}
                disabled={isLoading}
                className={`rounded-xl border px-4 py-4 text-left transition-all ${
                  consultantMode === mode
                    ? "border-[#8B5CF6]/50 bg-[#8B5CF6]/10"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14]"
                }`}
              >
                <p
                  className={`text-sm font-semibold ${
                    consultantMode === mode ? "text-[#8B5CF6]" : "text-white"
                  }`}
                >
                  {CONSULTANT_MODE_LABELS[mode]}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {mode === "business"
                    ? "Стратегия, финансы, риски, план роста"
                    : "Маркетинг ресторана и HoReCa"}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="card-shine rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm md:p-8">
          <label htmlFor="document-file" className="block text-sm font-medium text-zinc-300">
            Документ
          </label>

          <input
            ref={fileInputRef}
            id="document-file"
            type="file"
            accept={ACCEPT_FILE_TYPES}
            onChange={handleFileChange}
            disabled={isLoading}
            className="sr-only"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="mt-4 flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-10 transition-all hover:border-[#8B5CF6]/40 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {file ? (
              <>
                <span className="inline-flex rounded-xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/10 p-3 text-[#8B5CF6]">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                </span>
                <span className="text-sm font-medium text-white">{file.name}</span>
                <span className="text-xs text-zinc-500">
                  {detectedType ? FILE_TYPE_LABELS[detectedType] : "Файл"} ·{" "}
                  {formatFileSize(file.size)} — нажмите, чтобы заменить
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex rounded-xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/10 p-3 text-[#8B5CF6]">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-18 0v9.75A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-9.75A2.25 2.25 0 0 1 5.25 9h4.5a2.25 2.25 0 0 1 2.25 2.25v.75" />
                  </svg>
                </span>
                <span className="text-sm font-medium text-white">Нажмите, чтобы загрузить документ</span>
                <span className="text-center text-xs text-zinc-500">
                  PDF · DOCX · XLSX · PPTX · CSV · TXT · MD · JPG · PNG — до 10 МБ
                </span>
              </>
            )}
          </button>
        </div>

        {error && (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading || !file}
          className="group relative inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#8B5CF6] px-8 text-sm font-medium text-white shadow-[0_0_40px_rgba(139,92,246,0.3)] transition-all hover:bg-[#7C3AED] hover:shadow-[0_0_60px_rgba(139,92,246,0.4)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isLoading ? (
            <>
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647Z" />
              </svg>
              Анализируем документ…
            </>
          ) : (
            "Анализировать документ"
          )}
        </button>
      </form>

      {isLoading && (
        <div className="animate-fade-up card-shine rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 animate-ping rounded-full bg-[#8B5CF6]/20" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10">
                <svg className="h-7 w-7 animate-pulse text-[#8B5CF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-18 0v9.75A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-9.75A2.25 2.25 0 0 1 5.25 9h4.5a2.25 2.25 0 0 1 2.25 2.25v.75" />
                </svg>
              </div>
            </div>
            <div>
              <p className="font-medium text-white">OpenAI анализирует документ</p>
              <p className="mt-1 text-sm text-zinc-400">
                Извлекаем содержимое, формируем резюме, выводы, риски и рекомендации…
              </p>
            </div>
          </div>
        </div>
      )}

      {result && !isLoading && (
        <DocumentAnalysisResults
          fileName={result.fileName}
          fileType={result.fileType}
          analysis={result.analysis}
          consultantMode={result.consultantMode}
          documentId={result.documentId}
          saveWarning={result.saveWarning}
          sourceImageBase64={result.sourceImageBase64}
          onTalkWithDocument={() => setChatOpen(true)}
        />
      )}

      {chatOpen && result?.documentId && (
        <DocumentChat
          documentId={result.documentId}
          fileName={result.fileName}
          consultantMode={result.consultantMode}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}
