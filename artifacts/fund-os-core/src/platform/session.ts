import { createHmac, timingSafeEqual } from "node:crypto";
import { db, type Actor } from "../domain/db";
import { sessionSigningKey } from "./secrets";
const maxAge = 60 * 60 * 8;
export function signDemoSession(userId: string) {
  const data = Buffer.from(JSON.stringify({ userId, expires: Date.now() + maxAge * 1000 })).toString("base64url");
  return `${data}.${createHmac("sha256", sessionSigningKey()).update(data).digest("base64url")}`;
}
export function verifyDemoSession(cookie?: string) {
  if (!cookie) return null;
  const [data, signature] = cookie.split(".");
  if (!data || !signature) return null;
  const expected = createHmac("sha256", sessionSigningKey()).update(data).digest("base64url");
  if (expected.length !== signature.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;
  try {
    const value = JSON.parse(Buffer.from(data, "base64url").toString()) as { userId: string; expires: number };
    return typeof value.userId === "string" && value.expires > Date.now() ? value.userId : null;
  } catch { return null; }
}
export async function demoIdentity(userId: string) {
  const user = await db.user.findUnique({ where: { user_id: userId } });
  if (!user || !user.user_id.startsWith("demo-")) throw new Error("DEMO_IDENTITY_NOT_FOUND");
  const firm = await db.firm.findUniqueOrThrow({ where: { firm_id: user.firm_id } });
  if (firm.mode !== "demo") throw new Error("TENANT_AUTH_NOT_IMPLEMENTED");
  return { userId: user.user_id, name: user.name, role: user.role, firmId: firm.firm_id, firmName: firm.name };
}
export async function actorFromCookie(value?: string): Promise<Actor> {
  const id = verifyDemoSession(value);
  if (!id) throw new Error("SESSION_REQUIRED");
  const user = await demoIdentity(id);
  return { firmId: user.firmId, userId: user.userId };
}
export const sessionCookie = { name: "fund-os-demo", httpOnly: true, sameSite: "strict" as const, path: "/", maxAge };
