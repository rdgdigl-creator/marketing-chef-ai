"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ErrorBanner,
  InputField,
  PrimaryButton,
  SecondaryButton,
  SuccessBanner,
} from "@/components/page-shell";
import { Plug, RefreshCw } from "@/components/ui/icon";

type IikoIntegrationCardProps = {
  connected: boolean;
  apiLogin: string | null;
  organizationName: string | null;
  syncStatus: string | null;
  lastSyncAt: string | null;
  errorMessage: string | null;
};

type IikoOrganization = { id: string; name: string };

type ConnectResponse = {
  verified?: boolean;
  organizations?: IikoOrganization[];
  connection?: {
    organizationName: string | null;
    organizationsCount: number;
    syncStatus: string;
  };
  error?: string;
};

type HealthResponse = {
  status: "ok" | "error";
  organizationsCount?: number;
  latencyMs?: number;
  error?: string;
};

type HealthState =
  | { kind: "ok"; organizationsCount: number; latencyMs: number }
  | { kind: "error"; message: string };

type SalesSyncResponse = {
  status?: "success" | "error";
  period?: { from: string; to: string };
  counts?: { daily: number; products: number; hourly: number };
  recordsSynced?: number;
  error?: string;
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

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
        connected
          ? "border-[#06B6D4]/30 bg-[#06B6D4]/[0.08] text-[#06B6D4]"
          : "border-white/10 bg-white/[0.04] text-[#A1A1AA]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          connected ? "bg-[#06B6D4]" : "bg-[#A1A1AA]"
        }`}
      />
      {connected ? "Подключено" : "Не подключено"}
    </span>
  );
}

export function IikoIntegrationCard({
  connected,
  apiLogin: connectedApiLogin,
  organizationName,
  syncStatus,
  lastSyncAt,
  errorMessage,
}: IikoIntegrationCardProps) {
  const router = useRouter();

  // Форма подключения (не подключено): клиент вводит только свои учётные данные.
  // apiLogin — имя интеграции, apiKey — секрет. Платформенные appId/clientSecret
  // хранятся в ENV сервера и здесь не участвуют.
  const [apiLogin, setApiLogin] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [organizations, setOrganizations] = useState<IikoOrganization[] | null>(
    null,
  );
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [saving, setSaving] = useState(false);

  // Действия для подключённого состояния.
  const [checking, setChecking] = useState(false);
  const [health, setHealth] = useState<HealthState | null>(null);
  const [pending, setPending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncSummary, setSyncSummary] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const resetFeedback = () => {
    setActionError(null);
    setActionSuccess(null);
  };

  // Шаг 1–2: проверяем введённые API Login + API Key и получаем организации.
  const handleVerify = async () => {
    if (!apiLogin.trim() || !apiKey.trim()) {
      setActionError("Введите API Login и API Key");
      return;
    }
    setVerifying(true);
    resetFeedback();
    setOrganizations(null);
    setSelectedOrgId("");
    try {
      const res = await fetch("/api/iiko/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiLogin: apiLogin.trim(),
          apiKey: apiKey.trim(),
        }),
      });
      const data = (await res.json()) as ConnectResponse;
      if (!res.ok || !data.verified || !data.organizations) {
        setActionError(data.error ?? "Не удалось подключиться к iiko");
        return;
      }
      setOrganizations(data.organizations);
      setSelectedOrgId(data.organizations[0]?.id ?? "");
      setActionSuccess(
        `Связь установлена · организаций: ${data.organizations.length}. Выберите ресторан и сохраните.`,
      );
    } catch {
      setActionError("Сетевая ошибка при проверке подключения");
    } finally {
      setVerifying(false);
    }
  };

  // Шаг 3–4: сохраняем выбранную организацию ресторана в Supabase.
  const handleSave = async () => {
    if (!selectedOrgId) {
      setActionError("Выберите организацию");
      return;
    }
    setSaving(true);
    resetFeedback();
    try {
      const res = await fetch("/api/iiko/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiLogin: apiLogin.trim(),
          apiKey: apiKey.trim(),
          organizationId: selectedOrgId,
        }),
      });
      const data = (await res.json()) as ConnectResponse;
      if (!res.ok || !data.connection) {
        setActionError(data.error ?? "Не удалось сохранить подключение");
        return;
      }
      setActionSuccess("iiko подключён и организация сохранена");
      router.refresh();
    } catch {
      setActionError("Сетевая ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  const handleCheck = async () => {
    setChecking(true);
    setHealth(null);
    resetFeedback();
    try {
      const res = await fetch("/api/iiko/health", { cache: "no-store" });
      const data = (await res.json()) as HealthResponse;
      if (data.status === "ok") {
        setHealth({
          kind: "ok",
          organizationsCount: data.organizationsCount ?? 0,
          latencyMs: data.latencyMs ?? 0,
        });
      } else {
        setHealth({
          kind: "error",
          message: data.error ?? "Не удалось подключиться к iiko",
        });
      }
    } catch {
      setHealth({ kind: "error", message: "Сетевая ошибка при проверке" });
    } finally {
      setChecking(false);
    }
  };

  // Ручной запуск синхронизации продаж (период по умолчанию — последние 30 дней).
  const handleSyncSales = async () => {
    setSyncing(true);
    setSyncSummary(null);
    resetFeedback();
    try {
      const res = await fetch("/api/iiko/sales/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as SalesSyncResponse;
      if (!res.ok || data.status !== "success") {
        setActionError(data.error ?? "Не удалось синхронизировать продажи");
        return;
      }
      const counts = data.counts ?? { daily: 0, products: 0, hourly: 0 };
      const period = data.period;
      setSyncSummary(
        `Готово${period ? ` · ${period.from} — ${period.to}` : ""} · ` +
          `дни: ${counts.daily}, блюда: ${counts.products}, часы: ${counts.hourly}`,
      );
      router.refresh();
    } catch {
      setActionError("Сетевая ошибка при синхронизации продаж");
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setPending(true);
    resetFeedback();
    try {
      const res = await fetch("/api/iiko/disconnect", { method: "POST" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setActionError(data.error ?? "Не удалось отключить iiko");
        return;
      }
      setHealth(null);
      setOrganizations(null);
      setApiLogin("");
      setApiKey("");
      setActionSuccess("iiko отключён");
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
          <div className="inline-flex rounded-xl border border-[#8B5CF6]/15 bg-[#8B5CF6]/[0.06] p-3 text-[#8B5CF6]">
            <Plug size={22} />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white">iiko</h2>
            <p className="mt-1 text-sm text-[#A1A1AA]">
              Касса и учёт ресторана — продажи, меню и организации.
            </p>
          </div>
        </div>
        <StatusBadge connected={connected} />
      </div>

      {connected ? (
        <>
          <dl className="mt-6 space-y-3 border-t border-white/[0.06] pt-6 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[#A1A1AA]">API Login</dt>
              <dd className="font-mono text-white">{connectedApiLogin ?? "—"}</dd>
            </div>
            {organizationName && (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#A1A1AA]">Организация</dt>
                <dd className="text-white">{organizationName}</dd>
              </div>
            )}
            {syncStatus && (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#A1A1AA]">Статус синхронизации</dt>
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

          {health && (
            <div className="mt-6">
              {health.kind === "ok" ? (
                <SuccessBanner
                  message={`Связь установлена · организаций: ${health.organizationsCount} · ${health.latencyMs} мс`}
                />
              ) : (
                <ErrorBanner message={health.message} />
              )}
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
          {syncSummary && (
            <div className="mt-6">
              <SuccessBanner message={syncSummary} />
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <PrimaryButton onClick={handleSyncSales} disabled={syncing}>
              <RefreshCw size={16} className={syncing ? "animate-spin" : undefined} />
              {syncing ? "Синхронизация…" : "Синхронизировать продажи"}
            </PrimaryButton>
            <SecondaryButton onClick={handleCheck} disabled={checking}>
              <RefreshCw size={16} className={checking ? "animate-spin" : undefined} />
              {checking ? "Проверка…" : "Проверить подключение"}
            </SecondaryButton>
            <SecondaryButton onClick={handleDisconnect} disabled={pending}>
              {pending ? "Отключение…" : "Отключить"}
            </SecondaryButton>
          </div>
        </>
      ) : (
        <div className="mt-6 space-y-5 border-t border-white/[0.06] pt-6">
          <p className="text-sm text-[#A1A1AA]">
            Укажите API Login и API Key вашей интеграции iiko (из личного кабинета
            iiko). Проверьте связь и выберите организацию ресторана — данные
            сохраняются в вашем профиле.
          </p>

          <InputField
            label="API Login"
            value={apiLogin}
            onChange={(value) => {
              setApiLogin(value);
              setOrganizations(null);
              setSelectedOrgId("");
            }}
            placeholder="Имя интеграции iiko"
          />

          <InputField
            label="API Key"
            type="password"
            value={apiKey}
            onChange={(value) => {
              setApiKey(value);
              setOrganizations(null);
              setSelectedOrgId("");
            }}
            placeholder="Секретный ключ интеграции iiko"
          />

          {organizations && organizations.length > 0 && (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#A1A1AA]">
                Организация ресторана
              </span>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-[#111111]/60 px-4 py-3 text-sm text-white outline-none backdrop-blur-sm transition-all duration-200 focus:border-[#8B5CF6]/40 focus:bg-[#111111] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]"
              >
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name || organization.id}
                  </option>
                ))}
              </select>
            </label>
          )}

          {actionError && <ErrorBanner message={actionError} />}
          {actionSuccess && <SuccessBanner message={actionSuccess} />}

          <div className="flex flex-wrap gap-3">
            <SecondaryButton
              onClick={handleVerify}
              disabled={verifying || saving || !apiLogin.trim() || !apiKey.trim()}
            >
              <RefreshCw size={16} className={verifying ? "animate-spin" : undefined} />
              {verifying ? "Проверка…" : "Проверить подключение"}
            </SecondaryButton>

            {organizations && organizations.length > 0 && (
              <PrimaryButton
                onClick={handleSave}
                disabled={saving || verifying || !selectedOrgId}
              >
                <Plug size={16} />
                {saving ? "Сохранение…" : "Сохранить подключение"}
              </PrimaryButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
