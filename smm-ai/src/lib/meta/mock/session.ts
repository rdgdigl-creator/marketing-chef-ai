import { cookies } from "next/headers";

export const META_MOCK_COOKIE = "meta_mock_session";

export type MetaMockSession = {
  connected: boolean;
  selectedAccountId: string | null;
  synced: boolean;
  lastSyncAt: string | null;
};

const EMPTY: MetaMockSession = {
  connected: false,
  selectedAccountId: null,
  synced: false,
  lastSyncAt: null,
};

export async function getMetaMockSession(): Promise<MetaMockSession> {
  const jar = await cookies();
  const raw = jar.get(META_MOCK_COOKIE)?.value;
  if (!raw) return { ...EMPTY };

  try {
    const parsed = JSON.parse(raw) as MetaMockSession;
    return {
      connected: Boolean(parsed.connected),
      selectedAccountId: parsed.selectedAccountId ?? null,
      synced: Boolean(parsed.synced),
      lastSyncAt: parsed.lastSyncAt ?? null,
    };
  } catch {
    return { ...EMPTY };
  }
}

export function serializeMockSession(session: MetaMockSession): string {
  return JSON.stringify(session);
}

export function createConnectedMockSession(accountId: string): MetaMockSession {
  return {
    connected: true,
    selectedAccountId: accountId,
    synced: false,
    lastSyncAt: null,
  };
}

export function createSyncedMockSession(accountId: string): MetaMockSession {
  return {
    connected: true,
    selectedAccountId: accountId,
    synced: true,
    lastSyncAt: new Date().toISOString(),
  };
}
