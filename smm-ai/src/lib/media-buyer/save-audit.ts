import { forceSaveMediaBuyerAudit } from "./recommendations";

/** Принудительное сохранение аудита после синхронизации. */
export async function saveAuditAfterSync(_userId: string): Promise<void> {
  await forceSaveMediaBuyerAudit();
}
