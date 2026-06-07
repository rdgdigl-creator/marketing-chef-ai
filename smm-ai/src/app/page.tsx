import { AuthenticatedHome } from "@/components/home/authenticated-home";
import { LandingPage } from "@/components/landing/landing-page";
import { getAuthContext } from "@/lib/auth";
import { getIikoConnectionStatus } from "@/lib/iiko/connection-status";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { user, profile, email } = await getAuthContext();

  if (!user) {
    return <LandingPage />;
  }

  const iiko = await getIikoConnectionStatus(user.id);
  const displayName =
    profile?.fullName?.trim() ||
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    profile?.restaurantName?.trim() ||
    email ||
    null;

  return <AuthenticatedHome displayName={displayName} iiko={iiko} />;
}
