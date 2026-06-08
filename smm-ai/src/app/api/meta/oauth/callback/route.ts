import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { META_OAUTH_SCOPES } from "@/lib/meta/config";
import { MetaGraphClient } from "@/lib/meta/client";
import { syncMetaAdAccountsFromGraph } from "@/lib/meta/ad-accounts";
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  tokenExpiresAt,
} from "@/lib/meta/oauth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const STATE_COOKIE = "meta_oauth_state";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error_description") ?? searchParams.get("error");

  const integrationsUrl = new URL("/profile/integrations", origin);

  if (oauthError) {
    integrationsUrl.searchParams.set("meta_error", oauthError);
    return NextResponse.redirect(integrationsUrl);
  }

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?redirect=/profile/integrations", origin));
  }

  const cookieState = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${STATE_COOKIE}=`))
    ?.slice(STATE_COOKIE.length + 1);

  if (!code || !state || !cookieState || state !== cookieState) {
    integrationsUrl.searchParams.set("meta_error", "Неверный OAuth state");
    return NextResponse.redirect(integrationsUrl);
  }

  try {
    const shortToken = await exchangeCodeForToken(code, origin);
    const longToken = await exchangeForLongLivedToken(shortToken.accessToken);
    const client = new MetaGraphClient(longToken.accessToken);
    const metaUser = await client.getMe();

    const supabase = await createSupabaseServerClient();
    const expiresAt = tokenExpiresAt(longToken.expiresIn);

    const { data: connection, error } = await supabase
      .from("meta_connections")
      .upsert(
        {
          user_id: user.id,
          meta_user_id: metaUser.id,
          meta_user_name: metaUser.name,
          access_token: longToken.accessToken,
          token_expires_at: expiresAt,
          scopes: [...META_OAUTH_SCOPES],
          sync_status: "connected",
          error_message: null,
        },
        { onConflict: "user_id" },
      )
      .select("id, selected_ad_account_id")
      .single();

    if (error || !connection) {
      throw new Error(error?.message ?? "Не удалось сохранить подключение Meta");
    }

    const accounts = await syncMetaAdAccountsFromGraph(
      user.id,
      connection.id,
      longToken.accessToken,
    );

    if (accounts.length === 1 && !connection.selected_ad_account_id) {
      await supabase
        .from("meta_connections")
        .update({ selected_ad_account_id: accounts[0].id })
        .eq("id", connection.id);

      await supabase
        .from("meta_ad_accounts")
        .update({ is_selected: true })
        .eq("connection_id", connection.id)
        .eq("meta_account_id", accounts[0].id);
    }

    integrationsUrl.searchParams.set("meta", "connected");
    const response = NextResponse.redirect(integrationsUrl);
    response.cookies.set(STATE_COOKIE, "", { maxAge: 0, path: "/" });
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось подключить Meta Ads";
    integrationsUrl.searchParams.set("meta_error", message);
    return NextResponse.redirect(integrationsUrl);
  }
}
