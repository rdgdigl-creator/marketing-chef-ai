import { getAuthUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  LOGO_POSITION_LABELS,
  LOGO_SIZE_LABELS,
  type BrandKit,
  type BrandKitInput,
  type LogoPosition,
  type LogoSize,
} from "@/types/brand-kit";

type DbBrandKitRow = {
  id: string;
  restaurant_name: string;
  logo_url: string | null;
  slogan: string;
  primary_color: string;
  secondary_color: string;
  whatsapp: string;
  instagram: string;
  address: string;
  phone: string;
  website: string;
  watermark_enabled: boolean;
  logo_position: LogoPosition;
  logo_size: LogoSize;
  logo_opacity: number;
  created_at: string;
};

function mapBrandKitRow(row: DbBrandKitRow): BrandKit {
  return {
    id: row.id,
    restaurantName: row.restaurant_name,
    logoUrl: row.logo_url,
    slogan: row.slogan,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    whatsapp: row.whatsapp,
    instagram: row.instagram,
    address: row.address,
    phone: row.phone,
    website: row.website,
    watermarkEnabled: row.watermark_enabled,
    logoPosition: row.logo_position,
    logoSize: row.logo_size,
    logoOpacity: row.logo_opacity,
    createdAt: row.created_at,
  };
}

function mapBrandKitInput(input: BrandKitInput) {
  return {
    restaurant_name: input.restaurantName.trim(),
    logo_url: input.logoUrl,
    slogan: input.slogan.trim(),
    primary_color: input.primaryColor,
    secondary_color: input.secondaryColor,
    whatsapp: input.whatsapp.trim(),
    instagram: input.instagram.trim(),
    address: input.address.trim(),
    phone: input.phone.trim(),
    website: input.website.trim(),
    watermark_enabled: input.watermarkEnabled,
    logo_position: input.logoPosition,
    logo_size: input.logoSize,
    logo_opacity: input.logoOpacity,
  };
}

export function isBrandKitConfigured(brandKit: BrandKit | null): brandKit is BrandKit {
  return Boolean(brandKit?.restaurantName?.trim());
}

export async function getBrandKit(): Promise<BrandKit | null> {
  const user = await getAuthUser();
  if (!user) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("brand_kits")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapBrandKitRow(data as DbBrandKitRow);
}

export async function saveBrandKit(
  input: BrandKitInput,
): Promise<{ brandKit: BrandKit } | { error: string }> {
  if (!input.restaurantName.trim()) {
    return { error: "Укажите название ресторана" };
  }

  const user = await getAuthUser();
  if (!user) {
    return { error: "Не авторизован" };
  }

  const supabase = await createSupabaseServerClient();
  const payload = mapBrandKitInput(input);

  const existing = await getBrandKit();

  if (existing) {
    const { data, error } = await supabase
      .from("brand_kits")
      .update(payload)
      .eq("id", existing.id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error || !data) {
      return { error: error?.message ?? "Не удалось обновить Brand Kit" };
    }

    return { brandKit: mapBrandKitRow(data as DbBrandKitRow) };
  }

  const { data, error } = await supabase
    .from("brand_kits")
    .insert({ ...payload, user_id: user.id })
    .select("*")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Не удалось сохранить Brand Kit" };
  }

  return { brandKit: mapBrandKitRow(data as DbBrandKitRow) };
}

const LOGO_SIZE_PROMPT: Record<LogoSize, string> = {
  small: "small, subtle",
  medium: "medium-sized",
  large: "large, prominent",
};

export function buildBrandKitPromptSection(brandKit: BrandKit): string {
  const lines = [
    "=== BRAND KIT (MANDATORY) ===",
    "Use ONLY this brand identity. NEVER invent random restaurant names, generic logos, placeholder brands, or unrelated color palettes.",
    `Official restaurant name: «${brandKit.restaurantName}»`,
  ];

  if (brandKit.slogan) {
    lines.push(`Brand slogan: «${brandKit.slogan}»`);
  }

  lines.push(`Primary brand color: ${brandKit.primaryColor}`);
  lines.push(`Secondary brand color: ${brandKit.secondaryColor}`);
  lines.push(
    "Apply these exact brand colors to backgrounds, accents, typography areas, and design elements.",
  );

  const contacts: string[] = [];
  if (brandKit.phone) contacts.push(`Phone: ${brandKit.phone}`);
  if (brandKit.whatsapp) contacts.push(`WhatsApp: ${brandKit.whatsapp}`);
  if (brandKit.instagram) contacts.push(`Instagram: ${brandKit.instagram}`);
  if (brandKit.address) contacts.push(`Address: ${brandKit.address}`);
  if (brandKit.website) contacts.push(`Website: ${brandKit.website}`);

  if (contacts.length > 0) {
    lines.push(`Contact details to reflect in design when appropriate: ${contacts.join(" | ")}`);
  }

  if (brandKit.watermarkEnabled && brandKit.logoUrl) {
    lines.push(
      `Include the restaurant logo as a watermark at ${LOGO_POSITION_LABELS[brandKit.logoPosition]} position, ${LOGO_SIZE_PROMPT[brandKit.logoSize]} (${LOGO_SIZE_LABELS[brandKit.logoSize]}), ${brandKit.logoOpacity}% opacity.`,
    );
    lines.push(
      "The logo must look like a real restaurant brand mark — do NOT generate a random or generic logo.",
    );
  } else {
    lines.push(
      "Do not add random logos, watermarks, or invented brand marks. Use the official restaurant name in typography only.",
    );
  }

  lines.push("=== END BRAND KIT ===");

  return lines.join("\n");
}

export function buildBrandKitReelsContext(brandKit: BrandKit): string {
  const lines = [
    `Официальное название ресторана: «${brandKit.restaurantName}»`,
    `Используй ТОЛЬКО это название — никогда не придумывай другие имена бренда.`,
  ];

  if (brandKit.slogan) {
    lines.push(`Слоган бренда: «${brandKit.slogan}»`);
  }

  lines.push(`Фирменные цвета: основной ${brandKit.primaryColor}, дополнительный ${brandKit.secondaryColor}`);

  const contacts: string[] = [];
  if (brandKit.instagram) contacts.push(`Instagram: ${brandKit.instagram}`);
  if (brandKit.whatsapp) contacts.push(`WhatsApp: ${brandKit.whatsapp}`);
  if (brandKit.phone) contacts.push(`Телефон: ${brandKit.phone}`);
  if (brandKit.address) contacts.push(`Адрес: ${brandKit.address}`);
  if (brandKit.website) contacts.push(`Сайт: ${brandKit.website}`);

  if (contacts.length > 0) {
    lines.push(`Контакты для CTA: ${contacts.join(", ")}`);
  }

  return lines.join("\n");
}
