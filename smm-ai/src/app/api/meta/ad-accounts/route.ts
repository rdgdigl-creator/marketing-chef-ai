import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { listMetaAdAccounts, selectMetaAdAccount } from "@/lib/meta";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const accounts = await listMetaAdAccounts(user.id);
  return NextResponse.json({ accounts });
}

type SelectBody = { adAccountId?: string };

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  let body: SelectBody;
  try {
    body = (await request.json()) as SelectBody;
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const adAccountId = body.adAccountId?.trim();
  if (!adAccountId) {
    return NextResponse.json({ error: "Укажите adAccountId" }, { status: 400 });
  }

  try {
    const result = await selectMetaAdAccount(user.id, adAccountId);
    return NextResponse.json({ ok: true, name: result.name });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось выбрать кабинет";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
