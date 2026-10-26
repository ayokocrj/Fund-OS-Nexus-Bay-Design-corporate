export function sessionSigningKey(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) throw new Error("SESSION_SIGNING_NOT_CONFIGURED");
  return secret;
}
// Phase 0 has no provider credential reader because live providers do not exist.
