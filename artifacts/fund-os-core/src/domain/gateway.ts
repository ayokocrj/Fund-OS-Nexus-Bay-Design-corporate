import { db, type Actor, Prisma } from "./db";
import { identity, assertConsent } from "./guard";
import { hash, canonical } from "./hash";
import { appendRun } from "./ledger";
import { BudgetStop } from "../agent/budget";
export const modalities = ["complete", "see", "transcribe", "speak", "embed"] as const;
export type GatewayModality = typeof modalities[number];
export function mockResult(modality: GatewayModality, input: unknown) {
  const inputHash = hash({ modality, input });
  const input_tokens = Math.max(1, Math.ceil(canonical(input).length / 4));
  const output_tokens = 24;
  const unit_cost = 0.0001;
  return {
    modality, input_hash: inputHash, provider: "deterministic", version: "mock-v2",
    usage: { input_tokens, output_tokens, unit_cost, cost: Number(((input_tokens + output_tokens) * unit_cost).toFixed(8)), synthetic: true },
    fixture: modality === "embed" ? [0.125, 0.25, 0.5, 0.75]
      : modality === "speak" ? { media_ref: "fixture:audio/brief.wav", synthetic: true }
      : modality === "transcribe" ? { text: "Synthetic partner note: the target close remains conditional.", spans: [{ start: 0, end: 4 }] }
      : modality === "see" ? { values: [12, 18, 24], indicative: true, locator: { page: 1, bbox: [40, 40, 200, 120] } }
      : { action: "answer_from_record", instruction: "Cite accepted records only." },
  };
}
export async function gateway(actor: Actor, modality: GatewayModality, input: unknown, convId?: string, options: { episodeId?: string; replay?: boolean } = {}) {
  if (!modalities.includes(modality)) throw new Error("UNSUPPORTED_MODALITY");
  const { firm } = await identity(actor);
  if (modality === "transcribe") {
    if (!convId) throw new Error("CONVERSATION_REQUIRED");
    await assertConsent(convId, actor);
  }
  const result = mockResult(modality, input);
  return db.$transaction(async tx => {
    // The shared ledger lock makes allowance checks and cost reservation atomic.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(62704201)::text`;
    const { firm: currentFirm } = await identity(actor, tx);
    const { validateConfig } = await import("./config");
    const settings = validateConfig(currentFirm.mode, currentFirm.settings);
    if (!settings.providers.some(p => !p.live && p.name === "deterministic" && p.modalities.includes(modality))) throw new Error("MODALITY_NOT_ALLOWED");
    const start = new Date(); start.setUTCDate(1); start.setUTCHours(0, 0, 0, 0);
    const monthly = await tx.run.aggregate({ where: { firm_id: firm.firm_id, started_at: { gte: start } }, _sum: { cost: true } });
    const episode = options.episodeId ? await tx.episode.findFirstOrThrow({ where: { episode_id: options.episodeId, firm_id: actor.firmId } }) : null;
    const cost = new Prisma.Decimal(result.usage.cost);
    if (cost.add(episode?.cost ?? 0).gt(settings.budgets.episode) || cost.add(monthly._sum.cost ?? 0).gt(settings.budgets.monthly)) throw new BudgetStop();
    await appendRun(tx, actor, { skill: "core", tool: `gateway.${options.replay ? "replay." : ""}${modality}`, input, output: result, cost: result.usage.cost, episodeId: options.episodeId, reason: "Synthetic token usage and unit cost: no live provider call" });
    if (episode) await tx.episode.update({ where: { episode_id: episode.episode_id }, data: { cost: { increment: cost } } });
    return result;
  });
}
