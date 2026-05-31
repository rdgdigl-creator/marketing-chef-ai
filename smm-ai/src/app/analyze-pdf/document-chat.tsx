"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ConsultantMode } from "@/types/pdf";
import { CONSULTANT_MODE_LABELS } from "@/types/pdf";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type DocumentChatProps = {
  documentId: string;
  fileName: string;
  consultantMode: ConsultantMode;
  onClose: () => void;
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const SUGGESTED_QUESTIONS = [
  "Какие главные риски в этом документе?",
  "Что сделать в первую очередь для роста прибыли?",
  "Какие цифры и метрики здесь самые важные?",
  "Сформулируй план на ближайшую неделю по документу",
];

export default function DocumentChat({
  documentId,
  fileName,
  consultantMode,
  onClose,
}: DocumentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const handleSend = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || isTyping) return;

    const userMessage: Message = { id: createId(), role: "user", content: text };
    const historyForApi = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setError(null);
    setIsTyping(true);

    try {
      const response = await fetch(`/api/documents/${documentId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyForApi }),
      });

      const data = (await response.json()) as { content?: string; error?: string };

      const assistantContent = response.ok
        ? (data.content ?? "Не удалось получить ответ.")
        : (data.error ?? "Произошла ошибка.");

      setMessages((prev) => [
        ...prev,
        { id: createId(), role: "assistant", content: assistantContent },
      ]);

      if (!response.ok) setError(assistantContent);
    } catch {
      const errText = "Не удалось связаться с сервером.";
      setError(errText);
      setMessages((prev) => [
        ...prev,
        { id: createId(), role: "assistant", content: errText },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
      <div className="flex h-[min(90vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/[0.1] bg-[#111] shadow-2xl">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/[0.08] px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-widest text-[#8B5CF6]">
              Поговорить с документом
            </p>
            <h3 className="mt-1 truncate text-lg font-semibold text-white">{fileName}</h3>
            <p className="mt-1 text-xs text-zinc-500">
              {CONSULTANT_MODE_LABELS[consultantMode]} · RAG по тексту и анализу
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-white/[0.1] px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            Закрыть
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                Задайте вопрос по документу — ответ строится на сохранённом тексте и
                результатах анализа (RAG).
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSend(q)}
                    className="rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-[#8B5CF6]/30 hover:text-white"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                      message.role === "user"
                        ? "bg-[#8B5CF6]/20 text-white"
                        : "border border-white/[0.08] bg-white/[0.03] text-zinc-200"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-1.5 px-2">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:300ms]" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {error && (
          <p className="shrink-0 px-5 text-xs text-red-400">{error}</p>
        )}

        <footer className="shrink-0 border-t border-white/[0.08] p-4">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Спросите что-то по документу…"
              rows={2}
              className="min-h-[44px] flex-1 resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-[#8B5CF6]/40"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8B5CF6] text-white disabled:opacity-40"
              aria-label="Отправить"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
              </svg>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
