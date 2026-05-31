"use client";

import { BottomNav } from "@/components/bottom-nav";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  Calendar,
  DollarSign,
  Film,
  Flame,
  Lightbulb,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "@/components/ui/icon";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ConsultantMode } from "@/types/pdf";
import { CONSULTANT_MODE_LABELS } from "@/types/pdf";

const MARKETING_QUICK_ACTIONS = [
  {
    label: "Поднять продажи",
    prompt: "Как увеличить продажи в моём ресторане? Дай конкретные рекомендации.",
    icon: "flame" as const,
  },
  {
    label: "Создать Reels",
    prompt: "Придумай идеи для Reels для моего ресторана на сегодня.",
    icon: "film" as const,
  },
  {
    label: "Контент план на неделю",
    prompt: "Создай контент план на неделю для моего ресторана.",
    icon: "calendar" as const,
  },
  {
    label: "Придумать акцию",
    prompt: "Придумай акцию для моего ресторана с доставкой еды.",
    icon: "lightbulb" as const,
  },
  {
    label: "Анализ конкурентов",
    prompt: "Проведи анализ конкурентов в ресторанном сегменте и дай рекомендации.",
    icon: "trending" as const,
  },
  {
    label: "Маркетинговая стратегия",
    prompt: "Разработай маркетинговую стратегию для моего ресторана на ближайший месяц.",
    icon: "star" as const,
  },
] as const;

const BUSINESS_QUICK_ACTIONS = [
  {
    label: "Unit-экономика",
    prompt: "Разбери unit-экономику моего бизнеса и предложи, что улучшить в первую очередь.",
    icon: "chart" as const,
  },
  {
    label: "Рост прибыли",
    prompt: "Дай план роста прибыли на 90 дней с конкретными шагами и метриками.",
    icon: "dollar" as const,
  },
  {
    label: "SWOT",
    prompt: "Сделай SWOT-анализ моего бизнеса и предложи стратегию на квартал.",
    icon: "trending" as const,
  },
  {
    label: "Команда",
    prompt: "Какие роли и процессы в команде нужно усилить для масштабирования?",
    icon: "users" as const,
  },
  {
    label: "Автоматизация",
    prompt: "Какие процессы стоит автоматизировать через ИИ в первую очередь?",
    icon: "bot" as const,
  },
  {
    label: "Риски",
    prompt: "Какие главные финансовые и операционные риски я могу недооценивать?",
    icon: "alert" as const,
  },
] as const;

const ACTION_ICONS = {
  flame: Flame,
  film: Film,
  calendar: Calendar,
  lightbulb: Lightbulb,
  trending: TrendingUp,
  star: Star,
  chart: BarChart3,
  dollar: DollarSign,
  users: Users,
  bot: Bot,
  alert: AlertTriangle,
} as const;

const MARKETING_EXAMPLES = [
  "Как увеличить продажи донеров?",
  "Какие Reels снять сегодня?",
  "Придумай акцию для доставки еды.",
  "Что сейчас работает в ресторанном маркетинге?",
  "Создай контент план на неделю.",
] as const;

const BUSINESS_EXAMPLES = [
  "Как увеличить маржинальность без потери качества?",
  "Какие KPI отслеживать владельцу каждую неделю?",
  "Составь план сокращения расходов на 15%.",
  "Как выйти на новый сегмент клиентов?",
  "Что проверить перед масштабированием сети?",
] as const;

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Chat = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <Image src="/logo.svg" alt="Marketing Chef AI" width={32} height={32} priority />
      <span className="text-sm font-semibold tracking-tight text-white">
        Marketing Chef{" "}
        <span className="text-[#8B5CF6]">AI</span>
      </span>
    </div>
  );
}

function formatChatTitle(text: string) {
  const trimmed = text.trim();
  if (trimmed.length <= 32) return trimmed;
  return `${trimmed.slice(0, 32)}…`;
}

