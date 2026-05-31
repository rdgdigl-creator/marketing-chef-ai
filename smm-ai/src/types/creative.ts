import type { MarketingAnalysis } from "@/types/marketing";
import type { DocumentAnalysis, DocumentType } from "@/types/pdf";

export type CreativeType =
  | "banner"
  | "story"
  | "instagram_post"
  | "promo_poster"
  | "enhance_photo";

export type CreativeSourceType = "dish" | "document";

export type DishCreativeContext = {
  sourceType: "dish";
  restaurantName: string;
  analysis: MarketingAnalysis;
};

export type DocumentCreativeContext = {
  sourceType: "document";
  fileName: string;
  documentType: DocumentType;
  summary: string;
  keyFindings: string[];
  marketingRecommendations: string[];
  promotions?: string[];
};

export type CreativeContext = DishCreativeContext | DocumentCreativeContext;

export type GenerateCreativeRequest = {
  creativeType: CreativeType;
  context: CreativeContext;
  sourceImageBase64?: string;
};

export type GeneratedCreative = {
  creativeType: CreativeType;
  imageBase64: string;
  prompt: string;
};

export const MARKETING_PACKAGE_TYPES: CreativeType[] = [
  "instagram_post",
  "story",
  "banner",
  "promo_poster",
];

export type PackageGenerationStatus = "pending" | "generating" | "done" | "error";

export type MarketingPackageCreative = {
  id: string;
  creativeType: CreativeType;
  imageUrl: string;
  prompt: string;
};

export type MarketingPackage = {
  id: string;
  sourceType: CreativeSourceType;
  sourceTitle: string;
  createdAt: string;
  creatives: MarketingPackageCreative[];
};

export type SaveMarketingPackageRequest = {
  sourceType: CreativeSourceType;
  sourceTitle: string;
  marketingProjectId?: string;
  documentId?: string;
  creatives: GeneratedCreative[];
};

export const CREATIVE_TYPE_LABELS: Record<CreativeType, string> = {
  banner: "Создать рекламный баннер",
  story: "Создать Story",
  instagram_post: "Создать Instagram Post",
  promo_poster: "Создать акционный постер",
  enhance_photo: "Улучшить фото",
};

export const CREATIVE_TYPE_DESCRIPTIONS: Record<CreativeType, string> = {
  banner: "Горизонтальный баннер для сайта и рекламы",
  story: "Вертикальный креатив 9:16 для Stories",
  instagram_post: "Квадратный пост для ленты Instagram",
  promo_poster: "Акционный постер с местом для текста",
  enhance_photo: "Профессиональная ретушь и улучшение фото",
};
