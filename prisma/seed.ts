import { db, disconnect } from "../artifacts/fund-os-core/src/domain/db";
import { demoSettings } from "../artifacts/fund-os-core/src/domain/config";
import { appendRun } from "../artifacts/fund-os-core/src/domain/ledger";
import { hash } from "../artifacts/fund-os-core/src/domain/hash";
import { skills } from "../artifacts/fund-os-core/src/agent/autonomy";
import { FixtureObjectStore } from "../artifacts/fund-os-core/src/platform/object-store";
import { northstar } from "./seed/northstar";
import { bayharbour } from "./seed/bayharbour";
import type { Role } from "@prisma/client";
const roles: Role[] = ["partner", "analyst", "ops", "ir", "compliance", "builder", "auditor"];
const date = new Date("2026-10-26T09:00:00.000Z");
export async function seed() {
  for (const config of [northstar, bayharbour]) {
    const firmId = config.firmId;
    await db.firm.createMany({ data: [{ firm_id: firmId, name: config.name, profile: config.profile, mode: "demo", language: "en", settings: demoSettings }], skipDuplicates: true });
    await db.user.createMany({ data: roles.map(role => ({ user_id: `demo-${firmId}-${role}`, firm_id: firmId, name: `${config.name} ${role} (synthetic)`, email: `${role}@${firmId}.example.invalid`, role })), skipDuplicates: true });
    const actor = { firmId, userId: `demo-${firmId}-builder` };
    const partner = `demo-${firmId}-partner`;
    await db.changeRequest.createMany({ data: skills.map(skill => ({ cr_id: `${firmId}-initial-${skill}`, firm_id: firmId, what: `autonomy:${skill}:1`, why: "Synthetic Phase 0 on-request policy", requested_by: partner, signed_by: partner, applied_at: date })), skipDuplicates: true });
    await db.autonomyPolicy.createMany({ data: skills.map(skill => ({ firm_id: firmId, skill, level: skill === "core" ? 1 : 0, set_by: partner, change_request_id: `${firmId}-initial-${skill}`, reason: "Synthetic initial policy" })), skipDuplicates: true });
    const count = config.items;
    await db.organisation.createMany({ data: Array.from({ length: Math.max(count, 35) }, (_, i) => ({
      org_id: `${firmId}-org-${String(i + 1).padStart(3, "0")}`, firm_id: firmId,
      kind: firmId === "bay" && i < 25 ? "fund" : "company",
      legal_name: i === 0 ? (firmId === "bay" ? "Meridian Ridge Partners (synthetic)" : "Lumen Systems (synthetic)") : `${firmId === "bay" ? "Harbour" : "Northstar"} Example ${i + 1} (synthetic)`,
      sector_tags: ["synthetic"], state: "confirmed",
    })), skipDuplicates: true });
    await db.item.createMany({ data: Array.from({ length: count }, (_, i) => ({
      item_id: `${firmId}-item-${i + 1}`, firm_id: firmId, kind: firmId === "bay" ? "manager_review" : "deal",
      org_id: `${firmId}-org-${String(i + 1).padStart(3, "0")}`, source_channel: "synthetic_fixture", received_at: date, stage: "received", status: "open", owner_id: `demo-${firmId}-analyst`,
    })), skipDuplicates: true });
    const holdingCount = firmId === "bay" ? 35 : 12;
    await db.holding.createMany({ data: Array.from({ length: holdingCount }, (_, i) => ({
      holding_id: `${firmId}-holding-${i + 1}`, firm_id: firmId, org_id: `${firmId}-org-${String(i + 1).padStart(3, "0")}`, level: firmId === "bay" && i < 25 ? "fund" : "company",
      invested_at: date, instrument: "synthetic interest", schema_version: "v1",
    })), skipDuplicates: true });
    for (let version = 1; version <= config.criteriaVersions; version++) {
      const id = `${firmId}-criteria-${version}`;
      if (!await db.criteriaSet.findUnique({ where: { criteria_id: id } })) await db.$transaction(async tx => {
        await tx.criteriaSet.create({ data: { criteria_id: id, firm_id: firmId, target: firmId === "bay" ? "manager" : "company", version, basis_ref: "fixture:criteria", effective_from: date, signed_by: partner } });
        await tx.criterion.createMany({ data: ["Evidence", "Fit", "Readiness"].map((name, i) => ({ criterion_id: `${id}-${i}`, criteria_id: id, name, evidence_definition: "Synthetic labelled supporting observation", weight: [40, 35, 25][i] })) });
      });
    }
    if (firmId === "north") {
      await db.decision.createMany({ data: Array.from({ length: 200 }, (_, i) => ({
        decision_id: `north-gold-decision-${i + 1}`, item_id: `north-item-${i % 60 + 1}`, user_id: partner,
        outcome: i % 2 ? "pass" : "keep_warm", reason: "Synthetic human-labelled gold decision", decided_at: date,
      })), skipDuplicates: true });
      await db.goldSetItem.createMany({ data: Array.from({ length: 200 }, (_, i) => ({
        gs_id: `north-gold-${i + 1}`, firm_id: firmId, skill: "screen", modality: "text",
        payload_ref: `north-gold-decision-${i + 1}`, label_json: { outcome: i % 2 ? "pass" : "keep_warm", synthetic: true },
        source: "review", added_at: date, month_version: "2026-10",
      })), skipDuplicates: true });
    }
    const text = firmId === "bay"
      ? "The target first close is September 2025, conditional on two LP confirmations."
      : "The company provides workflow software for laboratory teams.";
    const object = await new FixtureObjectStore().putImmutable(Buffer.from(text));
    await db.$transaction(async tx => {
      const run = await appendRun(tx, actor, { skill: "core", tool: "seed.fixtures", input: { firmId }, output: { synthetic: true }, reason: "Synthetic demonstration evidence, accepted by seeded human reviewer" });
      await tx.document.createMany({ data: [{ doc_id: `${firmId}-doc-1`, firm_id: firmId, owner_type: "Organisation", owner_id: `${firmId}-org-001`,
        type: "memo", version: 1, hash: object.hash, storage_ref: object.ref, retention_class: "synthetic-demo", provenance: { synthetic: true, origin: "phase0-seed" }, language: "en" }], skipDuplicates: true });
      await tx.observation.createMany({ data: [{ obs_id: `${firmId}-obs-1`, doc_id: `${firmId}-doc-1`, modality: "text",
        locator_json: { page: 1, bbox: [30, 40, 500, 80] }, text, confidence: 1, extractor_version: "fixture-v1", run_id: run.run_id }], skipDuplicates: true });
      await tx.organisationFact.createMany({ data: [{ fact_id: `${firmId}-fact-1`, org_id: `${firmId}-org-001`, field: "accepted_note", value: text, obs_id: `${firmId}-obs-1`, source_type: "human_reviewed_fixture",
        confidence: 1, valid_from: date, run_id: run.run_id, reviewer_id: partner }], skipDuplicates: true });
    });
    if (firmId === "bay") {
      await db.person.createMany({ data: [{ person_id: "bay-person-1", firm_id: firmId, name: "Synthetic manager contact", org_id: "bay-org-001", state: "confirmed" }], skipDuplicates: true });
      for (let i = 1; i <= 120; i++) {
        const convId = `bay-conv-${i}`;
        const note = `Synthetic conversation ${i}. Manager update: target close remains conditional. Human-structured fields: manager=Meridian Ridge; topic=fundraising; date=2026-10-26.`;
        const raw = await new FixtureObjectStore().putImmutable(Buffer.from(note));
        await db.conversation.createMany({ data: [{ conv_id: convId, firm_id: firmId, channel: "note", occurred_at: date, raw_ref: raw.ref, raw_hash: hash(note), language: "en" }], skipDuplicates: true });
        await db.conversationParticipant.createMany({ data: [{ conv_id: convId, person_id: "bay-person-1" }], skipDuplicates: true });
        await db.goldSetItem.createMany({ data: [{ gs_id: `bay-gold-${i}`, firm_id: firmId, skill: "capture", modality: "text", payload_ref: convId,
          label_json: { synthetic: true, manager: "bay-org-001", topic: "fundraising", close: "conditional", human_structured: true }, source: "review", added_at: date, month_version: "2026-10" }], skipDuplicates: true });
      }
      await db.consent.createMany({ data: ["recording", "transcription"].map(type => ({
        consent_id: `bay-consent-1-${type}`, conv_id: "bay-conv-1", person_id: "bay-person-1", type, recorded_by: partner, recorded_at: date, method: "Synthetic consent fixture, not real consent",
      })), skipDuplicates: true });
    }
  }
  await db.invariant.createMany({ data: [
    { invariant_id: "core-five-classes", name: "Five classes only", scope: "registry", check_definition: "read,compute,draft,propose,ask", since_version: "v1" },
    { invariant_id: "core-human-acceptance", name: "Human acceptance required", scope: "proposal", check_definition: "reviewer_id mandatory for a decision", since_version: "v1" },
    { invariant_id: "core-no-network", name: "No live calls in demo", scope: "config", check_definition: "all providers and adapters deterministic", since_version: "v1" },
  ], skipDuplicates: true });
  console.log("Seeds ready: Northstar 60 items / 12 holdings / 3 criteria / 200 gold decisions; Bay Harbour 25 funds / 10 companies / 120 conversations / 40 reviews. Synthetic only.");
}
if (process.argv[1]?.endsWith("/seed.ts")) seed().finally(disconnect);
