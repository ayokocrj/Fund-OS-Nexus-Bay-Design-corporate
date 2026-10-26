import { db, type Actor } from "./db";
import { identity, assertConsent } from "./guard";
import { validateConfig } from "./config";
import { hash } from "./hash";
import { recordRun } from "./ledger";
export const modalities = ["complete", "see", "transcribe", "speak", "embed"] as const;
export type GatewayModality = typeof modalities[number];
export function mockResult(modality: GatewayModality, input: unknown) {
  const inputHash = hash({ modality, input });
  return {
    modality, input_hash: inputHash, provider: "deterministic", version: "mock-v1",
    fixture: modality === "embed" ? [0.125, 0.25, 0.5, 0.75]
      : modality === "speak" ? { media_ref: "fixture:audio/brief.wav", synthetic: true }
      : modality === "transcribe" ? { text: "Synthetic partner note: the target close remains conditional.", spans: [{ start: 0, end: 4 }] }
      : modality === "see" ? { values: [12, 18, 24], indicative: true, locator: { page: 1, bbox: [40, 40, 200, 120] } }
      : { action: "answer_from_record", instruction: "Cite accepted records only." },
  };
}
export async function gateway(actor: Actor, modality: GatewayModality, input: unknown, convId?: string) {
  if (!modalities.includes(modality)) throw new Error("UNSUPPORTED_MODALITY");
  const { firm } = await identity(actor);
  const settings = validateConfig(firm.mode, firm.settings);
  if (!settings.providers.some(p => !p.live && p.name === "deterministic" && p.modalities.includes(modality))) throw new Error("MODALITY_NOT_ALLOWED");
  if (modality === "transcribe") {
    if (!convId) throw new Error("CONVERSATION_REQUIRED");
    await assertConsent(convId, actor);
  }
  const result = mockResult(modality, input);
  await recordRun(actor, { skill: "core", tool: `gateway.${modality}`, input, output: result, reason: "Deterministic fixture only; no network call" });
  return result;
}
