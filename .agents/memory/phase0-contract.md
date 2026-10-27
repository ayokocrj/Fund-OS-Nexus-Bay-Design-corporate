---
name: Phase 0 contract and stopping rule
description: User's explicit implementation boundary and evidence required before Prompt 1.
---

Do not update the existing design prototype during Phase 0. The user explicitly
requested section 21, “Prompt 0, constitution and agent core” of the supplied
Agent Edition specification, with the constitution as the contract and section
13 as the data-model contract. Phase 0 has no skill screens.

**Why:** The user warned that a broad interpretation of “Phase 0” risks rebuilding
screens that the specification defers. Demo v2 remains the proving interface.

**How to apply:** Keep changes limited to the core, schema, seeds/fixtures,
guards, roles/access logs, gateway mocks, registry, agent orchestration, ledger,
Episode viewer, Review inbox, outbox and CI. No mail client, webhook, deletion
path or administrative bypass. Present the complete Prisma schema, one mock
demonstration trace with critic verdict and cost, and full test output. Stop
before Prompt 1 until the user explicitly authorizes it.

## Integrity lessons

SQL completion checks must explicitly reject a NULL verdict; equality alone
allows NULL through a PostgreSQL CHECK. Trigger dispatch must select the table
before referencing fields absent from other tables.

**Why:** Negative Phase 0 tests exposed both pitfalls.

**How to apply:** Cover nullable safety predicates and polymorphic trigger
dispatch with direct PostgreSQL integrity tests, not only service-level tests.

Mandatory tenant restrictions must be combined with caller filters using AND;
never merge a caller-supplied ID filter over the authorization restriction.

**Why:** A later caller could otherwise replace mandatory scoping with its own
ID list, even when current endpoints usually add their own firm condition.

**How to apply:** Keep an explicit cross-tenant ID-list regression test whenever
the document/decision access middleware changes.

Lazy database thenables must execute inside the actor's async context.

**Why:** Returning a lazy query from an async-context callback lets an outside
await execute the query after the authorization context has been left.

**How to apply:** Await queries inside the context boundary and retain a test
that passes an ORM query directly to that boundary.

## Read versus draft and review evidence

Ask/read work must create no business proposals and end at present. Semantic
duplicates in proposed/accepted/edited/confirmed states must be reused and linked
to the new episode, not duplicated. Builder and auditor are read-only in Review
and Outbox. Synthetic mocks must consume a non-zero budget; a budget stop must
retain the partial draft as stopped and ask for human review.

**Why:** The user explicitly rejected the initial read-to-proposal behavior,
zero-cost mocks and a replay that merely rehashed stored outputs.

**How to apply:** Keep snapshot integrity and gateway-backed re-execution
distinct. Persist and expose all five named critic checks. Ledger verification
must be on-demand in the browser and incremental/nightly on the server. Display
the complete schema and full test output, not merely file paths or download
cards, before stopping at Phase 0.
