export const GEMINI_FLASH_MODEL = "gemini-2.5-flash";

export function sessionSigningKey(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) throw new Error("SESSION_SIGNING_NOT_CONFIGURED");
  return secret;
}

export function geminiApiKey(overrideKey?: string | null): string | null {
  const candidate = overrideKey?.trim() || process.env.GEMINI_API_KEY?.trim();
  return candidate && candidate.length > 0 ? candidate : null;
}

export function setRuntimeGeminiApiKey(key: string | null) {
  if (key && key.trim().length > 0) {
    process.env.GEMINI_API_KEY = key.trim();
  } else {
    delete process.env.GEMINI_API_KEY;
  }
}

export function geminiModel(): string {
  const model = process.env.GEMINI_MODEL?.trim();
  return model && model.length > 0 ? model : GEMINI_FLASH_MODEL;
}
