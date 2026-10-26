# Fund OS · Agent Core — Phase 0

Start with [constitution.md](constitution.md), the verbatim Prompt 0 contract,
then [data-model.md](data-model.md), the verbatim section 13.

## Development setup

Node 24 and pnpm 10.26.1. PostgreSQL is supplied through `DATABASE_URL`.
`SESSION_SECRET` is supplied through the platform secret adapter. Never commit
environment files. Configure those values using the hosting platform's secrets.

```sh
pnpm install --frozen-lockfile
pnpm --filter @workspace/fund-os-core db:generate
# Development / isolated CI database only:
pnpm --filter @workspace/fund-os-core exec prisma migrate deploy --schema ../../prisma/schema.prisma
pnpm phase0:seed
pnpm --filter @workspace/fund-os-core exec tsx ../../scripts/make-fixtures.ts
```

The managed Replit workflow `artifacts/fund-os-core: web` starts the app.
Outside Replit set PORT=24294 in the environment and run the app's `dev` script.
Browser tests expect that app to be running. Install system Chromium in Replit
or `playwright install --with-deps chromium` on a supported Linux host.

```sh
npm test
pnpm phase0:demo
pnpm --filter @workspace/fund-os-core exec tsx ../../scripts/export.ts
```

`npm test` runs the secret scanner, unit/property/contract/database/replay/
injection/planted-error/perception suites and Playwright E2E. Complete output is
saved at `generated-artifacts/phase0/test-output.txt`. It does not silently skip
a browser test when Chromium is unavailable.

The demo writes `generated-artifacts/phase0/episode-trace.json` and uses only
the deterministic gateway. Test-created Episodes are labelled by their synthetic
fixtures; they are distinct from the one handover demonstration Episode.

## Portability

The object-store, secrets and scheduler modules are platform adapters. The local
immutable object store is fixture-only, not a production App Storage promise.
`scripts/export.ts` emits a source bundle with schema, reviewed migrations,
fixtures and seeds. `Dockerfile` is supplied for an external container-capable
host; no container runtime is started in this Replit workspace.

CI runs on an isolated, ephemeral PostgreSQL service using per-run synthetic
credentials. Never substitute production secrets or a production database.
Live production migrations remain a separate, explicitly approved operation.

See the [implementation notes](phase0-implementation-notes.md),
[failure runbook](runbooks/phase0.md) and [handover checklist](handover-checklist.md).
No Prompt 1 work is authorized by this handover.
