import { buildBrandKitPromptSection, isBrandKitConfigured } from "@/lib/brand-kit";
import type { BrandKit } from "@/types/brand-kit";
import type { CreativeContext, CreativeType } from "@/types/creative";
import { getAdTexts, getImageDescription, getOffers } from "@/types/marketing";
import { DOCUMENT_TYPE_LABELS } from "@/types/pdf";

const CREATIVE_BRIEFS: Record<
  Exclude<CreativeType, "enhance_photo">,
  { format: string; brief: string }
> = {
  banner: {
    format: "wide horizontal advertising banner, 3:2 aspect ratio",
    brief:
      "Premium restaurant advertising banner with bold typography area for Russian headline, appetizing food hero shot, modern luxury HoReCa marketing design, high-end commercial photography style",
  },
  story: {
    format: "vertical Instagram Story, 9:16 aspect ratio, full-screen mobile design",
    brief:
      "Eye-catching Instagram Story for restaurant marketing: vibrant food visuals, swipe-up CTA zone at bottom, trendy social media aesthetic, space for Russian text overlay",
  },
  instagram_post: {
    format: "square Instagram feed post, 1:1 aspect ratio",
    brief:
      "Polished Instagram feed post for restaurant: centered appetizing food photography, clean composition, brand-ready social media creative with subtle space for Russian caption text",
  },
  promo_poster: {
    format: "vertical promotional poster, 9:16 aspect ratio",
    brief:
      "Bold promotional poster for restaurant sale or special offer: dynamic layout, large headline area for Russian promo text, appetizing food imagery, urgency-driven marketing design",
  },
};

function buildDishContext(
  ctx: Extract<CreativeContext, { sourceType: "dish" }>,
  brandKit: BrandKit | null,
): string {
  const { restaurantName, analysis } = ctx;
  const name = isBrandKitConfigured(brandKit) ? brandKit.restaurantName : restaurantName;
  const topHeadlines = getAdTexts(analysis).slice(0, 3).join("; ");
  const topPromo = getOffers(analysis).slice(0, 2).join("; ");
  const contentThemes = analysis.contentPlan?.slice(0, 3).map((d) => d.title).join(", ") ?? "";

  return [
    `Restaurant: «${name}»`,
    `Subject on photo: ${getImageDescription(analysis)}`,
    `Marketing headlines: ${topHeadlines}`,
    `Current promotions: ${topPromo}`,
    contentThemes ? `Content themes: ${contentThemes}` : "",
  ].filter(Boolean).join("\n");
}

function buildDocumentContext(
  ctx: Extract<CreativeContext, { sourceType: "document" }>,
): string {
  const docLabel = DOCUMENT_TYPE_LABELS[ctx.documentType];
  const findings = ctx.keyFindings.slice(0, 5).join("; ");
  const marketing = ctx.marketingRecommendations.slice(0, 5).join("; ");
  const promos = ctx.promotions?.slice(0, 3).join("; ");

  const lines = [
    `Document: «${ctx.fileName}» (${docLabel})`,
    `Summary: ${ctx.summary}`,
    `Key findings: ${findings}`,
    `Marketing ideas: ${marketing}`,
  ];

  if (promos) {
    lines.push(`Promotions: ${promos}`);
  }

  if (ctx.documentType === "restaurant_menu") {
    lines.push(
      "Focus on the most appealing and premium menu items — create a mouth-watering showcase of signature dishes.",
    );
  }

  return lines.join("\n");
}

export function buildCreativePrompt(
  creativeType: CreativeType,
  context: CreativeContext,
  brandKit: BrandKit | null = null,
): string {
  const brandBlock = isBrandKitConfigured(brandKit)
    ? buildBrandKitPromptSection(brandKit)
    : null;

  if (creativeType === "enhance_photo") {
    const subject =
      context.sourceType === "dish"
        ? context.analysis.dishDescription
        : context.summary.slice(0, 300);

    const lines = [
      "Enhance this food/restaurant photo to professional commercial quality.",
      "Improve lighting, colors, sharpness, and composition while keeping the original subject authentic.",
      "Style: premium food photography for high-end restaurant marketing, natural appetizing look, no artificial filters.",
      `Subject context: ${subject}`,
    ];

    if (brandBlock) {
      lines.push("", brandBlock);
      lines.push("Do not add random logos or invented brand names.");
    } else {
      lines.push("Do not add text overlays or watermarks.");
    }

    return lines.join("\n");
  }

  const spec = CREATIVE_BRIEFS[creativeType];
  const analysisBlock =
    context.sourceType === "dish"
      ? buildDishContext(context, brandKit)
      : buildDocumentContext(context);

  const subjectHint =
    context.sourceType === "dish"
      ? `Create a premium advertising creative featuring the dish described below.`
      : context.documentType === "restaurant_menu"
        ? `Create a premium restaurant advertising creative showcasing the best menu items and signature dishes from the analyzed menu.`
        : `Create a premium restaurant/HoReCa advertising creative based on the business document analysis below.`;

  const lines = [
    subjectHint,
    `Format: ${spec.format}`,
    `Design direction: ${spec.brief}`,
  ];

  if (brandBlock) {
    lines.push("", brandBlock);
  }

  lines.push(
    "",
    "Analysis context (use this to guide content, mood, and messaging):",
    analysisBlock,
    "",
    brandBlock
      ? "Requirements: photorealistic, appetizing, professional marketing quality. Strictly follow the Brand Kit above — use only the official restaurant name, brand colors, and logo settings. Never generate random logos or invented brand identities."
      : "Requirements: photorealistic, appetizing, professional marketing quality. No watermarks. Leave clean areas for Russian text overlays where appropriate.",
  );

  return lines.join("\n");
}

export function getCreativeSize(creativeType: CreativeType): string {
  switch (creativeType) {
    case "banner":
      return "1536x1024";
    case "story":
    case "promo_poster":
      return "1024x1536";
    case "instagram_post":
    case "enhance_photo":
      return "1024x1024";
  }
}
