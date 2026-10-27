import { db, Prisma, withActor, type Actor } from "../domain/db";
import { invariantGuard } from "../domain/guard";
import { appendRun } from "../domain/ledger";
import { gateway } from "../domain/gateway";
import { BudgetStop } from "./budget";
import { planner, plannerInput } from "./planner";
import { isPassing, type Answer } from "./critic";
import { invokeTool } from "./registry";
import { captureContext, flaggedContext, answerFromContext, perceiveContext, resolveContext, criticFromContext } from "./context";
import { queueSourceFlag } from "../domain/jobs";
export async function runEpisode(actor: Actor, orgId: string, options: { intent?: "ask" | "draft" } = {}) {
  return withActor(actor, async () => {
    const { firm } = await invariantGuard(actor, "propose");
    const intent = options.intent ?? "ask";
    const ctx = await captureContext(actor, orgId, intent);
    const policy = await db.autonomyPolicy.findUniqueOrThrow({ where: { firm_id_skill: { firm_id: firm.firm_id, skill: "core" } } });
    if (!policy.level) throw new Error("SKILL_STOPPED");
    const episode = await db.episode.create({ data: {
      firm_id: firm.firm_id, acting_user_id: actor.userId, service_identity: actor.serviceIdentity,
      surface: actor.serviceIdentity ? "schedule" : "builder", trigger: actor.serviceIdentity ? "schedule" : "user",
      skill: "core", intent, goal: `What do we know about ${ctx.orgName}?`,
      context_json: ctx as unknown as Prisma.InputJsonValue, plan_json: {}, status: "running",
    } });
    let seq = 0;
    let draftId: string | undefined;
    let answer: Answer = { text: "Not in the record.", citations: [] };
    const flagged = flaggedContext(ctx);
    const step = (kind: "perceive" | "resolve" | "plan" | "tool" | "critic" | "present" | "learn", output: unknown, toolName?: string, input?: unknown) => db.$transaction(async tx => {
      const run = await appendRun(tx, actor, { skill: "core", episodeId: episode.episode_id, tool: toolName ?? `agent.${kind}`, input: input ?? {}, output, reason: `Episode ${episode.episode_id}: ${kind}`, invariantResults: { guard: "passed", no_external_action: true } });
      return tx.step.create({ data: { episode_id: episode.episode_id, seq: ++seq, kind, tool_name: toolName, tool_version: toolName ? "2" : null, input_ref: JSON.stringify(input ?? {}), output_ref: JSON.stringify(output), run_id: run.run_id } });
    });
    try {
      await step("perceive", perceiveContext(ctx));
      await step("resolve", resolveContext(ctx));
      if (flagged) await queueSourceFlag(actor, episode.episode_id, orgId, ctx.sources.map(source => source.id));
      const plan = await planner(actor, orgId, episode.goal, episode.episode_id);
      await step("plan", { ...plan, sourceFlagged: flagged, toolPolicy: flagged ? "read-only" : "bounded" }, undefined, plannerInput(actor.firmId, orgId, episode.goal));
      for (const action of plan.tools) {
        const current = await db.autonomyPolicy.findUniqueOrThrow({ where: { firm_id_skill: { firm_id: firm.firm_id, skill: "core" } } });
        if (!current.level) throw new Error("SKILL_STOPPED");
        // Invoke the registered read tool, then bind its result to the immutable
        // accepted-input snapshot that will also drive deterministic re-execution.
        const live = await invokeTool(actor, action.name, action.input, flagged) as { text: string; citations: string[] };
        const result = answerFromContext(ctx);
        if (live.text !== result.text || JSON.stringify(live.citations) !== JSON.stringify(result.citations)) throw new Error("RECORD_CHANGED_DURING_EPISODE");
        answer = { text: result.text, citations: result.citations };
        await step("tool", result, action.name, action.input);
      }
      let verdict = criticFromContext(ctx, answer);
      await step("critic", verdict);
      if (!isPassing(verdict)) {
        answer = { text: "Not in the record.", citations: [] };
        const revision = criticFromContext(ctx, answer);
        await step("critic", { ...revision, revision: 1 });
        if (!isPassing(revision)) {
          await db.episode.update({ where: { episode_id: episode.episode_id }, data: { critic_verdict: verdict } });
          throw new Error("CRITIC_BLOCK");
        }
        verdict = revision;
      }
      await db.episode.update({ where: { episode_id: episode.episode_id }, data: { critic_verdict: verdict } });
      if (intent === "draft" && !flagged && answer.citations.length) {
        const input = { episodeId: episode.episode_id, type: "draft", orgId, answer };
        const draft = await invokeTool(actor, "draft_record_note", input, false) as { proposalId: string; state: string };
        draftId = draft.proposalId;
        await step("tool", draft, "draft_record_note", input);
        // A second bounded mock call exercises the budget AFTER a partial draft
        // exists. On exhaustion it is retained, marked stopped and never sent.
        const refinement = await gateway(actor, "complete", { task: "refine_draft", answer }, undefined, { episodeId: episode.episode_id });
        await step("tool", refinement, "gateway.complete", { task: "refine_draft", answer });
      }
      await step("present", answer);
      if (intent !== "ask") await step("learn", { memory: "database_only", automatic_fact_acceptance: false });
      await db.episode.update({ where: { episode_id: episode.episode_id }, data: { status: "done", ended_at: new Date(),
        plan_json: { ...plan, answer, sourceFlagged: flagged, synthetic: true, ...(draftId ? { proposalIds: [draftId] } : {}) } as Prisma.InputJsonValue } });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "UNKNOWN_FAILURE";
      const stopped = error instanceof BudgetStop || reason === "SKILL_STOPPED";
      await db.$transaction(async tx => {
        await invariantGuard(actor, "propose", tx);
        if (stopped && draftId) {
          const draft = await tx.proposal.findFirst({ where: { proposal_id: draftId, firm_id: actor.firmId, state: "proposed", episode_id: episode.episode_id } });
          if (draft) await tx.proposal.update({ where: { proposal_id: draftId }, data: { state: "stopped", version: { increment: 1 }, payload_json: { ...(draft.payload_json as Prisma.InputJsonObject), status: "stopped" } } });
        }
        const question = stopped ? "Budget or autonomy limit reached: keep this partial draft and request an authorized budget or policy review?" : null;
        if (question) await tx.task.create({ data: { firm_id: actor.firmId, owner_id: actor.userId ?? `scheduler:${actor.firmId}`, kind: "review", ref_type: "Episode", ref_id: episode.episode_id, state: "open" } });
        await tx.episode.update({ where: { episode_id: episode.episode_id }, data: { status: stopped ? "stopped" : "failed", ended_at: new Date(),
          plan_json: { failure: reason, sourceFlagged: flagged, flaggedObservations: flagged ? ctx.sources.map(source => source.id) : [], answer, ...(draftId ? { proposalIds: [draftId] } : {}), ...(question ? { question } : {}) } } });
        await appendRun(tx, actor, { skill: "core", episodeId: episode.episode_id, tool: "agent.failure", input: {}, output: { reason, question }, reason, status: stopped ? "stopped" : "failed" });
      });
    }
    return db.episode.findUniqueOrThrow({ where: { episode_id: episode.episode_id }, include: { steps: { orderBy: { seq: "asc" } }, proposalLinks: true } });
  });
}
