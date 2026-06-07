import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/page-shell";
import { ArrowRight } from "@/components/ui/icon";
import { STUDIO_TOOLS } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Creative Studio — Marketing Chef AI",
  description:
    "Творческая студия: фото, баннеры, Stories, Reels, афиши, рекламные посты и меню ресторана.",
};

export default function StudioPage() {
  return (
    <PageShell
      activeFeature="/studio"
      badge="Creative Studio"
      title="Creative Studio"
      subtitle="Творческая студия вашего ресторана: создавайте визуал, рекламу и контент для соцсетей."
    >
      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STUDIO_TOOLS.map((tool) => {
          const Icon = tool.icon;
          const content = (
            <>
              <div className="mb-4 inline-flex items-center justify-between">
                <span className="inline-flex rounded-xl border border-[#8B5CF6]/15 bg-[#8B5CF6]/[0.06] p-3 text-[#8B5CF6] transition-all duration-300 group-hover:border-[#8B5CF6]/30 group-hover:bg-[#8B5CF6]/10">
                  <Icon size={24} />
                </span>
                {!tool.available && (
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-[#A1A1AA]">
                    Скоро
                  </span>
                )}
              </div>
              <h3 className="text-base font-semibold tracking-tight text-white">{tool.label}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[#A1A1AA]">
                {tool.description}
              </p>
              {tool.available && (
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-[#8B5CF6] opacity-0 transition-all duration-300 group-hover:opacity-100">
                  Открыть
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </div>
              )}
            </>
          );

          if (!tool.available) {
            return (
              <div
                key={tool.label}
                className="glass-card card-shine flex h-full cursor-not-allowed flex-col rounded-2xl p-6 opacity-60"
              >
                {content}
              </div>
            );
          }

          return (
            <Link
              key={tool.label}
              href={tool.href}
              className="feature-card glass-card card-shine group flex h-full flex-col rounded-2xl p-6"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </PageShell>
  );
}
