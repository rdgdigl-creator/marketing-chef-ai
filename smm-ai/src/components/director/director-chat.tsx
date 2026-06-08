"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight } from "@/components/ui/icon";
import { DIRECTOR_PROMPTS } from "@/lib/navigation";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function DirectorAvatar({ size = 32 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex shrink-0 overflow-hidden rounded-full ring-1 ring-[#8B5CF6]/40"
      style={{ width: size, height: size }}
    >
      <Image
        src="/ai-director.png"
        alt="AI-директор"
        width={size}
        height={size}
        className="h-full w-full object-cover"
      />
    </span>
  );
}

export function DirectorChat() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const promptAppliedRef = useRef(false);

  const isEmpty = messages.length === 0;

  useEffect(() => {
    const prompt = searchParams.get("prompt")?.trim();
    if (!prompt || promptAppliedRef.current) return;
    promptAppliedRef.current = true;
    setInput(prompt);
    textareaRef.current?.focus();
  }, [searchParams]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!isEmpty) {
      scrollToBottom();
    }
  }, [messages, isTyping, isEmpty, scrollToBottom]);

  const handleSend = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || isTyping) return;

    const userMessage: Message = { id: createId(), role: "user", content: text };
    const history = [...messages, userMessage].map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, mode: "marketing" }),
      });

      const data = (await response.json()) as { content?: string; error?: string };
      const content = response.ok
        ? (data.content ?? "Не удалось получить ответ.")
        : (data.error ?? "Произошла ошибка. Попробуйте ещё раз.");

      setMessages((prev) => [...prev, { id: createId(), role: "assistant", content }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "assistant",
          content: "Не удалось связаться с сервером. Проверьте подключение и попробуйте снова.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col">
      {!isEmpty && (
        <div className="mb-4 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && <DirectorAvatar size={32} />}
              <div
                className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "bg-[#8B5CF6]/15 text-white"
                    : "glass-card text-[#E4E4E7]"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <DirectorAvatar size={32} />
              <div className="glass-card rounded-2xl px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#8B5CF6]/70 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#8B5CF6]/70 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#8B5CF6]/70 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      <div className="chat-input-shell flex items-end gap-2 rounded-3xl border border-white/[0.08] bg-[#141414] p-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Что нужно сделать?"
          rows={1}
          className="max-h-40 min-h-[48px] flex-1 resize-none bg-transparent px-4 py-3 text-[15px] text-white outline-none placeholder:text-zinc-500"
        />
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={!input.trim() || isTyping}
          className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8B5CF6] text-white transition-all hover:bg-[#7C3AED] disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Отправить"
        >
          <ArrowRight size={18} />
        </button>
      </div>

      {isEmpty && (
        <div className="mt-5 flex flex-wrap gap-2">
          {DIRECTOR_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(prompt)}
              className="quick-action-chip rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-sm text-[#A1A1AA] hover:text-white"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <p className="mt-4 text-center text-xs text-zinc-600">
        AI-директор может ошибаться. Проверяйте важные маркетинговые решения.
      </p>
    </div>
  );
}
