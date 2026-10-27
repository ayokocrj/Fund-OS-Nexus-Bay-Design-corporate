import { db, type Actor } from "../domain/db";
import { gateway, type GatewayModality } from "../domain/gateway";
import { hash } from "../domain/hash";
import { answerFromContext, perceiveContext, resolveContext, criticFromContext, flaggedContext, type EpisodeContext } from "./context";
import { planFromMock } from "./planner";
import { isPassing, type Answer } from "./critic";
export async function reexecuteEpisode(actor: Actor, episodeId: string) {
  const episode = await db.episode.findFirstOrThrow({ where: { episode_id: episodeId, firm_id: actor.firmId }, include: { steps: { orderBy: { seq: "asc" } }, proposalLinks: true } });
  const ctx = episode.context_json as unknown as EpisodeContext | null;
  if (!ctx || ctx.version !== 2 || ctx.firmId !== actor.firmId) return { episodeId, mode: "reexecute", verified: false, reason: "LEGACY_CONTEXT_NOT_RECORDED", comparisons: [], gatewayCalls: 0 };
  const runs = await db.run.findMany({ where: { episode_id: episodeId }, orderBy: { seq: "asc" } });
  const gatewayRuns = runs.filter(run => /^gateway\.(complete|see|transcribe|speak|embed)$/.test(run.tool_name));
  const models = new Map<string, Awaited<ReturnType<typeof gateway>>>();
  const gatewayComparisons: { runId: string; expectedHash: string; actualHash: string; matches: boolean }[] = [];
  for (const run of gatewayRuns) {
    const result = await gateway(actor, run.tool_name.split(".")[1] as GatewayModality, run.input_ref, undefined, { replay: true });
    models.set(run.inputs_hash, result);
    const expectedHash = hash(JSON.parse(run.output_ref));
    const actualHash = hash(result);
    gatewayComparisons.push({ runId: run.run_id, expectedHash, actualHash, matches: expectedHash === actualHash });
  }
  let answer: Answer = { text: "Not in the record.", citations: [] };
  let revisions = 0;
  const comparisons = [];
  for (const step of episode.steps) {
    const run = runs.find(run => run.run_id === step.run_id);
    if (!run) throw new Error("STEP_RUN_NOT_FOUND");
    let actual: unknown;
    if (step.kind === "perceive") actual = perceiveContext(ctx);
    else if (step.kind === "resolve") actual = resolveContext(ctx);
    else if (step.kind === "plan") {
      const model = models.get(hash(JSON.parse(step.input_ref ?? "{}")));
      if (!model) throw new Error("REPLAY_MODEL_INPUT_MISSING");
      actual = { ...planFromMock(ctx.orgId, model), sourceFlagged: flaggedContext(ctx), toolPolicy: flaggedContext(ctx) ? "read-only" : "bounded" };
    } else if (step.kind === "tool" && step.tool_name === "answer_from_record") {
      const result = answerFromContext(ctx);
      answer = { text: result.text, citations: result.citations };
      actual = result;
    } else if (step.kind === "critic") {
      if (revisions++) {
        answer = { text: "Not in the record.", citations: [] };
        actual = { ...criticFromContext(ctx, answer), revision: 1 };
      } else actual = criticFromContext(ctx, answer);
    } else if (step.kind === "tool" && step.tool_name === "draft_record_note") {
      // Dry-run the idempotent draft projection: never repeat a side effect.
      const proposal = await db.proposal.findFirstOrThrow({ where: { firm_id: actor.firmId, target_id: ctx.orgId, type: "draft", proposal_id: { in: episode.proposalLinks.map(link => link.proposal_id) } } });
      actual = { proposalId: proposal.proposal_id, state: proposal.state };
    } else if (step.kind === "tool" && step.tool_name === "gateway.complete") actual = models.get(hash(JSON.parse(step.input_ref ?? "{}")));
    else if (step.kind === "present") {
      if (!isPassing(criticFromContext(ctx, answer))) throw new Error("REPLAY_CRITIC_BLOCK");
      actual = answer;
    } else if (step.kind === "learn") actual = { memory: "database_only", automatic_fact_acceptance: false };
    else throw new Error("REPLAY_UNSUPPORTED_STEP");
    const expectedHash = hash(JSON.parse(run.output_ref));
    const actualHash = hash(actual);
    comparisons.push({ seq: step.seq, kind: step.kind, runId: run.run_id, expectedHash, actualHash, matches: expectedHash === actualHash });
  }
  return { episodeId, mode: "reexecute", verified: comparisons.every(row => row.matches) && gatewayComparisons.every(row => row.matches), gatewayCalls: gatewayRuns.length, gatewayComparisons, comparisons, sideEffectsReapplied: false };
}
