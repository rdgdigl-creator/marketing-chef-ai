import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import PageShell from "@/components/page-shell";
import { DirectorChat } from "@/components/director/director-chat";
import { RefreshCw } from "@/components/ui/icon";
import type { IikoConnectionStatus } from "@/lib/iiko/connection-status";

type AuthenticatedHomeProps = {
  displayName: string | null;
  iiko: IikoConnectionStatus;
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function IikoStatusPill({ iiko }: { iiko: IikoConnectionStatus }) {
  return (
    <Link
      href="/profile/integrations"
      className="group inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-[#A1A1AA] transition-colors hover:border-white/[0.16] hover:text-white"
    >
      <span
        className={`h-2 w-2 rounded-full ${iiko.connected ? "bg-[#22C55E]" : "bg-[#A1A1AA]"}`}
      />
      {iiko.connected ? (
        <>
          <span className="font-medium text-white">iiko подключён</span>
          <span className="hidden sm:inline">· синхр. {formatDateTime(iiko.lastSyncAt)}</span>
          <RefreshCw size={12} className="opacity-0 transition-opacity group-hover:opacity-100" />
        </>
      ) : (
        <>iiko не подключён · подключить</>
      )}
    </Link>
  );
}

export function AuthenticatedHome({ displayName, iiko }: AuthenticatedHomeProps) {
  const name = displayName?.trim();

  return (
    <PageShell activeFeature="/" showBottomNav>
      <section className="mx-auto mb-8 flex max-w-3xl flex-col items-center text-center">
        <div className="relative mb-5">
          <div className="absolute inset-0 rounded-full bg-[#8B5CF6]/25 blur-2xl" />
          <Image
            src="/ai-director.png"
            alt="AI-директор по маркетингу"
            width={96}
            height={96}
            priority
            className="relative h-24 w-24 rounded-full object-cover ring-1 ring-[#8B5CF6]/40"
          />
        </div>

        <h1 className="text-balance text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Ваш AI-директор по маркетингу
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-[#A1A1AA]">
          Анализирует бизнес, предлагает решения, создаёт контент и помогает увеличивать продажи.
        </p>

        {name && (
          <p className="mt-2 text-sm text-[#A1A1AA]">
            Готов к работе, <span className="text-white">{name}</span>.
          </p>
        )}

        <div className="mt-5">
          <IikoStatusPill iiko={iiko} />
        </div>
      </section>

      <Suspense fallback={null}>
        <DirectorChat />
      </Suspense>
    </PageShell>
  );
}
