import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { META_MOCK_COOKIE } from "@/lib/meta/mock";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("meta_connections")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Не удалось отключить Meta Ads" },
      { status: 500 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(META_MOCK_COOKIE, "", { maxAge: 0, path: "/" });
  return response;
}
