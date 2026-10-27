import { db, type Actor } from "./db";
import { invariantGuard } from "./guard";
import { appendRun } from "./ledger";
export async function queueSourceFlag(actor: Actor, episodeId: string, orgId: string, observations: string[]) {
  await invariantGuard(actor, "propose");
  // Deterministic operational warning, not a source-derived model output.
  return db.$transaction(async tx => {
    await invariantGuard(actor, "propose", tx);
    const task = await tx.task.create({ data: {
      firm_id: actor.firmId, owner_id: actor.userId ?? `scheduler:${actor.firmId}`,
      kind: "review", ref_type: "SourceFlag", ref_id: episodeId, state: "open",
    } });
    await appendRun(tx, actor, { skill: "core", episodeId, tool: "task.source_flag", input: { episodeId, orgId, observations }, output: task, reason: "Deterministic safety warning, not a business proposal and never follows source instructions" });
    return task;
  });
}
