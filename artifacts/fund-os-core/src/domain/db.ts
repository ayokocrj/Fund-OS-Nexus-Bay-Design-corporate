import { AsyncLocalStorage } from "node:async_hooks";
import { createRequire } from "node:module";
import type { PrismaClient as PrismaClientType, Prisma as PrismaNamespace } from "@prisma/client";

const requireModule = createRequire(import.meta.url);

class FallbackDecimal {
  readonly value: number;
  constructor(v: number | string | FallbackDecimal) {
    this.value = v instanceof FallbackDecimal ? v.value : Number(v);
  }
  add(other: number | string | FallbackDecimal) {
    const o = other instanceof FallbackDecimal ? other.value : Number(other);
    return new FallbackDecimal(Number((this.value + o).toFixed(8)));
  }
  gt(other: number | string | FallbackDecimal) {
    const o = other instanceof FallbackDecimal ? other.value : Number(other);
    return this.value > o;
  }
  toNumber() {
    return this.value;
  }
  toString() {
    return String(this.value);
  }
  toJSON() {
    return this.value;
  }
  valueOf() {
    return this.value;
  }
}

let PrismaClient: typeof PrismaClientType;
let Prisma: typeof PrismaNamespace;
try {
  const pkg = requireModule("@prisma/client") as { PrismaClient: typeof PrismaClientType; Prisma: typeof PrismaNamespace };
  PrismaClient = pkg.PrismaClient;
  Prisma = pkg.Prisma;
} catch {
  Prisma = { Decimal: FallbackDecimal } as unknown as typeof PrismaNamespace;
  PrismaClient = class {
    $extends() {
      return this;
    }
    $disconnect() {
      return Promise.resolve();
    }
  } as unknown as typeof PrismaClientType;
}

export type Actor = { firmId: string; userId?: string; serviceIdentity?: string };
export type Tx = PrismaNamespace.TransactionClient;
export { Prisma };
export const actorContext = new AsyncLocalStorage<Actor>();
const globalDb = globalThis as unknown as { fundPrisma?: PrismaClientType };
const base = globalDb.fundPrisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalDb.fundPrisma = base;

// This query middleware applies to every Document/Decision read, including reads
// introduced by future callers. Identity and scope are not optional parameters.
export const db: PrismaClientType = base.$extends({
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
}) as unknown as PrismaClientType;
export function withActor<T>(actor: Actor, action: () => Promise<T>): Promise<T> {
  // Prisma queries are lazy thenables: assimilate them while the context is
  // active, before returning to the caller's authorization context.
  return actorContext.run(actor, async () => await action());
}
export const disconnect = () => base.$disconnect();
