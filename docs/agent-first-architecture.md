# Fund OS: recommended agent and multimodal architecture

## Status

This is an implementation recommendation accompanying the interactive design.
The design uses synthetic evidence and local state. It is not a connected AI
agent, a persistent record system, or a production security implementation.

## Product decision

Use one coordinating agent with narrow, typed tools. Do not start with a swarm
of autonomous agents. The product unit is a task with a reviewable deliverable,
not an open-ended chat session.

Example task: prepare a manager-review brief by comparing a quarterly report,
a call recording, a metrics workbook and a deck screenshot.

Retain three distinct layers:

1. Original evidence, with immutable versions.
2. Agent proposals and drafts, which may be incomplete or wrong.
3. Human-accepted records, which alone become authoritative knowledge.

## Multimodal inputs

| Input | Processing | Required reference |
|---|---|---|
| PDF, deck, scanned report | Extract text; render relevant pages for visual interpretation | Document version, page, excerpt or bounding box |
| Screenshot, image | Vision extraction with explicit uncertainty | Image version and region |
| CSV, workbook | Parse cells deterministically; preserve formulas and units; calculate in code | Workbook version, sheet and cell range |
| Voice note, recorded call | Transcribe in batches; preserve timing; review names and numbers | Recording version and start/end timestamp |
| Recorded pitch video | Chunk audio/video, preserve absolute time offsets; retrieve relevant intervals | Recording version, timestamp and frame |

Prioritize documents, spreadsheets, images and uploaded voice notes. Add recorded
video next. Defer live meeting participation and continuous voice/video sessions.
Do not infer identity, personality, honesty or investment quality from faces or
voices. Obtain appropriate recording permission before capturing conversations.

## Task lifecycle

Draft → scoped → processing → needs review → approved / rejected / cancelled.

Processing must also support partial failure and retry. Show completed tool
actions, evidence coverage, errors and unresolved questions—not hidden model
reasoning. Long-running tasks need persisted checkpoints and resumable jobs.

Each proposal is reviewed individually. Editing a proposal changes its version;
approval binds the reviewer to that exact version and its source snapshot.
If evidence or the proposal changes, require fresh approval.

## Tools and authority

The coordinator may retrieve authorized evidence, extract candidate facts,
compare sources, ask for deterministic calculations, draft a brief and create
proposals. It must not send messages, place investments, value holdings, make
investment recommendations or write accepted facts.

An independent server-side approval endpoint commits accepted facts only after
checking identity, role, tenant, proposal version and source snapshot. Do not let
the model provide its own approval flag. Use idempotency keys and concurrency
checks so duplicate requests or stale reviews cannot double-apply changes.

## Data and retrieval

Store original files in private object storage; store metadata, permissions,
tasks, tool events, proposals, approvals and accepted facts in PostgreSQL.
Retain document hashes, source versions and extraction/model/prompt versions.
Chat history is working context, not the system of record.

Start with authorized entity/date filters and full-text search. Add embeddings
only if retrieval evaluations demonstrate a benefit; do not make a vector store
the authoritative record. Enforce tenant and document permissions before
retrieval, not after generation. Share only the evidence needed for the task.

## Provider recommendation

Keep the PRD's ModelGateway boundary. Start with a supported OpenAI reasoning/
vision model for coordination, document/image interpretation and structured
proposals. Use batch transcription for uploaded voice notes. Select the exact
model against the fund's labelled examples rather than branding or leaderboard
claims.

Add a Gemini adapter when native recorded audio/video analysis proves useful.
Avoid running every task through two providers: this increases data exposure,
latency and reconciliation work without demonstrating better results.

Replit AI Integrations can provide OpenAI and Gemini access without the user's
own API key; usage is charged to Replit credits. No provider has been enabled
for this design work.

Implementation constraints from the integrations available in this workspace:

- Do not assume provider-hosted Files, File Search, embeddings or Realtime APIs
  are exposed by the managed integration.
- Own file storage and preprocessing in the application; use supported inline
  inputs rather than building around an unavailable Files API.
- Gemini's managed integration supports generateContent, not Live or
  Interactions. Chunk audio/video into small inline payloads within its documented
  limit, with retries, rate limits and absolute timestamp offsets.
- Provider-direct documentation may expose capabilities and upload limits that
  differ from the managed integration. Verify the actual adapter before coding.
- Model and provider choices for tenant data remain subject to the firm's
  contractual, retention, regional and compliance review. Do not claim data stays
  in the application's tenant when it is sent to an external model provider.

## Reliability and safety

Treat uploaded documents and transcripts as untrusted data, never instructions.
Use server-side tool allowlists, schema validation, bounded steps, time limits,
rate limits, cancellation and explicit failure states. Never execute spreadsheet
macros or arbitrary document code.

Every factual statement needs a source that actually supports it. A valid source
identifier alone does not prove support. Label contradictions and missing
evidence explicitly; never fill gaps from general knowledge. Model confidence
is not a calibrated probability of truth.

Before tenant use, evaluate citation correctness, extraction precision/recall,
missed contradictions, human correction effort, permission isolation and blocked
side effects against labelled examples. Keep the deterministic demo gateway
separate from live processing and test failures as well as successful outputs.

## Suggested implementation order

1. One end-to-end manager task: private upload → extraction → sourced draft →
   human review → accepted facts and ledger.
2. Add workbook calculations, screenshot regions and batch audio transcription
   with source viewers and extraction evaluations.
3. Add recorded video, connectors and scheduled briefings only after the core
   evidence and approval flow is reliable.

## Sources consulted

- OpenAI, guardrails and human review:
  https://developers.openai.com/api/docs/guides/agents/guardrails-approvals
- OpenAI, file inputs and document/spreadsheet limitations:
  https://developers.openai.com/api/docs/guides/pdf-files
- Google, video understanding and timestamp references:
  https://ai.google.dev/gemini-api/docs/video-understanding
- Replit AI Integrations:
  https://docs.replit.com/features/integrations/replit-ai-integrations
- User-supplied Fund OS v3 PRD and workspace-specific OpenAI/Gemini integration
  instructions, which take precedence over provider-direct examples for adapter
  implementation.
