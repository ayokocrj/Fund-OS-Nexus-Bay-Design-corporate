import type { Role } from "@prisma/client";
import { db, type Actor, type Tx } from "./db";
import { validateConfig } from "./config";

export class InvariantError extends Error {}
export const humanWriteRoles: Role[] = ["partner", "analyst", "ops", "ir", "compliance", "builder"];
export async function identity(actor: Actor, tx?: Tx) {
  const store = tx ?? db;
  const firm = await store.firm.findUniqueOrThrow({ where: { firm_id: actor.firmId } });
  validateConfig(firm.mode, firm.settings);
  if (Boolean(actor.userId) === Boolean(actor.serviceIdentity)) throw new InvariantError("EXACTLY_ONE_ACTOR");
  if (actor.serviceIdentity) {
    if (actor.serviceIdentity !== `scheduler:${firm.firm_id}`) throw new InvariantError("UNKNOWN_SERVICE_IDENTITY");
    return { firm, user: null };
  }
  const user = await store.user.findFirst({ where: { user_id: actor.userId, firm_id: firm.firm_id } });
  if (!user) throw new InvariantError("FORBIDDEN_IDENTITY");
  return { firm, user };
}
export async function invariantGuard(actor: Actor, purpose: "read" | "draft" | "propose" | "review" | "policy", tx?: Tx) {
  const context = await identity(actor, tx);
  if (purpose !== "read" && context.user?.role === "auditor") throw new InvariantError("AUDITOR_READ_ONLY");
  if (actor.serviceIdentity && !["read", "propose"].includes(purpose)) throw new InvariantError("SERVICE_READ_PROPOSE_ONLY");
  if (purpose === "policy" && context.user?.role !== "partner") throw new InvariantError("PARTNER_REQUIRED");
  return context;
}
export async function assertConsent(convId: string, actor: Actor) {
  await invariantGuard(actor, "read");
  const conv = await db.conversation.findFirst({ where: { conv_id: convId, firm_id: actor.firmId }, include: { participants: true } });
  if (!conv || !conv.participants.length) throw new InvariantError("CONSENT_MISSING");
  const consents = await db.consent.findMany({ where: { conv_id: convId, type: "transcription" } });
  if (conv.participants.some(person => !consents.some(c => c.person_id === person.person_id))) {
    await invariantGuard(actor, "propose");
    await db.task.create({ data: { firm_id: actor.firmId, owner_id: actor.userId ?? conv.participants[0].person_id, kind: "consent", ref_type: "Conversation", ref_id: convId, state: "open" } });
    throw new InvariantError("CONSENT_MISSING");
  }
}
