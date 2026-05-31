"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PageShell, {
  ErrorBanner,
  InputField,
  LoadingSpinner,
  PrimaryButton,
  ResultCard,
  SecondaryButton,
  SuccessBanner,
} from "@/components/page-shell";
import {
  BarChart3,
  Calendar,
  Lightbulb,
  MessageCircle,
  Search,
  Tag,
  TrendingUp,
} from "@/components/ui/icon";
import type { ComponentType } from "react";
import {
  loadMarketerSessions,
  saveMarketerSession,
  updateMarketerSession,
} from "@/lib/feature-modules";
import type {
  AiMarketerSession,
  ChatMessage,
  MarketerGenerateResult,
  MarketerModuleType,
} from "@/types/features";

const MODULES: {
  id: MarketerModuleType;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}[] = [
  { id: "chat", label: "Консультант", icon: MessageCircle },
  { id: "strategy", label: "Стратегия", icon: TrendingUp },
  { id: "promotions", label: "Акции", icon: Tag },
  { id: "content_ideas", label: "Контент", icon: Lightbulb },
  { id: "content_plan", label: "Контент-план", icon: Calendar },
  { id: "competitor_analysis", label: "Конкуренты", icon: Search },
  { id: "business_analysis", label: "Анализ бизнеса", icon: BarChart3 },
];

const QUICK_PROMPTS = [
  "Как увеличить продажи в моём ресторане?",
  "Придумай акцию для доставки еды",
  "Разработай маркетинговую стратегию на месяц",
  "Какие Reels снять на этой неделе?",
  "Создай контент-план на 7 дней",
  "Проанализируй мою рекламу и предложи улучшения",
];

