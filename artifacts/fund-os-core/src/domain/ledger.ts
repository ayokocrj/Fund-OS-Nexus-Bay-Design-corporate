import { db, withActor, type Actor, type Tx, Prisma } from "./db";
import { hash, canonical } from "./hash";
import { invariantGuard } from "./guard";

export type EventInput = {
  skill: string; tool: string; input: unknown; output: unknown;
  reason: string; status?: string; provider?: string; cost?: number;
  reviewerId?: string; invariantResults?: Prisma.InputJsonValue;
  episodeId?: string;
};
const genesis = "0".repeat(64);
function hashBody(row: Record<string, unknown>) {
  const { run_id: _id, hash: _hash, seq: _seq, ...body } = row;
  if (body.hash_version === 1) {
    const { hash_version: _v, episode_id: _e, input_ref: _i, ...legacy } = body;
    return legacy;
  }
  return body;
}
export async function appendRun(tx: Tx, actor: Actor, event: EventInput) {
  // Global transaction-scoped lock serializes the hash chain, including workers.
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(62704201)::text`;
  const previous = await tx.run.findFirst({ orderBy: { seq: "desc" } });
  const body = {
    firm_id: actor.firmId, skill: event.skill, tool_name: event.tool,
    started_at: new Date(), inputs_hash: hash(event.input),
    provider: event.provider ?? "deterministic", model_version: event.tool.startsWith("gateway.") ? "mock-v2" : "core-v2",
    prompt_version: "core/v2", temperature: 0, seed: 0,
    output_ref: canonical(event.output), reason: event.reason,
    cost: new Prisma.Decimal(event.cost ?? 0), latency_ms: 0,
    status: event.status ?? "ok", invariant_results: event.invariantResults ?? { guard: "passed" },
    reviewer_id: event.reviewerId ?? null, prev_hash: previous?.hash ?? genesis,
    hash_version: 2, episode_id: event.episodeId ?? null,
    input_ref: JSON.parse(canonical(event.input ?? {})) as Prisma.InputJsonValue,
  };
  return tx.run.create({ data: { ...body, hash: hash(body) } });
}
export async function recordRun(actor: Actor, event: EventInput) {
  await invariantGuard(actor, event.tool.startsWith("read") ? "read" : "propose");
  return db.$transaction(tx => appendRun(tx, actor, event));
}
export async function verifyChain(options: { full?: boolean } = {}) {
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(62704202)::text`;
    const checkpoint = options.full ? null : await tx.ledgerCheckpoint.findUnique({ where: { key: "global" } });
    const fromSeq = checkpoint?.last_seq ?? 0;
    let previous = checkpoint?.last_hash ?? genesis;
    const failures: string[] = [];
    if (checkpoint) {
      const anchor = await tx.run.findUnique({ where: { seq: checkpoint.last_seq } });
      if (!anchor || anchor.hash !== checkpoint.last_hash || hash(hashBody(anchor as unknown as Record<string, unknown>)) !== anchor.hash) failures.push("CHECKPOINT_ANCHOR");
    }
    const rows = await tx.run.findMany({ where: { seq: { gt: fromSeq } }, orderBy: { seq: "asc" } });
    for (const row of rows) {
      if (row.prev_hash !== previous || hash(hashBody(row as unknown as Record<string, unknown>)) !== row.hash) failures.push(row.run_id);
      previous = row.hash;
    }
    const verifiedAt = new Date();
    const valid = failures.length === 0;
    if (valid && (rows.length || !checkpoint)) await tx.ledgerCheckpoint.upsert({
      where: { key: "global" },
      create: { key: "global", last_seq: rows.at(-1)?.seq ?? 0, last_hash: previous, verified_at: verifiedAt, valid },
      update: { last_seq: rows.at(-1)?.seq ?? fromSeq, last_hash: previous, verified_at: verifiedAt, valid },
    });
    return { valid, count: await tx.run.count(), checked: rows.length, fromSeq, incremental: !options.full, verified_at: verifiedAt.toISOString(), failures };
  }, { timeout: 30000 });
}
export async function explain(actor: Actor, id: string) {
  await invariantGuard(actor, "read");
  return db.run.findFirstOrThrow({ where: { run_id: id, firm_id: actor.firmId } });
}
async function snapshotReplay(actor: Actor, episodeId: string) {
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
  for (const step of episode.steps.filter(row => row.kind === "tool" && row.tool_name === "answer_from_record")) {
    const snapshot = JSON.parse(step.output_ref ?? "{}") as { text: string; citations: string[]; sources: { id: string; content: string }[] };
    for (const source of snapshot.sources ?? []) {
      const current = await db.observation.findUnique({ where: { obs_id: source.id } });
      if (!current || current.text !== source.content) evidenceMatches = false;
    }
    // Re-run the extractive fixture interpretation against the recorded immutable
    // evidence, not a potentially changed current fact table.
    if (snapshot.text !== "Not in the record." && snapshot.text.split("\n").some(line => !snapshot.sources.some(source => source.content.includes(line)))) evidenceMatches = false;
  }
  const runHashesMatch = runs.every(run => hash(hashBody(run as unknown as Record<string, unknown>)) === run.hash);
  return { episodeId, mode: "snapshot" as const, verified: chain.valid && linksMatch && evidenceMatches && runHashesMatch && runs.length === episode.steps.length, outputHash: hash(outputs), steps: outputs };
}
export async function replay(actor: Actor, episodeId: string, mode: "snapshot" | "reexecute" = "snapshot") {
  return withActor(actor, async () => {
    const integrity = await snapshotReplay(actor, episodeId);
    if (mode === "snapshot") return integrity;
    const { reexecuteEpisode } = await import("../agent/reexecute");
    const execution = await reexecuteEpisode(actor, episodeId);
    return { ...execution, verified: integrity.verified && execution.verified, integrity: integrity.verified };
  });
}
