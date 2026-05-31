export type MarketerModuleType =
  | "chat"
  | "strategy"
  | "promotions"
  | "content_ideas"
  | "content_plan"
  | "business_analysis"
  | "competitor_analysis";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AiMarketerSession = {
  id: string;
  restaurant_name: string;
  module_type: MarketerModuleType;
  title: string;
  messages: ChatMessage[];
  result: Record<string, unknown> | null;
  created_at: string;
};

export type ReelsIdea = {
  title: string;
  hook: string;
  whatToFilm: string;
  whyItWorks: string;
  caption: string;
  klingPrompt: string;
  /** @deprecated */
  script?: string;
  storyboard?: string[];
  voiceover?: string;
};

export type ReelsTrend = {
  trend: string;
  whyItWorks: string;
  howToAdapt: string;
};

export type ReelsGenerationResult = {
  dishDescription: string;
  ideas: ReelsIdea[];
  trends: ReelsTrend[];
};

export type ReelsGeneration = {
  id: string;
  restaurant_name: string;
  image_url: string;
  dish_description: string;
  ideas: ReelsIdea[];
  created_at: string;
};

export type PlatformPost = {
  title: string;
  content: string;
  format: string;
};

export type ContentPlanDay = {
  day: number;
  instagram: PlatformPost;
  tiktok: PlatformPost;
  telegram: PlatformPost;
};

export type ContentPlanResult = {
  plan: ContentPlanDay[];
};

export type ContentPlan = {
  id: string;
  restaurant_name: string;
  duration_days: 7 | 14 | 30;
  platforms: string[];
  plan: ContentPlanDay[];
  created_at: string;
};

export type CompetitorItem = {
  name: string;
  strengths: string[];
  weaknesses: string[];
};

export type NicheCompetitorAnalysisResult = {
  competitors: CompetitorItem[];
  outmaneuverIdeas: string[];
  marketingOpportunities: string[];
  summary: string;
};

export type CompetitorAnalysisResult = {
  profileSummary: string;
  strengths: string[];
  weaknesses: string[];
  contentIdeas: string[];
  recommendations: string[];
  marketingOpportunities: string[];
};

export type CompetitorAnalysis = {
  id: string;
  restaurant_name: string;
  competitor_handle: string;
  analysis: CompetitorAnalysisResult;
  created_at: string;
};

export type SalesGrowthResult = {
  menuAnalysis: string;
  averageCheckRecommendations: string[];
  promotions: string[];
  comboOffers: string[];
  crossSellIdeas: string[];
  retentionStrategies: string[];
};

export type SalesGrowthAnalysis = {
  id: string;
  restaurant_name: string;
  menu_description: string;
  analysis: SalesGrowthResult;
  created_at: string;
};

export type MarketerGenerateResult = {
  strategies?: string[];
  promotions?: string[];
  contentIdeas?: string[];
  contentPlan?: ContentPlanDay[];
  businessAnalysis?: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    recommendations: string[];
  };
  competitorAnalysis?: NicheCompetitorAnalysisResult;
};
