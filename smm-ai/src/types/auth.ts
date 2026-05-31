export type UserTariff = "free" | "pro" | "business";

export type UserProfile = {
  id: string;
  fullName: string;
  restaurantName: string;
  logoUrl: string | null;
  phone: string;
  tariff: UserTariff;
  createdAt: string;
  updatedAt: string;
};

export type UserProfileInput = {
  fullName: string;
  restaurantName: string;
  logoUrl: string | null;
  phone: string;
};

export const TARIFF_LABELS: Record<UserTariff, string> = {
  free: "Бесплатный",
  pro: "Pro",
  business: "Business",
};