export default function AiChat() {
  const [mode, setMode] = useState<ConsultantMode>("marketing");
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null;
  const isEmpty = !activeChat || activeChat.messages.length === 0;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages, isTyping, scrollToBottom]);

  const handleNewChat = () => {
    const newChat: Chat = {
      id: createId(),
      title: "Новый чат",
      messages: [],
      createdAt: Date.now(),
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setInput("");
  };

  const handleSend = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || isTyping) return;

    let chatId = activeChatId;
    const currentChat = chats.find((chat) => chat.id === chatId) ?? null;

    if (!chatId) {
      const newChat: Chat = {
        id: createId(),
        title: formatChatTitle(text),
        messages: [],
        createdAt: Date.now(),
      };
      setChats((prev) => [newChat, ...prev]);
      chatId = newChat.id;
      setActiveChatId(chatId);
    }

    const userMessage: Message = {
      id: createId(),
      role: "user",
      content: text,
    };

    const historyForApi = [...(currentChat?.messages ?? []), userMessage].map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== chatId) return chat;
        return {
          ...chat,
          title: chat.messages.length === 0 ? formatChatTitle(text) : chat.title,
          messages: [...chat.messages, userMessage],
        };
      }),
    );

    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyForApi, mode }),
      });

      const data = (await response.json()) as { content?: string; error?: string };

      const assistantContent = response.ok
        ? (data.content ?? "Не удалось получить ответ.")
        : (data.error ?? "Произошла ошибка. Попробуйте ещё раз.");

      const assistantMessage: Message = {
        id: createId(),
        role: "assistant",
        content: assistantContent,
      };

      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id !== chatId) return chat;
          return {
            ...chat,
            messages: [...chat.messages, assistantMessage],
          };
        }),
      );
    } catch {
      const errorMessage: Message = {
        id: createId(),
        role: "assistant",
        content: "Не удалось связаться с сервером. Проверьте подключение и попробуйте снова.",
      };

      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id !== chatId) return chat;
          return {
            ...chat,
            messages: [...chat.messages, errorMessage],
          };
        }),
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handlePromptSelect = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="premium-bg relative flex h-screen flex-col overflow-hidden pb-nav-safe md:pb-0">
      <div className="premium-orb premium-orb-1 opacity-50" />
      <div className="premium-orb premium-orb-2 opacity-50" />

      <header className="relative z-10 flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-3 lg:px-6">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="flex items-center gap-2 text-sm md:gap-3">
          <div className="flex gap-1 md:hidden">
            {(["marketing", "business"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-lg px-2 py-1 text-xs ${
                  mode === m ? "bg-[#8B5CF6]/20 text-[#8B5CF6]" : "text-zinc-500"
                }`}
              >
                {m === "business" ? "Бизнес" : "Маркетинг"}
              </button>
            ))}
          </div>
          <Link
            href="/analyze-pdf"
            className="rounded-lg px-3 py-1.5 text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            AI Document Analyzer
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg px-3 py-1.5 text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            Dashboard
          </Link>
          <Link
            href="/"
            className="rounded-lg px-3 py-1.5 text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            На главную
          </Link>
        </nav>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-sm md:flex lg:w-72">
          <div className="space-y-3 p-3">
            <div className="grid grid-cols-1 gap-2">
              {(["marketing", "business"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-lg border px-3 py-2 text-left text-xs transition-all ${
                    mode === m
                      ? "border-[#8B5CF6]/40 bg-[#8B5CF6]/10 text-[#8B5CF6]"
                      : "border-white/[0.08] text-zinc-400 hover:text-white"
                  }`}
                >
                  {CONSULTANT_MODE_LABELS[m]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleNewChat}
              className="flex w-full items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-sm font-medium text-zinc-200 transition-all hover:border-white/[0.14] hover:bg-white/[0.06]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Новый чат
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {chats.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-zinc-600">История пуста</p>
            ) : (
              <ul className="space-y-0.5">
                {chats.map((chat) => (
                  <li key={chat.id}>
                    <button
                      type="button"
                      onClick={() => setActiveChatId(chat.id)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-all ${
                        activeChatId === chat.id
                          ? "bg-white/[0.08] text-white"
                          : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                      }`}
                    >
                      <span className="line-clamp-1">{chat.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto">
            {isEmpty ? (
              <div className="flex min-h-full flex-col items-center justify-center px-4 py-10">
                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/10">
                  <svg
                    className="h-8 w-8 text-[#8B5CF6]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                    />
                  </svg>
                </div>

                <h1 className="text-center text-2xl font-semibold tracking-tight text-white md:text-3xl">
                  {mode === "business"
                    ? "AI Бизнес Консультант"
                    : "Чем могу помочь с маркетингом?"}
                </h1>
                <p className="mt-2 max-w-md text-center text-sm text-zinc-500">
                  {mode === "business"
                    ? "Стратегия, финансы, рост прибыли, риски и автоматизация"
                    : "AI-маркетолог для ресторанов — стратегии, контент, акции и анализ конкурентов"}
                </p>

                <div className="mt-10 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                  {(mode === "business" ? BUSINESS_EXAMPLES : MARKETING_EXAMPLES).map((prompt, index) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handlePromptSelect(prompt)}
                      className="prompt-card group rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-4 text-left"
                      style={{ animationDelay: `${index * 60}ms` }}
                    >
                      <p className="text-sm leading-relaxed text-zinc-300 transition-colors group-hover:text-white">
                        {prompt}
                      </p>
                      <svg
                        className="mt-3 h-4 w-4 text-zinc-600 transition-all group-hover:translate-x-0.5 group-hover:text-[#8B5CF6]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 lg:px-6">
                {activeChat!.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#8B5CF6]/25 bg-[#8B5CF6]/10">
                        <svg
                          className="h-4 w-4 text-[#8B5CF6]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
                          />
                        </svg>
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                        message.role === "user"
                          ? "bg-white/[0.08] text-white"
                          : "border border-white/[0.06] bg-white/[0.03] text-zinc-200"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#8B5CF6]/25 bg-[#8B5CF6]/10">
                      <svg
                        className="h-4 w-4 text-[#8B5CF6]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
                        />
                      </svg>
                    </div>
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                      <div className="flex gap-1.5">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:0ms]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:150ms]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="shrink-0 px-4 pb-6 pt-2 lg:px-6">
            <div className="mx-auto max-w-3xl">
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {(mode === "business" ? BUSINESS_QUICK_ACTIONS : MARKETING_QUICK_ACTIONS).map((action) => {
                  const Icon = ACTION_ICONS[action.icon];
                  return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => handlePromptSelect(action.prompt)}
                    className="quick-action-chip flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-[#A1A1AA] whitespace-nowrap hover:text-white"
                  >
                    <Icon size={12} className="text-[#8B5CF6]" />
                    {action.label}
                  </button>
                  );
                })}
              </div>

              <div className="chat-input-shell flex items-end gap-2 rounded-3xl border border-white/[0.08] bg-[#141414] p-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    mode === "business"
                      ? "Спросите бизнес-консультанта..."
                      : "Спросите AI-маркетолога..."
                  }
                  rows={1}
                  className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8B5CF6] text-white transition-all hover:bg-[#7C3AED] disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Отправить"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                  </svg>
                </button>
              </div>

              <p className="mt-2 text-center text-xs text-zinc-600">
                AI может ошибаться. Проверяйте важные маркетинговые решения.
              </p>
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
