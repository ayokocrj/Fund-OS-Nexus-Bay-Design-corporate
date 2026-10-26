# Phase 0 failure runbook

**Provider/adapter unavailable:** Phase 0 has neither. Configuration rejects a
live provider or enabled adapter. Do not work around the rejection.

**Ledger failure:** stop the demo. Run the read-only chain verifier, inspect the
first failing link, preserve evidence. Never repair history by editing Run rows.

**Budget exhausted:** the Episode must fail visibly and record its reason. A
human reviews firm settings; do not disable the guard.

**Consent missing:** refuse transcription; create a consent task. No audio run
may be created before every participant has transcription consent.

**Database not migrated:** stop application setup; inspect development migration
status and apply checked-in migrations explicitly in development. Never run
schema creation at server startup or in a production build hook.
