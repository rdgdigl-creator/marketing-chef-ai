export type LogoPosition =
  | "top_left"
  | "top_right"
  | "bottom_left"
  | "bottom_right"
  | "center";

export type LogoSize = "small" | "medium" | "large";

export type BrandKit = {
  id: string;
  restaurantName: string;
  logoUrl: string | null;
  slogan: string;
  primaryColor: string;
  secondaryColor: string;
  whatsapp: string;
  instagram: string;
  address: string;
  phone: string;
  website: string;
  watermarkEnabled: boolean;
  logoPosition: LogoPosition;
  logoSize: LogoSize;
  logoOpacity: number;
  createdAt: string;
};

export type BrandKitInput = Omit<BrandKit, "id" | "createdAt">;

export const LOGO_POSITION_OPTIONS: { value: LogoPosition; label: string }[] = [
  { value: "top_left", label: "Верхний левый" },
  { value: "top_right", label: "Верхний правый" },
  { value: "bottom_left", label: "Нижний левый" },
  { value: "bottom_right", label: "Нижний правый" },
  { value: "center", label: "Центр" },
];

export const LOGO_SIZE_OPTIONS: { value: LogoSize; label: string }[] = [
  { value: "small", label: "Маленький" },
  { value: "medium", label: "Средний" },
  { value: "large", label: "Большой" },
];

export const LOGO_POSITION_LABELS: Record<LogoPosition, string> = Object.fromEntries(
  LOGO_POSITION_OPTIONS.map((o) => [o.value, o.label]),
) as Record<LogoPosition, string>;

export const LOGO_SIZE_LABELS: Record<LogoSize, string> = Object.fromEntries(
  LOGO_SIZE_OPTIONS.map((o) => [o.value, o.label]),
) as Record<LogoSize, string>;

export const DEFAULT_BRAND_KIT_INPUT: BrandKitInput = {
  restaurantName: "",
  logoUrl: null,
  slogan: "",
  primaryColor: "#8B5CF6",
  secondaryColor: "#1a1a1a",
  whatsapp: "",
  instagram: "",
  address: "",
  phone: "",
  website: "",
  watermarkEnabled: true,
  logoPosition: "bottom_right",
  logoSize: "medium",
  logoOpacity: 80,
};
