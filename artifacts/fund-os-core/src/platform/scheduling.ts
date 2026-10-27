import { db, type Actor } from "../domain/db";
import { recordRun, verifyChain, appendRun } from "../domain/ledger";
export interface Scheduler { heartbeat(actor: Actor): Promise<string> }
export class ManualDemoScheduler implements Scheduler {
  async heartbeat(actor: Actor) {
    const result = await recordRun(actor, { skill: "core", tool: "job.heartbeat", input: { manual: true }, output: { healthy: true }, reason: "Manual demo job; no external scheduler" });
    return result.run_id;
  }
}
export async function runNightlyVerification(day = new Date().toISOString().slice(0, 10)) {
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(62704203)::text`;
    const existing = await tx.run.findFirst({ where: { tool_name: "job.ledger.nightly", input_ref: { path: ["day"], equals: day } } });
    if (existing) return { executed: false, runId: existing.run_id };
    const firm = await tx.firm.findFirstOrThrow({ orderBy: { firm_id: "asc" } });
    const verification = await verifyChain();
    const run = await appendRun(tx, { firmId: firm.firm_id, serviceIdentity: `scheduler:${firm.firm_id}` }, {
      skill: "core", tool: "job.ledger.nightly", input: { day }, output: verification, reason: "Nightly incremental verification from the persisted checkpoint", status: verification.valid ? "ok" : "failed",
    });
    return { executed: true, runId: run.run_id };
  }, { timeout: 30000 });
}
const schedulerState = globalThis as unknown as { phase0VerifierStarted?: boolean };
export function startNightlyVerifier() {
  if (schedulerState.phase0VerifierStarted) return;
  schedulerState.phase0VerifierStarted = true;
  const arm = () => {
    const next = new Date(); next.setUTCHours(2, 0, 0, 0);
    if (next.getTime() <= Date.now()) next.setUTCDate(next.getUTCDate() + 1);
    setTimeout(async () => {
      try { await runNightlyVerification(); }
      catch { console.error("NIGHTLY_LEDGER_VERIFICATION_FAILED"); }
      finally { arm(); }
    }, next.getTime() - Date.now()).unref();
  };
  arm();
}
