export type BannerConcept = {
  title: string;
  adText: string;
  designDescription: string;
  style: string;
  imagePrompt: string;
};

export type MarketingAnalysis = {
  imageDescription: string;
  photoQuality: string;
  adAppeal: string;
  adConcepts: string[];
  adTexts: string[];
  offers: string[];
  cta: string[];
  storiesIdeas: string[];
  postIdeas: string[];
  bannerConcepts: BannerConcept[];
  /** @deprecated Старые проекты */
  dishDescription?: string;
  reelsIdeas?: string[];
  promotions?: string[];
  contentPlan?: { day: number; title: string; content: string }[];
  headlines?: string[];
};

export function getImageDescription(analysis: MarketingAnalysis): string {
  return analysis.imageDescription ?? analysis.dishDescription ?? "";
}

export function getAdTexts(analysis: MarketingAnalysis): string[] {
  if (analysis.adTexts?.length) return analysis.adTexts;
  return analysis.headlines ?? [];
}

export function getOffers(analysis: MarketingAnalysis): string[] {
  if (analysis.offers?.length) return analysis.offers;
  return analysis.promotions ?? [];
}

export type MarketingProject = {
  id: string;
  restaurant_name: string;
  image_url: string;
  analysis: MarketingAnalysis;
  created_at: string;
};

export type MarketingProjectListItem = Pick<
  MarketingProject,
  "id" | "restaurant_name" | "image_url" | "created_at"
>;
