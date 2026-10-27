import { z } from "zod";

export const settingsSchema = z.object({
  budgets: z.object({ episode: z.number().nonnegative(), monthly: z.number().nonnegative() }).strict(),
  providers: z.array(z.object({ name: z.string(), live: z.boolean(), modalities: z.array(z.enum(["complete", "see", "transcribe", "speak", "embed"])) }).strict()),
  adapters: z.array(z.object({ name: z.string(), live: z.boolean(), enabled: z.boolean(), readOnly: z.boolean() }).strict()),
  flags: z.record(z.string(), z.boolean()),
  permissions: z.object({
    outboxConfirmRoles: z.array(z.enum(["partner", "analyst", "ops"])).min(1),
  }).strict().default({ outboxConfirmRoles: ["partner", "analyst", "ops"] }),
}).strict();
export type Settings = z.infer<typeof settingsSchema>;
export const demoSettings: Settings = {
  budgets: { episode: 10, monthly: 100 },
  providers: [{ name: "deterministic", live: false, modalities: ["complete", "see", "transcribe", "speak", "embed"] }],
  adapters: [], flags: {}, permissions: { outboxConfirmRoles: ["partner", "analyst", "ops"] },
};
export function validateConfig(mode: string, input: unknown): Settings {
  if (!["demo", "tenant"].includes(mode)) throw new Error("INVALID_MODE");
  const config = settingsSchema.parse(input);
  if (mode === "demo" && (config.providers.some(x => x.live) || config.adapters.some(x => x.live))) throw new Error("DEMO_LIVE_CALL_FORBIDDEN");
  // Phase 0 has no network provider or adapter implementation.
  if (config.providers.some(x => x.name !== "deterministic") || config.adapters.some(x => x.enabled)) throw new Error("PROVIDER_OR_ADAPTER_NOT_IMPLEMENTED");
  return config;
}
