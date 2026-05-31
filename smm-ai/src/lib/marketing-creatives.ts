import { getAuthUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CreativeSourceType,
  CreativeType,
  GeneratedCreative,
  MarketingPackage,
  MarketingPackageCreative,
} from "@/types/creative";

type DbPackageRow = {
  id: string;
  source_type: CreativeSourceType;
  source_title: string;
  created_at: string;
  marketing_creatives: Array<{
    id: string;
    creative_type: CreativeType;
    image_url: string;
    prompt: string;
  }> | null;
};

function mapPackageRow(row: DbPackageRow): MarketingPackage {
  const creatives: MarketingPackageCreative[] = (row.marketing_creatives ?? []).map(
    (c) => ({
      id: c.id,
      creativeType: c.creative_type,
      imageUrl: c.image_url,
      prompt: c.prompt,
    }),
  );

  return {
    id: row.id,
    sourceType: row.source_type,
    sourceTitle: row.source_title,
    createdAt: row.created_at,
    creatives,
  };
}

export async function saveMarketingPackage(params: {
  sourceType: CreativeSourceType;
  sourceTitle: string;
  marketingProjectId?: string;
  documentId?: string;
  creatives: GeneratedCreative[];
}): Promise<{ package: MarketingPackage } | { error: string }> {
  if (params.creatives.length === 0) {
    return { error: "Нет креативов для сохранения" };
  }

  const user = await getAuthUser();
  if (!user) {
    return { error: "Не авторизован" };
  }

  const supabase = await createSupabaseServerClient();

  const { data: pkg, error: pkgError } = await supabase
    .from("marketing_packages")
    .insert({
      source_type: params.sourceType,
      source_title: params.sourceTitle,
      marketing_project_id: params.marketingProjectId ?? null,
      document_id: params.documentId ?? null,
      user_id: user.id,
    })
    .select("id, source_type, source_title, created_at")
    .single();

  if (pkgError || !pkg) {
    return { error: pkgError?.message ?? "Не удалось создать пакет" };
  }

  const { data: creativeRows, error: creativesError } = await supabase
    .from("marketing_creatives")
    .insert(
      params.creatives.map((c) => ({
        package_id: pkg.id,
        creative_type: c.creativeType,
        image_url: c.imageBase64,
        prompt: c.prompt,
      })),
    )
    .select("id, creative_type, image_url, prompt");

  if (creativesError || !creativeRows) {
    return { error: creativesError?.message ?? "Не удалось сохранить креативы" };
  }

  return {
    package: {
      id: pkg.id,
      sourceType: pkg.source_type as CreativeSourceType,
      sourceTitle: pkg.source_title,
      createdAt: pkg.created_at,
      creatives: creativeRows.map((c) => ({
        id: c.id,
        creativeType: c.creative_type as CreativeType,
        imageUrl: c.image_url,
        prompt: c.prompt,
      })),
    },
  };
}

export async function getMarketingPackages(params: {
  sourceType: CreativeSourceType;
  marketingProjectId?: string;
  documentId?: string;
}): Promise<{ packages: MarketingPackage[] } | { error: string }> {
  const user = await getAuthUser();
  if (!user) {
    return { error: "Не авторизован" };
  }

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("marketing_packages")
    .select(
      `
      id,
      source_type,
      source_title,
      created_at,
      marketing_creatives (
        id,
        creative_type,
        image_url,
        prompt
      )
    `,
    )
    .eq("user_id", user.id)
    .eq("source_type", params.sourceType)
    .order("created_at", { ascending: false });

  if (params.sourceType === "dish" && params.marketingProjectId) {
    query = query.eq("marketing_project_id", params.marketingProjectId);
  } else if (params.sourceType === "document" && params.documentId) {
    query = query.eq("document_id", params.documentId);
  } else {
    return { packages: [] };
  }

  const { data, error } = await query;

  if (error) {
    return { error: error.message };
  }

  return {
    packages: (data as DbPackageRow[]).map(mapPackageRow),
  };
}