export default function MarketerDashboard() {
  const [activeModule, setActiveModule] = useState<MarketerModuleType>("chat");
  const [restaurantName, setRestaurantName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [niche, setNiche] = useState("");
  const [city, setCity] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [generateResult, setGenerateResult] = useState<MarketerGenerateResult | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<AiMarketerSession[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    loadMarketerSessions().then(setHistory);
  }, []);

  useEffect(() => {
    if (activeModule === "chat") scrollToBottom();
  }, [messages, isLoading, activeModule, scrollToBottom]);

  const handleChatSend = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || isLoading) return;

    if (!restaurantName.trim()) {
      setError("Введите название ресторана");
      return;
    }

    setError(null);
    const userMessage: ChatMessage = { role: "user", content: text };
    const historyForApi = [...messages, userMessage];
    setMessages(historyForApi);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyForApi,
          mode: "marketing",
          restaurantName: restaurantName.trim(),
        }),
      });

      const data = (await response.json()) as { content?: string; error?: string };
      const assistantContent = response.ok
        ? (data.content ?? "Не удалось получить ответ.")
        : (data.error ?? "Произошла ошибка.");

      const assistantMessage: ChatMessage = { role: "assistant", content: assistantContent };
      const updatedMessages = [...historyForApi, assistantMessage];
      setMessages(updatedMessages);

      if (savedId) {
        await updateMarketerSession(savedId, { messages: updatedMessages });
      } else {
        const saved = await saveMarketerSession({
          restaurantName: restaurantName.trim(),
          moduleType: "chat",
          title: text.slice(0, 40),
          messages: updatedMessages,
        });
        if (saved) setSavedId(saved.id);
      }
    } catch {
      setError("Не удалось связаться с сервером");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!restaurantName.trim()) {
      setError("Введите название ресторана");
      return;
    }

    if (activeModule === "competitor_analysis" && (!niche.trim() || !city.trim())) {
      setError("Укажите нишу и город");
      return;
    }

    setError(null);
    setIsLoading(true);
    setGenerateResult(null);

    try {
      const response = await fetch("/api/marketer-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleType: activeModule,
          restaurantName: restaurantName.trim(),
          description: businessDescription.trim(),
          niche: niche.trim(),
          city: city.trim(),
        }),
      });

      const data = (await response.json()) as { result?: MarketerGenerateResult; error?: string };

      if (!response.ok) {
        setError(data.error ?? "Ошибка генерации");
        return;
      }

      setGenerateResult(data.result ?? null);

      const saved = await saveMarketerSession({
        restaurantName: restaurantName.trim(),
        moduleType: activeModule,
        title: MODULES.find((m) => m.id === activeModule)?.label ?? activeModule,
        messages: [],
        result: (data.result as Record<string, unknown>) ?? null,
      });

      if (saved) {
        setSavedId(saved.id);
        setSaveMessage("Сохранено");
        loadMarketerSessions().then(setHistory);
      }
    } catch {
      setError("Не удалось связаться с сервером");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSession = () => {
    setMessages([]);
    setGenerateResult(null);
    setSavedId(null);
    setSaveMessage(null);
    setError(null);
  };

  const loadSession = (session: AiMarketerSession) => {
    setRestaurantName(session.restaurant_name);
    setActiveModule(session.module_type);
    setSavedId(session.id);
    setSaveMessage(null);
    setError(null);

    if (session.module_type === "chat") {
      setMessages(session.messages);
      setGenerateResult(null);
    } else {
      setMessages([]);
      setGenerateResult((session.result as MarketerGenerateResult) ?? null);
    }
  };

  const renderGenerateResult = () => {
    if (!generateResult) return null;

    if (generateResult.strategies) {
      return (
        <div className="space-y-3">
          {generateResult.strategies.map((item, i) => (
            <ResultCard key={i} title={`Стратегия ${i + 1}`} index={i + 1}>
              {item}
            </ResultCard>
          ))}
        </div>
      );
    }

    if (generateResult.promotions) {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {generateResult.promotions.map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#8B5CF6]/15 bg-gradient-to-br from-[#8B5CF6]/10 to-transparent p-5"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8B5CF6]">
                Акция {i + 1}
              </span>
              <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">{item}</p>
            </div>
          ))}
        </div>
      );
    }

    if (generateResult.contentIdeas) {
      return (
        <div className="space-y-3">
          {generateResult.contentIdeas.map((item, i) => (
            <ResultCard key={i} title={`Идея ${i + 1}`} index={i + 1}>
              {item}
            </ResultCard>
          ))}
        </div>
      );
    }

    if (generateResult.contentPlan) {
      return (
        <div className="space-y-4">
          {generateResult.contentPlan.map((day) => (
            <div key={day.day} className="glass-card rounded-2xl p-5">
              <h3 className="font-semibold text-white">День {day.day}</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {(["instagram", "tiktok", "telegram"] as const).map((platform) => (
                  <div key={platform} className="rounded-xl border border-white/[0.06] p-4">
                    <p className="text-xs uppercase tracking-wider text-[#8B5CF6]">{platform}</p>
                    <p className="mt-1 font-medium text-white">{day[platform].title}</p>
                    <p className="mt-2 text-sm text-[#A1A1AA]">{day[platform].content}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (generateResult.competitorAnalysis) {
      const ca = generateResult.competitorAnalysis;
      return (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold text-white">Обзор рынка</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">{ca.summary}</p>
          </div>
          {ca.competitors.map((comp, i) => (
            <div key={i} className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold text-white">{comp.name}</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#06B6D4]">Сильные стороны</p>
                  <ul className="mt-2 space-y-1">
                    {comp.strengths.map((s, j) => (
                      <li key={j} className="text-sm text-[#A1A1AA]">• {s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Слабые стороны</p>
                  <ul className="mt-2 space-y-1">
                    {comp.weaknesses.map((w, j) => (
                      <li key={j} className="text-sm text-[#A1A1AA]">• {w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
          <ResultCard title="Идеи для обхода конкурентов">
            <ul className="space-y-2">
              {ca.outmaneuverIdeas.map((idea, i) => (
                <li key={i}>• {idea}</li>
              ))}
            </ul>
          </ResultCard>
          <ResultCard title="Маркетинговые возможности">
            <ul className="space-y-2">
              {ca.marketingOpportunities.map((opp, i) => (
                <li key={i}>• {opp}</li>
              ))}
            </ul>
          </ResultCard>
        </div>
      );
    }

    if (generateResult.businessAnalysis) {
      const ba = generateResult.businessAnalysis;
      return (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold text-white">Обзор</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">{ba.summary}</p>
          </div>
          {[
            { title: "Сильные стороны", items: ba.strengths },
            { title: "Слабые стороны", items: ba.weaknesses },
            { title: "Возможности", items: ba.opportunities },
            { title: "Рекомендации", items: ba.recommendations },
          ].map((section) => (
            <div key={section.title} className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold text-white">{section.title}</h3>
              <ul className="mt-3 space-y-2">
                {section.items.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-[#A1A1AA]">
                    <span className="text-[#8B5CF6]">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  const showDescription = !["chat", "competitor_analysis"].includes(activeModule);
  const showCompetitorFields = activeModule === "competitor_analysis";

  return (
    <PageShell
      activeFeature="/dashboard"
      badge="AI Маркетолог"
      title="Ваш персональный маркетолог"
      subtitle="Консультант для ресторанов: продажи, акции, контент, анализ конкурентов и маркетинговая стратегия на основе ваших материалов."
    >
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-4">
          <div className="glass-card card-shine rounded-2xl p-4">
            <InputField
              label="Название ресторана"
              value={restaurantName}
              onChange={setRestaurantName}
              placeholder="Например: Doner House"
            />
            {showCompetitorFields && (
              <>
                <div className="mt-4">
                  <InputField
                    label="Ниша"
                    value={niche}
                    onChange={setNiche}
                    placeholder="Например: Донеры"
                  />
                </div>
                <div className="mt-4">
                  <InputField
                    label="Город"
                    value={city}
                    onChange={setCity}
                    placeholder="Например: Астана"
                  />
                </div>
              </>
            )}
            {showDescription && (
              <div className="mt-4">
                <InputField
                  label="Описание бизнеса"
                  value={businessDescription}
                  onChange={setBusinessDescription}
                  placeholder="Кухня, аудитория, особенности..."
                  rows={3}
                />
              </div>
            )}
          </div>

          <div className="glass-card card-shine rounded-2xl p-3">
            <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-[#A1A1AA]">
              Разделы
            </p>
            <div className="space-y-1">
              {MODULES.map((mod) => {
                const Icon = mod.icon;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => {
                      setActiveModule(mod.id);
                      handleNewSession();
                    }}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
                      activeModule === mod.id
                        ? "bg-[#8B5CF6]/15 text-[#8B5CF6]"
                        : "text-[#A1A1AA] hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <Icon size={16} />
                    {mod.label}
                  </button>
                );
              })}
            </div>
          </div>

          {history.length > 0 && (
            <div className="glass-card card-shine rounded-2xl p-3">
              <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-[#A1A1AA]">
                История
              </p>
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {history.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => loadSession(session)}
                    className="w-full rounded-lg px-3 py-2 text-left text-xs text-[#A1A1AA] transition-colors hover:bg-white/[0.04] hover:text-white"
                  >
                    <span className="line-clamp-1">{session.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        <div className="glass-card card-shine flex min-h-[600px] flex-col rounded-2xl backdrop-blur-sm">
          {error && (
            <div className="p-4">
              <ErrorBanner message={error} />
            </div>
          )}
          {saveMessage && (
            <div className="p-4 pb-0">
              <SuccessBanner message={saveMessage} />
            </div>
          )}

          {activeModule === "chat" ? (
            <>
              <div className="flex-1 overflow-y-auto p-6">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center">
                    <p className="mb-6 text-center text-[#A1A1AA]">
                      Спросите AI-маркетолога о вашем ресторане
                    </p>
                    <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
                      {QUICK_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => handleChatSend(prompt)}
                          className="prompt-card rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-left text-sm text-[#A1A1AA]"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto max-w-2xl space-y-4">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                            msg.role === "user"
                              ? "bg-white/[0.08] text-white"
                              : "border border-white/[0.06] bg-white/[0.03] text-[#A1A1AA]"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-1.5 px-4">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-[#A1A1AA]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-[#A1A1AA] [animation-delay:150ms]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-[#A1A1AA] [animation-delay:300ms]" />
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="border-t border-white/[0.06] p-4">
                <div className="chat-input-shell flex items-end gap-2 rounded-3xl border border-white/[0.08] bg-[#141414] p-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleChatSend();
                      }
                    }}
                    placeholder="Спросите AI-маркетолога..."
                    rows={1}
                    className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-[#A1A1AA]/60 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleChatSend()}
                    disabled={!input.trim() || isLoading}
                    className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8B5CF6] text-white transition-all hover:bg-[#7C3AED] disabled:opacity-30"
                  >
                    ↑
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  {MODULES.find((m) => m.id === activeModule)?.label}
                </h2>
                <div className="flex gap-2">
                  <SecondaryButton onClick={handleNewSession}>Новый</SecondaryButton>
                  <PrimaryButton onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? "Генерация…" : "Сгенерировать"}
                  </PrimaryButton>
                </div>
              </div>

              {isLoading ? (
                <LoadingSpinner label="AI готовит результат…" />
              ) : generateResult ? (
                <div className="flex-1 overflow-y-auto">{renderGenerateResult()}</div>
              ) : (
                <div className="flex flex-1 items-center justify-center text-sm text-[#A1A1AA]">
                  Нажмите «Сгенерировать» для получения результата
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
