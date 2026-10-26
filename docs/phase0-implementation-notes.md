# Phase 0 implementation notes

The constitution and data-model contract are verbatim excerpts of the supplied
Agent Edition specification. These implementation notes do not amend them.

- Scope ends after Prompt 0. No skill screens, live models, live connectors,
  mail clients, external execution, deletion route or role bypass are present.
- Required stack is Next.js App Router, TypeScript, Tailwind, Prisma and the
  existing empty PostgreSQL database. The platform's web artifact bootstrap was
  converted to Next.js; old prototypes are untouched.
- Section 13 lists Episode states without `Presented`, then refers to Presented
  in its integrity rule. `present` is a Step; both that step and `done` require a
  passing critic verdict.
- Added implementation fields: optimistic-lock versions, ledger sequence,
  raw-content hash, fact history endpoints and mandatory reviewer IDs, autonomy
  demotion reason, gold-set month version, and indicative metric validator.
  These support the section's explicit integrity rules.
- Cross-tenant identifiers are unique within a firm when exposing a global
  uniqueness error could leak another firm's records.
- Prisma schema contains the scalar data contract. Reviewed SQL migrations add
  foreign keys, checks, partial unique indexes and database triggers not
  expressible in Prisma. Use the checked-in migrations, not `db push`.
- In this workspace schema changes are development-only. No deployment,
  production migration or container execution has been performed.
- Demo identity selection is deliberately public and synthetic. The server signs
  an HttpOnly cookie and resolves role and firm from seeded database rows.
  Tenant mode is refused, not silently granted demo access. This is not SSO.
- Demo gateway results are deterministic fixtures keyed by input hash. A critic
  accepts exact extractive statements only. This does not demonstrate real
  language-model or multimodal perception performance.
- Human confirmation in the outbox records sign-off only. No apply adapter
  exists in Phase 0; `applied` is blocked by a database constraint.
- Retention/deletion procedures, production SSO, real transcription, MCP and skill
  logic belong to later prompts. Do not add them while completing this phase.
- Budget amounts are illustrative internal units, not prices. Mock processing
  cost is zero. All displayed data is synthetic.
- SQL completion checks explicitly reject NULL verdicts; a nullable equality
  alone is not sufficient because PostgreSQL CHECK treats NULL as passing.
- In Replit/Nix, browser tests use the system Chromium wrapper. CI uses the
  Playwright-provided Chromium with its normal Linux dependencies installed.
