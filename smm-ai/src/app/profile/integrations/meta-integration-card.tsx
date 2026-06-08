"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DemoModeBanner } from "@/components/demo-mode-banner";
import {
  ErrorBanner,
  PrimaryButton,
  SecondaryButton,
  SuccessBanner,
} from "@/components/page-shell";
import { ExternalLink, Plug, Target } from "@/components/ui/icon";
import type { MetaAdAccountRow } from "@/lib/meta/types";

type MetaIntegrationCardProps = {
  mockMode: boolean;
  oauthAvailable: boolean;
  dataSource: "oauth" | "mock";
  connected: boolean;
  metaUserName: string | null;
  syncStatus: string | null;
  lastSyncAt: string | null;
  errorMessage: string | null;
  selectedAdAccountId: string | null;
  selectedAdAccountName: string | null;
  adAccounts: MetaAdAccountRow[];
  oauthSuccess?: boolean;
  oauthError?: string | null;
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({
  connected,
  isDemo,
}: {
  connected: boolean;
  isDemo: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
        connected
          ? isDemo
            ? "border-amber-500/30 bg-amber-500/[0.08] text-amber-300"
            : "border-[#1877F2]/30 bg-[#1877F2]/[0.08] text-[#60A5FA]"
          : "border-white/10 bg-white/[0.04] text-[#A1A1AA]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          connected ? (isDemo ? "bg-amber-400" : "bg-[#60A5FA]") : "bg-[#A1A1AA]"
        }`}
      />
      {connected ? (isDemo ? "Демо подключено" : "Подключено") : "Не подключено"}
    </span>
  );
}

export function MetaIntegrationCard({
  mockMode,
  oauthAvailable,
  dataSource,
  connected,
  metaUserName,
  syncStatus,
  lastSyncAt,
  errorMessage,
  selectedAdAccountId,
  selectedAdAccountName,
  adAccounts,
  oauthSuccess,
  oauthError,
}: MetaIntegrationCardProps) {
  const router = useRouter();
  const isDemo = dataSource === "mock" && connected;

  const [pending, setPending] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selectedId, setSelectedId] = useState(
    selectedAdAccountId ?? adAccounts.find((a) => a.is_selected)?.meta_account_id ?? "",
  );
  const [actionError, setActionError] = useState<string | null>(oauthError ?? null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(
    oauthSuccess ? "Meta Ads успешно подключён" : null,
  );

  const handleOAuthConnect = () => {
    window.location.href = "/api/meta/oauth/start";
  };

  const handleDemoConnect = async () => {
    setConnecting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch("/api/meta/mock/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setActionError(data.error ?? "Не удалось подключить демо");
        return;
      }
      setActionSuccess(data.message ?? "Демо-кабинет подключён");
      router.refresh();
    } catch {
      setActionError("Сетевая ошибка");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setPending(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const endpoints = isDemo
        ? ["/api/meta/mock/disconnect"]
        : ["/api/meta/disconnect", "/api/meta/mock/disconnect"];

      for (const url of endpoints) {
        await fetch(url, { method: "POST" });
      }
      setActionSuccess(isDemo ? "Демо-кабинет отключён" : "Meta Ads отключён");
      router.refresh();
    } catch {
      setActionError("Сетевая ошибка при отключении");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="glass-card card-shine rounded-2xl p-6 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="inline-flex rounded-xl border border-[#1877F2]/15 bg-[#1877F2]/[0.06] p-3 text-[#60A5FA]">
            <Target size={22} />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white">Meta Ads</h2>
            <p className="mt-1 text-sm text-[#A1A1AA]">
              Рекламные кабинеты Facebook и Instagram — аудит AI-таргетолога.
            </p>
          </div>
        </div>
        <StatusBadge connected={connected} isDemo={isDemo} />
      </div>

      {mockMode && (
        <div className="mt-6">
          <DemoModeBanner
            description={
              oauthAvailable
                ? "Meta App настроен, но можно работать с демо-кабинетом параллельно."
                : "Meta App в процессе создания. Используйте демо-кабинет — после OAuth архитектура не изменится."
            }
          />
        </div>
      )}

      {connected ? (
        <>
          <dl className="mt-6 space-y-3 border-t border-white/[0.06] pt-6 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[#A1A1AA]">Источник</dt>
              <dd className="text-white">{isDemo ? "Mock provider" : "Meta OAuth"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[#A1A1AA]">Аккаунт Meta</dt>
              <dd className="text-white">{metaUserName ?? "—"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[#A1A1AA]">Рекламный кабинет</dt>
              <dd className="text-right text-white">{selectedAdAccountName ?? "—"}</dd>
            </div>
            {syncStatus && (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#A1A1AA]">Статус</dt>
                <dd className="text-white">{syncStatus}</dd>
              </div>
            )}
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[#A1A1AA]">Последняя синхронизация</dt>
              <dd className="text-white">{formatDateTime(lastSyncAt)}</dd>
            </div>
          </dl>

          {errorMessage && (
            <div className="mt-6">
              <ErrorBanner message={errorMessage} />
            </div>
          )}

          {actionError && (
            <div className="mt-6">
              <ErrorBanner message={actionError} />
            </div>
          )}
          {actionSuccess && (
            <div className="mt-6">
              <SuccessBanner message={actionSuccess} />
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/media-buyer"
              className="btn-primary inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium text-white"
            >
              Открыть Media Buyer
            </Link>
            <SecondaryButton onClick={handleDisconnect} disabled={pending}>
              {pending ? "Отключение…" : isDemo ? "Отключить демо" : "Отключить"}
            </SecondaryButton>
          </div>
        </>
      ) : (
        <div className="mt-6 space-y-5 border-t border-white/[0.06] pt-6">
          {mockMode ? (
            <p className="text-sm text-[#A1A1AA]">
              Подключите демо-кабинет ресторана с типичными ошибками таргетинга — Media Buyer
              Agent проведёт полный аудит без OAuth.
            </p>
          ) : (
            <p className="text-sm text-[#A1A1AA]">
              Подключите Meta Ads через Facebook Login. AI-таргетолог получит доступ только на
              чтение.
            </p>
          )}

          {actionError && <ErrorBanner message={actionError} />}
          {actionSuccess && <SuccessBanner message={actionSuccess} />}

          <div className="flex flex-wrap gap-3">
            {mockMode && (
              <PrimaryButton onClick={handleDemoConnect} disabled={connecting}>
                <Plug size={16} />
                {connecting ? "Подключение…" : "Подключить демо-кабинет"}
              </PrimaryButton>
            )}
            {oauthAvailable && (
              <PrimaryButton onClick={handleOAuthConnect}>
                <Plug size={16} />
                Подключить через Meta OAuth
              </PrimaryButton>
            )}
            <a
              href="https://developers.facebook.com/docs/marketing-api/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium"
            >
              <ExternalLink size={16} />
              Документация Meta API
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
