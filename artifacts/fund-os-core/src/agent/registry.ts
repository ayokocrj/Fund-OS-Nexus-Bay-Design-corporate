import { z } from "zod/v4";
import type { Role } from "@prisma/client";
import type { Actor } from "../domain/db";
import { invariantGuard } from "../domain/guard";
import { answerFromRecord } from "../domain/records";
import { propose } from "../domain/outbox";
export const sideEffectClasses = ["read", "compute", "draft", "propose", "ask"] as const;
export type SideEffectClass = typeof sideEffectClasses[number];
export type Tool = {
  name: string; version: string; inputSchema: Record<string, unknown>; outputSchema: Record<string, unknown>;
  sideEffectClass: SideEffectClass; allowedRoles: Role[]; costClass: "zero" | "low" | "bounded"; skill: string;
  input: z.ZodType; output: z.ZodType; execute: (actor: Actor, input: unknown) => Promise<unknown>;
};
const input = z.object({ orgId: z.string().min(1) }).strict();
const output = z.object({ orgId: z.string(), orgName: z.string(), text: z.string(), citations: z.array(z.string()), sources: z.array(z.unknown()) });
const allRoles: Role[] = ["partner", "analyst", "ops", "ir", "compliance", "builder", "auditor"];
const proposalInput = z.object({
  episodeId: z.string(), orgId: z.string(), type: z.enum(["draft", "crm_update"]),
  answer: z.object({ text: z.string(), citations: z.array(z.string()) }).strict(),
}).strict();
const proposalOutput = z.object({ proposalId: z.string(), state: z.string() }).strict();
export function validateTool(tool: Tool) {
  if (!sideEffectClasses.includes(tool.sideEffectClass) || !tool.name || !tool.version || !tool.allowedRoles.length) throw new Error("INVALID_TOOL_REGISTRATION");
  if (/(?:send|delete|archive|decide|sign|criteria|autonomy)/i.test(tool.name)) throw new Error("FORBIDDEN_TOOL");
  if (tool.skill === "source") throw new Error("SOURCING_DEFERRED");
  return tool;
}
export const registry: ReadonlyMap<string, Tool> = new Map([
  ["answer_from_record", validateTool({
    name: "answer_from_record", version: "1", sideEffectClass: "read", allowedRoles: allRoles,
    costClass: "zero", skill: "core", input, output,
    inputSchema: z.toJSONSchema(input), outputSchema: z.toJSONSchema(output),
    execute: (actor, value) => answerFromRecord(actor, input.parse(value).orgId),
  })],
  ["propose_record_note", validateTool({
    name: "propose_record_note", version: "1", sideEffectClass: "propose",
    allowedRoles: allRoles.filter(role => role !== "auditor"), costClass: "zero", skill: "core",
    input: proposalInput, output: proposalOutput,
    inputSchema: z.toJSONSchema(proposalInput), outputSchema: z.toJSONSchema(proposalOutput),
    execute: async (actor, value) => {
      const input = proposalInput.parse(value);
      const proposal = await propose(actor, input.episodeId, input.type, input.orgId, input.answer);
      return { proposalId: proposal.proposal_id, state: proposal.state };
    },
  })],
]);
export async function invokeTool(actor: Actor, name: string, value: unknown, readOnly: boolean) {
  const tool = registry.get(name);
  if (!tool) throw new Error("UNKNOWN_TOOL");
  validateTool(tool);
  const { user } = await invariantGuard(actor, tool.sideEffectClass === "read" ? "read" : tool.sideEffectClass === "draft" ? "draft" : "propose");
  if (user && !tool.allowedRoles.includes(user.role)) throw new Error("TOOL_ROLE_FORBIDDEN");
  if (actor.serviceIdentity && !["read", "propose"].includes(tool.sideEffectClass)) throw new Error("SERVICE_READ_PROPOSE_ONLY");
  if (readOnly && tool.sideEffectClass !== "read") throw new Error("UNTRUSTED_READ_ONLY");
  const parsed = tool.input.parse(value);
  return tool.output.parse(await tool.execute(actor, parsed));
}
