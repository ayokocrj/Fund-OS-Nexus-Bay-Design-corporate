import { AsyncLocalStorage } from "node:async_hooks";
import { PrismaClient, Prisma } from "@prisma/client";

export type Actor = { firmId: string; userId?: string; serviceIdentity?: string };
export type Tx = Prisma.TransactionClient;
export { Prisma };
export const actorContext = new AsyncLocalStorage<Actor>();
const globalDb = globalThis as unknown as { fundPrisma?: PrismaClient };
const base = globalDb.fundPrisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalDb.fundPrisma = base;

// This query middleware applies to every Document/Decision read, including reads
// introduced by future callers. Identity and scope are not optional parameters.
export const db: PrismaClient = base.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const actor = actorContext.getStore();
        if (["Document", "Decision"].includes(model) && /^(find|count|aggregate|groupBy)/.test(operation)) {
          if (!actor) throw new Error("ACCESS_CONTEXT_REQUIRED");
          const entities = model === "Document"
            ? await base.document.findMany({ where: { firm_id: actor.firmId }, select: { doc_id: true } })
            : await base.decision.findMany({ where: { item_id: { in: (await base.item.findMany({ where: { firm_id: actor.firmId }, select: { item_id: true } })).map(x => x.item_id) } }, select: { decision_id: true } });
          const ids = entities.map(x => "doc_id" in x ? x.doc_id : x.decision_id);
          const key = model === "Document" ? "doc_id" : "decision_id";
          const scoped = args as { where?: Record<string, unknown> };
          const original = scoped.where ?? {};
          scoped.where = { AND: [original, { [key]: { in: ids } }] };
          // findUnique requires a unique selector: scope without replacing it.
          if (operation.startsWith("findUnique")) {
            const foundId = typeof original[key] === "string" ? original[key] : (original[key] as { equals?: string })?.equals;
            if (!foundId || !ids.includes(foundId)) throw new Error("SOURCE_NOT_FOUND");
            scoped.where = { ...original, [key]: foundId };
          }
          const result = await query(args);
          const rows = Array.isArray(result) ? result : result && typeof result === "object" ? [result] : [];
          const readIds = rows.map(row => (row as Record<string, unknown>)[key]).filter((id): id is string => typeof id === "string");
          await base.accessLog.createMany({ data: (readIds.length ? readIds : ["query:no-visible-row"]).map(id => ({
            user_id: actor.userId, service_identity: actor.serviceIdentity, entity: model, entity_id: id, action: operation,
          })) });
          return result;
        }
        return query(args);
      },
    },
  },
}) as unknown as PrismaClient;
export function withActor<T>(actor: Actor, action: () => Promise<T>): Promise<T> {
  // Prisma queries are lazy thenables: assimilate them while the context is
  // active, before returning to the caller's authorization context.
  return actorContext.run(actor, async () => await action());
}
export const disconnect = () => base.$disconnect();
