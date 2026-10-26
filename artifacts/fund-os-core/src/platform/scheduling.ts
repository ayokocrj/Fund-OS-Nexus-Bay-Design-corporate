import type { Actor } from "../domain/db";
import { recordRun } from "../domain/ledger";
export interface Scheduler { heartbeat(actor: Actor): Promise<string> }
export class ManualDemoScheduler implements Scheduler {
  async heartbeat(actor: Actor) {
    const result = await recordRun(actor, { skill: "core", tool: "job.heartbeat", input: { manual: true }, output: { healthy: true }, reason: "Manual demo job; no external scheduler" });
    return result.run_id;
  }
}
