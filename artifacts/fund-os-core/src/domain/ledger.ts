import { db, type Actor, type Tx, Prisma } from "./db";
import { hash, canonical } from "./hash";
import { invariantGuard } from "./guard";

export type EventInput = {
  skill: string; tool: string; input: unknown; output: unknown;
  reason: string; status?: string; provider?: string; cost?: number;
  reviewerId?: string; invariantResults?: Prisma.InputJsonValue;
};
const genesis = "0".repeat(64);
function hashBody(row: Record<string, unknown>) {
  const { run_id: _id, hash: _hash, seq: _seq, ...body } = row;
  return body;
}
export async function appendRun(tx: Tx, actor: Actor, event: EventInput) {
  // Global transaction-scoped lock serializes the hash chain, including workers.
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(62704201)::text`;
  const previous = await tx.run.findFirst({ orderBy: { seq: "desc" } });
  const body = {
    firm_id: actor.firmId, skill: event.skill, tool_name: event.tool,
    started_at: new Date(), inputs_hash: hash(event.input),
    provider: event.provider ?? "deterministic", model_version: "mock-v1",
    prompt_version: "core/v1", temperature: 0, seed: 0,
    output_ref: canonical(event.output), reason: event.reason,
    cost: new Prisma.Decimal(event.cost ?? 0), latency_ms: 0,
    status: event.status ?? "ok", invariant_results: event.invariantResults ?? { guard: "passed" },
    reviewer_id: event.reviewerId ?? null, prev_hash: previous?.hash ?? genesis,
  };
  return tx.run.create({ data: { ...body, hash: hash(body) } });
}
export async function recordRun(actor: Actor, event: EventInput) {
  await invariantGuard(actor, event.tool.startsWith("read") ? "read" : "propose");
  return db.$transaction(tx => appendRun(tx, actor, event));
}
export async function verifyChain() {
  const rows = await db.run.findMany({ orderBy: { seq: "asc" } });
  let previous = genesis;
  const failures: string[] = [];
  for (const row of rows) {
    if (row.prev_hash !== previous || hash(hashBody(row as unknown as Record<string, unknown>)) !== row.hash) failures.push(row.run_id);
    previous = row.hash;
  }
  return { valid: failures.length === 0, count: rows.length, failures };
}
export async function explain(actor: Actor, id: string) {
  await invariantGuard(actor, "read");
  return db.run.findFirstOrThrow({ where: { run_id: id, firm_id: actor.firmId } });
}
export async function replay(actor: Actor, episodeId: string) {
  await invariantGuard(actor, "read");
  const episode = await db.episode.findFirstOrThrow({ where: { episode_id: episodeId, firm_id: actor.firmId }, include: { steps: { orderBy: { seq: "asc" } } } });
  const runs = await db.run.findMany({ where: { run_id: { in: episode.steps.flatMap(s => s.run_id ? [s.run_id] : []) } } });
  const chain = await verifyChain();
  const outputs = episode.steps.map(step => ({ seq: step.seq, kind: step.kind, output: step.output_ref, runHash: runs.find(r => r.run_id === step.run_id)?.hash }));
  const linksMatch = episode.steps.every(step => {
    const run = runs.find(row => row.run_id === step.run_id);
    return run && canonical(JSON.parse(run.output_ref)) === canonical(JSON.parse(step.output_ref ?? "null"));
  });
  let evidenceMatches = true;
  for (const step of episode.steps.filter(row => row.kind === "tool")) {
    const snapshot = JSON.parse(step.output_ref ?? "{}") as { text: string; citations: string[]; sources: { id: string; content: string }[] };
    for (const source of snapshot.sources ?? []) {
      const current = await db.observation.findUnique({ where: { obs_id: source.id } });
      if (!current || current.text !== source.content) evidenceMatches = false;
    }
    // Re-run the extractive fixture interpretation against the recorded immutable
    // evidence, not a potentially changed current fact table.
    if (snapshot.text !== "Not in the record." && snapshot.text.split("\n").some(line => !snapshot.sources.some(source => source.content.includes(line)))) evidenceMatches = false;
  }
  return { episodeId, mode: "deterministic_evidence_snapshot", verified: chain.valid && linksMatch && evidenceMatches && runs.length === episode.steps.length, outputHash: hash(outputs), steps: outputs };
}
