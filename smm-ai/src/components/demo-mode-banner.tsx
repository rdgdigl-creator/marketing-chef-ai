type DemoModeBannerProps = {
  title?: string;
  description?: string;
};

export function DemoModeBanner({
  title = "Демо-режим",
  description = "Данные из mock-провайдера. После создания Meta App подключим OAuth без изменения архитектуры.",
}: DemoModeBannerProps) {
  return (
    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3">
      <p className="text-sm font-medium text-amber-300">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-[#A1A1AA]">{description}</p>
    </div>
  );
}
