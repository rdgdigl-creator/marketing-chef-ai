import { NextResponse } from "next/server";
import { getMetaAppId, getMetaAppSecret, isMetaConfigured } from "@/lib/meta/config";
import {
  canUseMetaOAuth,
  getMetaDataSource,
  isMetaMockMode,
} from "@/lib/meta/data-source";

export const dynamic = "force-dynamic";

/** Публичная диагностика Meta env (без секретов). */
export async function GET() {
  const metaUseMock = process.env.META_USE_MOCK?.trim() ?? null;

  return NextResponse.json({
    configured: isMetaConfigured(),
    hasAppId: Boolean(getMetaAppId()),
    hasAppSecret: Boolean(getMetaAppSecret()),
    metaUseMock,
    mockMode: isMetaMockMode(),
    dataSource: getMetaDataSource(),
    oauthAvailable: canUseMetaOAuth(),
  });
}
