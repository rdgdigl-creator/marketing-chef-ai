import type { Metadata } from "next";
import PageShell, { FeatureLinkCard } from "@/components/page-shell";
import { MAIN_MODULES } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Создать — Marketing Chef AI",
  description: "Выберите инструмент для создания маркетинговых материалов",
};

export default function CreatePage() {
  return (
    <PageShell
      activeFeature="/create"
      badge="Создание"
      title="Что создаём сегодня?"
      subtitle="Выберите инструмент — загрузите материалы и получите готовые маркетинговые решения для вашего ресторана."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {MAIN_MODULES.map((module) => {
          const Icon = module.icon;
          return (
            <FeatureLinkCard
              key={module.href}
              href={module.href}
              title={module.label}
              description={module.description}
              icon={<Icon size={24} />}
            />
          );
        })}
      </div>
    </PageShell>
  );
}
