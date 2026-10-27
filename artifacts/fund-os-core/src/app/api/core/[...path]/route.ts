import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, withActor } from "@/domain/db";
import { invariantGuard } from "@/domain/guard";
import { readObservation } from "@/domain/records";
import { runEpisode } from "@/agent/loop";
import { reviewProposal } from "@/domain/outbox";
import { verifyChain, replay } from "@/domain/ledger";
import { validateConfig } from "@/domain/config";
import { actorFromCookie, demoIdentity, sessionCookie, signDemoSession } from "@/platform/session";
import { handleReadRequest, handleAskRequest } from "@/domain/http-routes";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reviewSchema = z.object({ action: z.enum(["accepted", "edited", "rejected", "confirmed"]), version: z.number().int().nonnegative(), text: z.string().min(1).max(4000).optional() }).strict();
async function handle(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const parts = (await context.params).path;
    const route = parts.join("/");
    const post = request.method === "POST";
    if (route === "read" && post) {
      const actor = await actorFromCookie(request.cookies.get(sessionCookie.name)?.value).catch(() => ({ firmId: "bay", userId: "demo-bay-partner" }));
      return handleReadRequest(request, actor);
    }
    if (route === "ask" && post) {
      const actor = await actorFromCookie(request.cookies.get(sessionCookie.name)?.value).catch(() => ({ firmId: "bay", userId: "demo-bay-partner" }));
      return handleAskRequest(request, actor);
    }
    if (post) {
      const origin = request.headers.get("origin");
      const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
      if (!origin || new URL(origin).host !== host) throw new Error("ORIGIN_FORBIDDEN");
    }
    if (route === "session") {
      let userId: string;
      if (post) userId = z.object({ userId: z.string() }).strict().parse(await request.json()).userId;
      else {
        const existing = await actorFromCookie(request.cookies.get(sessionCookie.name)?.value).catch(() => null);
        userId = existing?.userId ?? "demo-bay-builder";
      }
      const identity = await demoIdentity(userId);
      const users = await db.user.findMany({ where: { user_id: { startsWith: "demo-" } }, orderBy: { user_id: "asc" } });
      const identities = await Promise.all(users.map(user => demoIdentity(user.user_id)));
      const firm = await db.firm.findUniqueOrThrow({ where: { firm_id: identity.firmId } });
      const settings = validateConfig(firm.mode, firm.settings);
      const response = NextResponse.json({ mode: "demo", identity, identities, review_permissions: {
        review: !["builder", "auditor"].includes(identity.role),
        acceptFacts: ["partner", "analyst"].includes(identity.role),
        confirmOutbox: settings.permissions.outboxConfirmRoles.includes(identity.role as "partner" | "analyst" | "ops"),
      } });
      response.cookies.set({ ...sessionCookie, value: signDemoSession(identity.userId), secure: request.headers.get("x-forwarded-proto") === "https" });
      return response;
    }
    const actor = await actorFromCookie(request.cookies.get(sessionCookie.name)?.value);
    return await withActor(actor, async () => {
      await invariantGuard(actor, "read");
      if (route === "episodes" && !post) {
        const result = await db.episode.findMany({ where: { firm_id: actor.firmId }, include: { steps: { orderBy: { seq: "asc" } } }, orderBy: { started_at: "desc" } });
        return NextResponse.json(result);
      }
      if (route === "episodes" && post) {
        const input = z.object({ orgId: z.string().min(1).max(100), intent: z.enum(["ask", "draft"]).optional() }).strict().parse(await request.json());
        return NextResponse.json(await runEpisode(actor, input.orgId, { intent: input.intent }), { status: 201 });
      }
      if (parts[0] === "episodes" && parts[2] === "replay" && post) {
        const { mode } = z.object({ mode: z.enum(["snapshot", "reexecute"]) }).strict().parse(await request.json());
        return NextResponse.json(await replay(actor, parts[1], mode));
      }
      if (route === "proposals" && !post) {
        const proposals = await db.proposal.findMany({ where: { firm_id: actor.firmId }, include: { episodeLinks: true }, orderBy: { proposal_id: "desc" } });
        return NextResponse.json(proposals.map(({ episodeLinks, ...proposal }) => ({ ...proposal, linked_episode_ids: episodeLinks.map(link => link.episode_id) })));
      }
      if (parts[0] === "proposals" && parts[2] === "review" && post) {
        const input = reviewSchema.parse(await request.json());
        return NextResponse.json(await reviewProposal(actor, parts[1], input.action, input.version, input.text));
      }
      if (parts[0] === "sources" && parts.length === 2 && !post) return NextResponse.json(await readObservation(actor, parts[1]));
      if (route === "ledger" && !post) {
        const context = await invariantGuard(actor, "read");
        if (!["builder", "partner", "auditor", "compliance"].includes(context.user?.role ?? "")) throw new Error("ROLE_FORBIDDEN");
        const global = await verifyChain();
        const ownCount = await db.run.count({ where: { firm_id: actor.firmId } });
        // Global chain integrity, but no other tenant's IDs/count are disclosed.
        const checked = await db.run.count({ where: { firm_id: actor.firmId, seq: { gt: global.fromSeq } } });
        return NextResponse.json({ valid: global.valid, count: ownCount, checked, incremental: global.incremental, verified_at: global.verified_at, failures: global.valid ? [] : ["CHAIN_INTEGRITY_FAILURE"] });
      }
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "INTERNAL_ERROR";
    const status = /SESSION_REQUIRED/.test(message) ? 401
      : /CONFLICT|TERMINAL/.test(message) ? 409
      : /FORBIDDEN|READ_ONLY|REQUIRED|SCOPE|SIGNER|STOPPED/.test(message) ? 403
      : /NOT_FOUND/.test(message) ? 404
      : error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json({ error: status === 500 ? "INTERNAL_ERROR" : message }, { status });
  }
}
export const GET = handle;
export const POST = handle;
