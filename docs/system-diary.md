# System diary

## Phase 0 | 2026-10-27

**Decision:** implement Prompt 0 only, with the constitution and section 13 as the
contract. Preserve all prototype files. No skill screens or external operations.

**Evidence:** checked-in Prisma schema and protective SQL migrations; deterministic
seed and fixture generators; test suites and the generated demonstration trace.
Actual test output is emitted to `generated-artifacts/phase0/` by `npm test`.

**Ambiguities:** see `phase0-implementation-notes.md` for the Presented/done rule,
demo identity boundary and database additions required by the integrity rules.

**Stop:** show schema, demonstration trace and test output before Prompt 1.
