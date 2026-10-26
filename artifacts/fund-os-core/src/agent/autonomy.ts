import { db, type Actor } from "../domain/db";
import { invariantGuard } from "../domain/guard";
import { appendRun } from "../domain/ledger";
export const skills = ["core", "capture", "screen", "monitor", "report", "diligence", "source", "operate"] as const;
export async function changeAutonomy(actor: Actor, skill: string, level: number, reason: string, changeRequestId?: string) {
  await invariantGuard(actor, "policy");
  if (!Number.isInteger(level) || level < 0 || level > 3 || !reason.trim()) throw new Error("INVALID_AUTONOMY");
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(62704201)::text`;
    const old = await tx.autonomyPolicy.findUniqueOrThrow({ where: { firm_id_skill: { firm_id: actor.firmId, skill } } });
    if (level > old.level) {
      const request = await tx.changeRequest.findFirst({ where: { cr_id: changeRequestId ?? "", firm_id: actor.firmId, what: `autonomy:${skill}:${level}`, signed_by: { not: null } } });
      if (!request) throw new Error("SIGNED_CHANGE_REQUEST_REQUIRED");
      const signer = await tx.user.findFirst({ where: { user_id: request.signed_by!, firm_id: actor.firmId, role: "partner" } });
      if (!signer) throw new Error("INVALID_SIGNER");
    }
    const result = await tx.autonomyPolicy.update({ where: { firm_id_skill: { firm_id: actor.firmId, skill } }, data: { level, reason, since: new Date(), change_request_id: changeRequestId ?? null, set_by: actor.userId! } });
    await appendRun(tx, actor, { skill, tool: "human.autonomy", input: { level, reason }, output: result, reason, reviewerId: actor.userId });
    return result;
  });
}
