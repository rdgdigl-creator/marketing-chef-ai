"use client";

import CreativeGenerator from "@/components/creative-generator";
import { ResultCard } from "@/components/page-shell";
import { Copy, Megaphone, PenLine, Sparkles, Tag, Wand2 } from "@/components/ui/icon";
import {
  getAdTexts,
  getImageDescription,
  getOffers,
  type MarketingAnalysis,
} from "@/types/marketing";

type MarketingResultsProps = {
  restaurantName: string;
  imageUrl: string;
  analysis: MarketingAnalysis;
  projectId?: string;
};

function Section({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card card-shine rounded-2xl p-6 md:p-8">
      <div className="mb-5 flex items-start gap-3">
        <span className="inline-flex shrink-0 rounded-xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/10 p-2.5 text-[#8B5CF6]">
          {icon}
        </span>
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-[#A1A1AA]">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(text)}
      className="ml-2 inline-flex shrink-0 rounded-lg border border-white/[0.08] p-1.5 text-[#A1A1AA] transition-colors hover:border-[#8B5CF6]/30 hover:text-white"
      title="Скопировать"
    >
      <Copy size={14} />
    </button>
  );
}

function ListItems({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li
          key={index}
          className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#8B5CF6]/10 text-xs font-bold text-[#8B5CF6]">
            {index + 1}
          </span>
          <p className="flex-1 text-sm leading-relaxed text-[#A1A1AA]">{item}</p>
        </li>
      ))}
    </ul>
  );
}

export default function MarketingResults({
  restaurantName,
  imageUrl,
  analysis,
  projectId,
}: MarketingResultsProps) {
  const description = getImageDescription(analysis);
  const adTexts = getAdTexts(analysis);
  const offers = getOffers(analysis);
  const concepts = analysis.adConcepts ?? [];
  const cta = analysis.cta ?? [];
  const stories = analysis.storiesIdeas ?? analysis.reelsIdeas ?? [];
  const posts = analysis.postIdeas ?? [];
  const banners = analysis.bannerConcepts ?? [];

  const legacyAnalysis = {
    ...analysis,
    dishDescription: description,
    headlines: adTexts,
    promotions: offers,
    contentPlan: analysis.contentPlan ?? [],
    reelsIdeas: stories,
  };

  return (
    <section className="space-y-6">
      <div className="glass-card card-shine rounded-2xl border border-[#8B5CF6]/20 p-6 md:p-8">
        <p className="text-sm font-medium uppercase tracking-widest text-[#8B5CF6]">
          Анализ завершён
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
          {restaurantName}
        </h2>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-white/[0.08]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={`Фото — ${restaurantName}`}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
              <p className="text-xs font-medium uppercase tracking-widest text-[#A1A1AA]">
                Что на фото
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white">{description}</p>
            </div>
            {analysis.photoQuality && (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
                <p className="text-xs font-medium uppercase tracking-widest text-[#A1A1AA]">
                  Качество фото
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">
                  {analysis.photoQuality}
                </p>
              </div>
            )}
            {analysis.adAppeal && (
              <div className="rounded-xl border border-[#06B6D4]/20 bg-[#06B6D4]/[0.04] p-5">
                <p className="text-xs font-medium uppercase tracking-widest text-[#06B6D4]">
                  Привлекательность для рекламы
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">
                  {analysis.adAppeal}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {concepts.length > 0 && (
        <Section title="Рекламные концепции" icon={<Sparkles size={20} />}>
          <ListItems items={concepts} />
        </Section>
      )}

      {adTexts.length > 0 && (
        <Section title="Рекламные тексты" icon={<PenLine size={20} />}>
          <ListItems items={adTexts} />
        </Section>
      )}

      {offers.length > 0 && (
        <Section title="Офферы" icon={<Tag size={20} />}>
          <div className="grid gap-4 sm:grid-cols-2">
            {offers.map((offer, i) => (
              <div
                key={i}
                className="rounded-xl border border-[#8B5CF6]/15 bg-gradient-to-br from-[#8B5CF6]/10 to-transparent p-5"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8B5CF6]">
                  Оффер {i + 1}
                </span>
                <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">{offer}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {cta.length > 0 && (
        <Section title="Призывы к действию" subtitle="CTA для рекламы и постов" icon={<Megaphone size={20} />}>
          <div className="flex flex-wrap gap-2">
            {cta.map((item, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-sm text-white"
              >
                {item}
              </span>
            ))}
          </div>
        </Section>
      )}

      {stories.length > 0 && (
        <Section title="Идеи Stories" icon={<PenLine size={20} />}>
          <ListItems items={stories} />
        </Section>
      )}

      {posts.length > 0 && (
        <Section title="Идеи постов" icon={<PenLine size={20} />}>
          <ListItems items={posts} />
        </Section>
      )}

      {banners.length > 0 && (
        <Section
          title="Instagram Banner Generator"
          subtitle="Готовые концепции баннеров с промптами для генерации"
          icon={<Wand2 size={20} />}
        >
          <div className="space-y-4">
            {banners.map((banner, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5"
              >
                <h4 className="font-semibold text-white">{banner.title}</h4>
                <p className="mt-2 text-sm text-[#A1A1AA]">{banner.adText}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Дизайн</p>
                    <p className="mt-1 text-sm text-[#A1A1AA]">{banner.designDescription}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[#A1A1AA]">Стиль</p>
                    <p className="mt-1 text-sm text-[#A1A1AA]">{banner.style}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/[0.06] bg-[#070707]/50 p-3">
                  <p className="flex-1 font-mono text-xs text-[#A1A1AA]">{banner.imagePrompt}</p>
                  <CopyButton text={banner.imagePrompt} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <CreativeGenerator
        context={{
          sourceType: "dish",
          restaurantName,
          analysis: legacyAnalysis,
        }}
        sourceImageBase64={imageUrl}
        marketingProjectId={projectId}
      />
    </section>
  );
}
