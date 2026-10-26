import { db, type Actor } from "./db";
import { invariantGuard } from "./guard";
import { appendRun } from "./ledger";
export async function queueSourceFlag(actor: Actor, episodeId: string, orgId: string, observations: string[]) {
  await invariantGuard(actor, "propose");
  // Deterministic operational warning, not a source-derived model output.
  return db.$transaction(async tx => {
    await invariantGuard(actor, "propose", tx);
    const proposal = await tx.proposal.create({ data: {
      firm_id: actor.firmId, episode_id: episodeId, type: "task", target_type: "Organisation", target_id: orgId,
      payload_json: { text: "Untrusted source instructions detected. Human source review required.", citations: observations, sourceFlagged: true, synthetic: true },
    } });
    await appendRun(tx, actor, { skill: "core", tool: "propose.source_flag", input: { episodeId }, output: proposal, reason: "Deterministic source safety warning, never follows source instructions" });
    return proposal;
  });
}
