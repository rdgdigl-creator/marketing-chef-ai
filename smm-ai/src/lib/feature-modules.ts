import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  AiMarketerSession,
  ChatMessage,
  CompetitorAnalysis,
  CompetitorAnalysisResult,
  ContentPlan,
  ContentPlanDay,
  MarketerGenerateResult,
  MarketerModuleType,
  ReelsGeneration,
  ReelsIdea,
  SalesGrowthAnalysis,
  SalesGrowthResult,
} from "@/types/features";

async function getSupabaseWithUser() {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function saveMarketerSession(data: {
  restaurantName: string;
  moduleType: MarketerModuleType;
  title: string;
  messages: ChatMessage[];
  result?: MarketerGenerateResult | null;
}): Promise<AiMarketerSession | null> {
  const { supabase, user } = await getSupabaseWithUser();
  if (!user) return null;

  const { data: row, error } = await supabase
    .from("ai_marketer_sessions")
    .insert({
      restaurant_name: data.restaurantName,
      module_type: data.moduleType,
      title: data.title,
      messages: data.messages,
      result: data.result ?? null,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) return null;
  return row as AiMarketerSession;
}

export async function updateMarketerSession(
  id: string,
  data: { messages?: ChatMessage[]; result?: MarketerGenerateResult | null; title?: string },
): Promise<boolean> {
  const { supabase, user } = await getSupabaseWithUser();
  if (!user) return false;

  const { error } = await supabase
    .from("ai_marketer_sessions")
    .update(data)
    .eq("id", id)
    .eq("user_id", user.id);

  return !error;
}

export async function loadMarketerSessions(): Promise<AiMarketerSession[]> {
  const { supabase, user } = await getSupabaseWithUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("ai_marketer_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return [];
  return (data ?? []) as AiMarketerSession[];
}

export async function saveReelsGeneration(data: {
  restaurantName: string;
  imageUrl: string;
  dishDescription: string;
  ideas: ReelsIdea[];
}): Promise<ReelsGeneration | null> {
  const { supabase, user } = await getSupabaseWithUser();
  if (!user) return null;

  const { data: row, error } = await supabase
    .from("reels_generations")
    .insert({
      restaurant_name: data.restaurantName,
      image_url: data.imageUrl,
      dish_description: data.dishDescription,
      ideas: data.ideas,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) return null;
  return row as ReelsGeneration;
}

export async function loadReelsGenerations(): Promise<ReelsGeneration[]> {
  const { supabase, user } = await getSupabaseWithUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("reels_generations")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) return [];
  return (data ?? []) as ReelsGeneration[];
}

export async function saveContentPlan(data: {
  restaurantName: string;
  durationDays: 7 | 14 | 30;
  platforms: string[];
  plan: ContentPlanDay[];
}): Promise<ContentPlan | null> {
  const { supabase, user } = await getSupabaseWithUser();
  if (!user) return null;

  const { data: row, error } = await supabase
    .from("content_plans")
    .insert({
      restaurant_name: data.restaurantName,
      duration_days: data.durationDays,
      platforms: data.platforms,
      plan: data.plan,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) return null;
  return row as ContentPlan;
}

export async function loadContentPlans(): Promise<ContentPlan[]> {
  const { supabase, user } = await getSupabaseWithUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("content_plans")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) return [];
  return (data ?? []) as ContentPlan[];
}

export async function saveCompetitorAnalysis(data: {
  restaurantName: string;
  competitorHandle: string;
  analysis: CompetitorAnalysisResult;
}): Promise<CompetitorAnalysis | null> {
  const { supabase, user } = await getSupabaseWithUser();
  if (!user) return null;

  const { data: row, error } = await supabase
    .from("competitor_analyses")
    .insert({
      restaurant_name: data.restaurantName,
      competitor_handle: data.competitorHandle,
      analysis: data.analysis,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) return null;
  return row as CompetitorAnalysis;
}

export async function loadCompetitorAnalyses(): Promise<CompetitorAnalysis[]> {
  const { supabase, user } = await getSupabaseWithUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("competitor_analyses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) return [];
  return (data ?? []) as CompetitorAnalysis[];
}

export async function saveSalesGrowthAnalysis(data: {
  restaurantName: string;
  menuDescription: string;
  analysis: SalesGrowthResult;
}): Promise<SalesGrowthAnalysis | null> {
  const { supabase, user } = await getSupabaseWithUser();
  if (!user) return null;

  const { data: row, error } = await supabase
    .from("sales_growth_analyses")
    .insert({
      restaurant_name: data.restaurantName,
      menu_description: data.menuDescription,
      analysis: data.analysis,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) return null;
  return row as SalesGrowthAnalysis;
}

export async function loadSalesGrowthAnalyses(): Promise<SalesGrowthAnalysis[]> {
  const { supabase, user } = await getSupabaseWithUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("sales_growth_analyses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) return [];
  return (data ?? []) as SalesGrowthAnalysis[];
}
