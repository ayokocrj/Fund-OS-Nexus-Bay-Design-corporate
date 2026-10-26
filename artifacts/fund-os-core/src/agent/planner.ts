import { z } from "zod";
import type { Actor } from "../domain/db";
import { gateway } from "../domain/gateway";
import { encloseUntrusted } from "./untrusted";
const planSchema = z.object({
  summary: z.string(), tools: z.array(z.object({ name: z.literal("answer_from_record"), input: z.object({ orgId: z.string() }) })).max(1),
}).strict();
export async function planner(actor: Actor, orgId: string, goal: string) {
  await gateway(actor, "complete", { goal, scope: encloseUntrusted(orgId, { type: "Organisation", firmId: actor.firmId }) });
  return planSchema.parse({ summary: "Read accepted facts, check citations and prepare a draft for human review.", tools: [{ name: "answer_from_record", input: { orgId } }] });
}
