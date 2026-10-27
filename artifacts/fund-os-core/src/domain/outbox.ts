import { db, type Actor, Prisma } from "./db";
import { invariantGuard } from "./guard";
import { appendRun } from "./ledger";
import { hash } from "./hash";
import { critic, isPassing, type Answer } from "../agent/critic";
import { validateConfig } from "./config";
export const externalTypes = ["crm_update", "document_request"];
const activeStates = ["proposed", "accepted", "edited", "confirmed"] as const;
export async function propose(actor: Actor, episodeId: string, type: "draft" | "crm_update" | "document_request" | "fact", targetId: string, answer: Answer) {
  await invariantGuard(actor, "propose");
  const policy = await db.autonomyPolicy.findUnique({ where: { firm_id_skill: { firm_id: actor.firmId, skill: "core" } } });
  if (!policy?.level) throw new Error("AUTONOMY_DISABLED");
  const verdict = await critic(actor, answer);
  if (!isPassing(verdict) || !answer.citations.length) throw new Error("CRITIC_BLOCK");
  const semantic = { type, target: targetId, field: "accepted_note", value: answer.text, obs_id: answer.citations[0] };
  const identityKey = hash({ firm: actor.firmId, ...semantic });
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(62704201)::text`;
    await invariantGuard(actor, "propose", tx);
    const episode = await tx.episode.findFirst({ where: { episode_id: episodeId, firm_id: actor.firmId } });
    if (!episode || !isPassing(episode.critic_verdict)) throw new Error("CRITIC_VERDICT_REQUIRED");
    if (!await tx.organisation.findFirst({ where: { org_id: targetId, firm_id: actor.firmId } })) throw new Error("TARGET_SCOPE");
    // Include pre-review rows that have no identity key. Preserve historical
    // duplicate/confirmed records; never erase the evidence of earlier behavior.
    const candidates = await tx.proposal.findMany({ where: { firm_id: actor.firmId, type, target_id: targetId, state: { in: [...activeStates] } }, orderBy: { proposal_id: "asc" } });
    const existing = candidates.find(row => {
      if (row.identity_key === identityKey) return true;
      const payload = row.payload_json as Record<string, unknown>;
      const diff = row.edit_diff as { from?: unknown } | null;
      return (payload.field ?? "accepted_note") === semantic.field
        && (payload.value ?? diff?.from ?? payload.text) === semantic.value
        && (payload.obs_id ?? (payload.citations as string[] | undefined)?.[0]) === semantic.obs_id;
    });
    const proposal = existing ?? await tx.proposal.create({ data: {
      firm_id: actor.firmId, episode_id: episodeId, type, target_type: "Organisation", target_id: targetId,
      identity_key: identityKey, payload_json: { ...answer, ...semantic, snapshot: verdict, synthetic: true },
    } });
    await tx.episodeProposal.upsert({ where: { episode_id_proposal_id: { episode_id: episodeId, proposal_id: proposal.proposal_id } },
      create: { episode_id: episodeId, proposal_id: proposal.proposal_id }, update: {} });
    await appendRun(tx, actor, { skill: "core", tool: existing ? "proposal.link_existing" : "draft.record_note", episodeId, input: semantic,
      output: { proposalId: proposal.proposal_id, reused: !!existing }, reason: existing ? "Semantic idempotency: linked existing proposal" : "Explicit draft/extraction request: guard and critic passed" });
    return proposal;
  });
}
export async function reviewProposal(actor: Actor, proposalId: string, action: "accepted" | "edited" | "rejected" | "confirmed", version: number, text?: string) {
  await invariantGuard(actor, "review");
  return db.$transaction(async tx => {
    const { firm, user } = await invariantGuard(actor, "review", tx);
    const proposal = await tx.proposal.findFirst({ where: { proposal_id: proposalId, firm_id: actor.firmId } });
    if (!proposal) throw new Error("PROPOSAL_NOT_FOUND");
    if (proposal.version !== version) throw new Error("VERSION_CONFLICT");
    const external = externalTypes.includes(proposal.type);
    if (action === "confirmed" && !external) throw new Error("EXTERNAL_TYPE_REQUIRED");
    if (action === "accepted" && external) throw new Error("EXTERNAL_CONFIRMATION_REQUIRED");
    if (action === "confirmed" && !validateConfig(firm.mode, firm.settings).permissions.outboxConfirmRoles.includes(user!.role as "partner" | "analyst" | "ops")) throw new Error("OUTBOX_ROLE_FORBIDDEN");
    if (action === "accepted" && proposal.type === "fact" && !["analyst", "partner"].includes(user!.role)) throw new Error("FACT_ROLE_FORBIDDEN");
    if (proposal.state !== "proposed") throw new Error("TERMINAL_REVIEW_STATE");
    const payload = proposal.payload_json as Record<string, Prisma.InputJsonValue>;
    if (action === "edited" && !text?.trim()) throw new Error("EDIT_TEXT_REQUIRED");
    const changed = action === "edited" ? { ...payload, text: text!.trim() } : payload;
    const result = await tx.proposal.updateMany({
      where: { proposal_id: proposalId, firm_id: actor.firmId, version, state: "proposed" },
      data: { state: action, version: { increment: 1 }, payload_json: changed,
        reviewer_id: actor.userId!, reviewed_at: new Date(),
        edit_diff: action === "edited" ? { from: payload.text, to: text!.trim() } : Prisma.JsonNull },
    });
    if (result.count !== 1) throw new Error("VERSION_CONFLICT");
    const updated = await tx.proposal.findUniqueOrThrow({ where: { proposal_id: proposalId } });
    const run = await appendRun(tx, actor, { skill: "core", tool: "human.review", input: { proposalId, action, version }, output: updated, reason: "Authorized, explicit human action: no external execution", reviewerId: actor.userId });
    if (proposal.type === "fact" && action === "accepted") {
      if (typeof payload.field !== "string" || typeof payload.value !== "string" || payload.value !== payload.text || typeof payload.obs_id !== "string") throw new Error("TYPED_FACT_REQUIRED");
      const now = new Date();
      await tx.organisationFact.updateMany({ where: { org_id: proposal.target_id, field: payload.field, valid_to: null }, data: { valid_to: now } });
      await tx.organisationFact.create({ data: { org_id: proposal.target_id, field: payload.field, value: payload.value, obs_id: payload.obs_id, source_type: "human_accepted", confidence: 1, valid_from: now, run_id: run.run_id, reviewer_id: actor.userId! } });
    }
    return updated;
  });
}
