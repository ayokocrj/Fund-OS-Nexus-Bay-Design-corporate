import { db, type Actor, type Tx, Prisma } from "./db";
import { invariantGuard } from "./guard";
import { appendRun } from "./ledger";
import { critic, type Answer } from "../agent/critic";
export const externalTypes = ["crm_update", "document_request"];
export async function propose(actor: Actor, episodeId: string, type: "draft" | "crm_update" | "document_request" | "fact", targetId: string, answer: Answer) {
  await invariantGuard(actor, "propose");
  const policy = await db.autonomyPolicy.findUnique({ where: { firm_id_skill: { firm_id: actor.firmId, skill: "core" } } });
  if (!policy || policy.level === 0) throw new Error("AUTONOMY_DISABLED");
  const verdict = await critic(actor, answer);
  if (!verdict.passed) throw new Error(`CRITIC_BLOCK:${verdict.reasons.join(",")}`);
  return db.$transaction(async tx => {
    await invariantGuard(actor, "propose", tx);
    const episode = await tx.episode.findFirst({ where: { episode_id: episodeId, firm_id: actor.firmId } });
    if (!episode || episode.critic_verdict !== "passed") throw new Error("CRITIC_VERDICT_REQUIRED");
    const organisation = await tx.organisation.findFirst({ where: { org_id: targetId, firm_id: actor.firmId } });
    if (!organisation) throw new Error("TARGET_SCOPE");
    const proposal = await tx.proposal.create({ data: {
      firm_id: actor.firmId, episode_id: episodeId, type, target_type: "Organisation", target_id: targetId,
      payload_json: { ...answer, snapshot: verdict, synthetic: true },
    } });
    await appendRun(tx, actor, { skill: "core", tool: "propose.record_note", input: { episodeId, type, targetId }, output: proposal, reason: "Guard and critic passed; human review required" });
    return proposal;
  });
}
export async function reviewProposal(actor: Actor, proposalId: string, action: "accepted" | "edited" | "rejected" | "confirmed", version: number, text?: string) {
  await invariantGuard(actor, "review");
  return db.$transaction(async tx => {
    await invariantGuard(actor, "review", tx);
    const proposal = await tx.proposal.findFirst({ where: { proposal_id: proposalId, firm_id: actor.firmId } });
    if (!proposal) throw new Error("PROPOSAL_NOT_FOUND");
    if (proposal.version !== version) throw new Error("VERSION_CONFLICT");
    const external = externalTypes.includes(proposal.type);
    if (action === "confirmed" && !external) throw new Error("EXTERNAL_TYPE_REQUIRED");
    if (action === "accepted" && external) throw new Error("EXTERNAL_CONFIRMATION_REQUIRED");
    if (!["proposed", "edited"].includes(proposal.state)) throw new Error("TERMINAL_REVIEW_STATE");
    const payload = proposal.payload_json as Record<string, Prisma.InputJsonValue>;
    if (action === "edited" && !text?.trim()) throw new Error("EDIT_TEXT_REQUIRED");
    const changed = action === "edited" ? { ...payload, text: text!.trim() } : payload;
    const result = await tx.proposal.updateMany({
      where: { proposal_id: proposalId, firm_id: actor.firmId, version, state: proposal.state },
      data: { state: action, version: { increment: 1 }, payload_json: changed,
        reviewer_id: actor.userId!, reviewed_at: new Date(),
        edit_diff: action === "edited" ? { from: payload.text, to: text!.trim() } : Prisma.JsonNull },
    });
    if (result.count !== 1) throw new Error("VERSION_CONFLICT");
    // No generic Fact-writing endpoint: phase 0 reviews draft/outbox proposals.
    // A later skill must validate a typed, source-backed fact before acceptance.
    if (proposal.type === "fact" && action === "accepted") throw new Error("TYPED_FACT_ACCEPTANCE_NOT_IMPLEMENTED");
    const updated = await tx.proposal.findUniqueOrThrow({ where: { proposal_id: proposalId } });
    await appendRun(tx, actor, { skill: "core", tool: "human.review", input: { proposalId, action, version }, output: updated, reason: "Explicit human action; no external execution", reviewerId: actor.userId });
    return updated;
  });
}
// Deliberately no apply/send adapter in Phase 0. Confirmation records a person,
// not permission for an agent to execute an arbitrary external side effect.
