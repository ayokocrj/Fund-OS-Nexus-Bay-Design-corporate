import { z } from "zod";
import type { Actor } from "../domain/db";
import { gateway } from "../domain/gateway";
import { encloseUntrusted } from "./untrusted";
export const plannerInput = (firmId: string, orgId: string, goal: string) => ({ goal, scope: encloseUntrusted(orgId, { type: "Organisation", firmId }) });
export function planFromMock(orgId: string, output: { fixture: unknown }) {
  if ((output.fixture as { action?: string }).action !== "answer_from_record") throw new Error("INVALID_MOCK_PLAN");
  return planSchema.parse({ summary: "Read accepted facts and present a cited answer. Read tools never create proposals.", tools: [{ name: "answer_from_record", input: { orgId } }] });
}
const planSchema = z.object({
  summary: z.string(), tools: z.array(z.object({ name: z.literal("answer_from_record"), input: z.object({ orgId: z.string() }) })).max(1),
}).strict();
export async function planner(actor: Actor, orgId: string, goal: string, episodeId?: string) {
  const output = await gateway(actor, "complete", plannerInput(actor.firmId, orgId, goal), undefined, { episodeId });
  return planFromMock(orgId, output);
}
