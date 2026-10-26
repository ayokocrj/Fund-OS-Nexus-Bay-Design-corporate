import { db, type Actor } from "./db";
import { invariantGuard } from "./guard";
import { encloseUntrusted } from "../agent/untrusted";
export async function answerFromRecord(actor: Actor, orgId: string) {
  await invariantGuard(actor, "read");
  const org = await db.organisation.findFirst({ where: { org_id: orgId, firm_id: actor.firmId } });
  if (!org) throw new Error("ORGANISATION_NOT_FOUND");
  const facts = await db.organisationFact.findMany({ where: { org_id: orgId, valid_to: null }, orderBy: { field: "asc" } });
  const observations = await db.observation.findMany({ where: { obs_id: { in: facts.map(f => f.obs_id) } } });
  const documents = await db.document.findMany({ where: { doc_id: { in: observations.flatMap(o => o.doc_id ? [o.doc_id] : []) } } });
  return {
    orgId, orgName: org.legal_name,
    text: facts.length ? facts.map(f => typeof f.value === "string" ? f.value : JSON.stringify(f.value)).join("\n") : "Not in the record.",
    citations: facts.map(f => f.obs_id),
    sources: observations.map(o => ({ id: o.obs_id, content: o.text, locator: o.locator_json, document: documents.find(d => d.doc_id === o.doc_id)?.doc_id, data: encloseUntrusted(o.text, { observation: o.obs_id, locator: o.locator_json, document: o.doc_id, conversation: o.conv_id }) })),
  };
}
export async function readObservation(actor: Actor, id: string) {
  await invariantGuard(actor, "read");
  const observation = await db.observation.findUnique({ where: { obs_id: id } });
  if (!observation) throw new Error("SOURCE_NOT_FOUND");
  if (observation.doc_id) {
    const document = await db.document.findFirst({ where: { doc_id: observation.doc_id, firm_id: actor.firmId } });
    if (!document) throw new Error("SOURCE_NOT_FOUND");
  } else {
    const conversation = await db.conversation.findFirst({ where: { conv_id: observation.conv_id!, firm_id: actor.firmId } });
    if (!conversation) throw new Error("SOURCE_NOT_FOUND");
  }
  return observation;
}
