import { db, Prisma, withActor, type Actor } from "../domain/db";
import { invariantGuard } from "../domain/guard";
import { validateConfig } from "../domain/config";
import { appendRun } from "../domain/ledger";
import { checkBudget } from "./budget";
import { planner } from "./planner";
import { critic, type Answer } from "./critic";
import { invokeTool } from "./registry";
import { detectInstructions, encloseUntrusted } from "./untrusted";
import { queueSourceFlag } from "../domain/jobs";
export async function runEpisode(actor: Actor, orgId: string) {
  return withActor(actor, async () => {
    const { firm } = await invariantGuard(actor, "propose");
    const org = await db.organisation.findFirst({ where: { org_id: orgId, firm_id: firm.firm_id } });
    if (!org) throw new Error("ORGANISATION_NOT_FOUND");
    const settings = validateConfig(firm.mode, firm.settings);
    const policy = await db.autonomyPolicy.findUniqueOrThrow({ where: { firm_id_skill: { firm_id: firm.firm_id, skill: "core" } } });
    if (policy.level === 0) throw new Error("SKILL_STOPPED");
    const episode = await db.episode.create({ data: {
      firm_id: firm.firm_id, acting_user_id: actor.userId, service_identity: actor.serviceIdentity,
      surface: actor.serviceIdentity ? "schedule" : "builder", trigger: actor.serviceIdentity ? "schedule" : "user",
      skill: "core", goal: `What do we know about ${org.legal_name}?`,
      plan_json: {}, status: "running",
    } });
    let seq = 0;
    const step = async (kind: "perceive" | "resolve" | "plan" | "tool" | "critic" | "present" | "learn", output: unknown, toolName?: string, input?: unknown) => db.$transaction(async tx => {
      const run = await appendRun(tx, actor, { skill: "core", tool: toolName ?? `agent.${kind}`, input: input ?? { episodeId: episode.episode_id }, output, reason: `Episode ${episode.episode_id}; ${kind}`, invariantResults: { guard: "passed", no_external_action: true } });
      return tx.step.create({ data: { episode_id: episode.episode_id, seq: ++seq, kind, tool_name: toolName, tool_version: toolName ? "1" : null,
        input_ref: JSON.stringify(input ?? {}), output_ref: JSON.stringify(output), run_id: run.run_id } });
    });
    try {
      await checkBudget(firm.firm_id, 0, 0, settings);
      const sourceDocs = await db.document.findMany({ where: { firm_id: firm.firm_id, owner_type: "Organisation", owner_id: org.org_id } });
      const perceived = await db.observation.findMany({ where: { doc_id: { in: sourceDocs.map(doc => doc.doc_id) } } });
      let flagged = perceived.some(source => detectInstructions(source.text).flagged);
      await step("perceive", { organisation: org.org_id, synthetic: true, sourceFlagged: flagged, sources: perceived.map(source => encloseUntrusted(source.text, { observation: source.obs_id, document: source.doc_id, locator: source.locator_json })) });
      await step("resolve", { firm: firm.firm_id, organisation: org.legal_name });
      if (flagged) await queueSourceFlag(actor, episode.episode_id, org.org_id, perceived.filter(source => detectInstructions(source.text).flagged).map(source => source.obs_id));
      const plan = await planner(actor, org.org_id, episode.goal);
      await step("plan", { ...plan, sourceFlagged: flagged, toolPolicy: flagged ? "read-only" : "bounded" });
      let answer: Answer = { text: "Not in the record.", citations: [] };
      for (const action of plan.tools) {
        // A kill switch is checked again before every tool, not just on start.
        const current = await db.autonomyPolicy.findUniqueOrThrow({ where: { firm_id_skill: { firm_id: firm.firm_id, skill: "core" } } });
        if (current.level === 0) throw new Error("SKILL_STOPPED");
        await checkBudget(firm.firm_id, 0, 0, settings);
        const result = await invokeTool(actor, action.name, action.input, flagged) as { text: string; citations: string[]; sources: { content: string }[] };
        flagged ||= result.sources.some(source => detectInstructions(source.content).flagged);
        answer = { text: result.text, citations: result.citations };
        await step("tool", result, action.name, action.input);
      }
      let verdict = await critic(actor, answer);
      await step("critic", verdict);
      if (!verdict.passed) {
        // One revision, never invent evidence to overcome a block.
        answer = { text: "Not in the record.", citations: [] };
        const second = await critic(actor, answer);
        await step("critic", { ...second, revision: 1, priorBlock: verdict.reasons, sourceFlagged: flagged });
        if (flagged || !second.passed) throw new Error(`CRITIC_BLOCK:${verdict.reasons.join(",")}`);
        verdict = second;
      }
      await db.episode.update({ where: { episode_id: episode.episode_id }, data: { critic_verdict: "passed" } });
      if (!flagged && answer.citations.length) {
        await invokeTool(actor, "propose_record_note", { episodeId: episode.episode_id, type: "draft", orgId: org.org_id, answer }, flagged);
        await invokeTool(actor, "propose_record_note", { episodeId: episode.episode_id, type: "crm_update", orgId: org.org_id, answer }, flagged);
      }
      await step("present", answer);
      await step("learn", { memory: "database_only", automatic_fact_acceptance: false });
      await db.episode.update({ where: { episode_id: episode.episode_id }, data: {
        status: "done", ended_at: new Date(), cost: 0,
        plan_json: { ...plan, answer, sourceFlagged: flagged, synthetic: true } as Prisma.InputJsonValue,
      } });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "UNKNOWN_FAILURE";
      await db.$transaction(async tx => {
        await tx.episode.update({ where: { episode_id: episode.episode_id }, data: { status: reason === "SKILL_STOPPED" ? "stopped" : "failed", critic_verdict: reason.startsWith("CRITIC") ? "blocked" : "not_presented", ended_at: new Date(), plan_json: { failure: reason, sourceFlagged: /INSTRUCTION/.test(reason) } } });
        await appendRun(tx, actor, { skill: "core", tool: "agent.failure", input: { episodeId: episode.episode_id }, output: { reason }, reason, status: "failed" });
      });
    }
    return db.episode.findUniqueOrThrow({ where: { episode_id: episode.episode_id }, include: { steps: { orderBy: { seq: "asc" } } } });
  });
}
