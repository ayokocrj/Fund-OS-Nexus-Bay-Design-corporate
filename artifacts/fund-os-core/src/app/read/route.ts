import { NextRequest } from "next/server";
import { handleReadRequest } from "@/domain/http-routes";
import { actorFromCookie, sessionCookie } from "@/platform/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const actor = await actorFromCookie(request.cookies.get(sessionCookie.name)?.value).catch(() => ({
    firmId: "bay",
    userId: "demo-bay-partner",
  }));
  return handleReadRequest(request, actor);
}
