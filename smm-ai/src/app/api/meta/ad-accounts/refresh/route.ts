import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { refreshMetaAdAccountsFromGraph } from "@/lib/meta/ad-accounts";

export const dynamic = "force-dynamic";

/** Перечитать /me/adaccounts, сохранить в БД, автопривязать первый кабинет. */
export async function POST() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  try {
    const result = await refreshMetaAdAccountsFromGraph(user.id);
    return NextResponse.json({
      ok: true,
      count: result.accounts.length,
      accounts: result.accounts.map((a) => ({
        id: a.id,
        name: a.name,
        currency: a.currency,
        accountStatus: a.accountStatus,
      })),
      selectedAdAccountId: result.selectedId,
      selectedAdAccountName: result.selectedName,
      autoSelected: result.autoSelected,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось обновить кабинеты";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
