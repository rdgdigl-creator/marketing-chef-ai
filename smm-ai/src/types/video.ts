export type VideoAudience = {
  ageRange: string;
  gender: string;
  interests: string[];
  geography: string;
};

export type MetaAdsSettings = {
  campaignObjective: string;
  placements: string[];
  budgetHint: string;
  targetingNotes: string;
};

export type VideoAnalysisResult = {
  score: number;
  scoreLabel: string;
  firstThreeSeconds: string;
  attentionRetention: string;
  editing: string;
  composition: string;
  sound: string;
  textOverlay: string;
  improvements: string[];
  adReady: boolean;
  adReadyReason: string;
  recommendedAudience: VideoAudience;
  metaAdsSettings: MetaAdsSettings;
  summary: string;
};
