# Fund OS v3: planning and specification for a real build on Replit

Author: Roland-Caryl Obam Ngo'O. Version 0.1, 26 October 2026. Successor to the Fund OS PRD v0.1 (what) and the Fund OS Engineering Dossier v0.1 (how), both of 4 October 2026, and to the static demo Fund OS Demo v2 (16 tabs, synthetic data, no backend). Method: the systems analysis and design discipline of the Undergraduate Advanced Diploma in IT Systems Analysis and Design (lifecycle and management, data-driven and procedural techniques, data organisation, objects and architectures), applied to one product.

Conventions. Requirements are MUST, SHOULD or COULD. Every number is public (with source), fund-provided (measured in week one) or illustrative (my assumption, labelled). No prices anywhere in this document. No real fund data: two synthetic fund profiles are seeded for demonstration.

---

## 0. Mode d'emploi (pour moi, en français, à retirer avant partage)

Ce document remplace la démo statique par une application réelle : base de données, rôles, journal append-only, invariants en code, harnais d'évaluation exécutable, adaptateurs derrière des interfaces, mode démo et mode tenant. Il sert trois usages : brief pour Replit Agent (section 15, les prompts se collent dans l'ordre), dossier montrable à un fonds (sections 1 à 14, en anglais), et base de la version fund-of-funds pour Nexus Bay (profil FoF, module M0 Signals, diligence des managers). Règles inchangées : aucun prix, aucune donnée réelle, jamais Oxford comme endossement, aucune action externe par la machine, chaque chiffre étiqueté. L'annexe D (traçabilité vers les unités du Diploma) reste interne.

---

## 1. Terms of reference and scope

### 1.1 Objective
Build Fund OS v3: a multi-module operating system for an investment firm that captures information from conversations and documents, structures it against a single data model, scores and flags against versioned criteria, drafts partner-facing material from the same tables, and measures itself every week, with every external action held for a person.

### 1.2 Two fund profiles, one product
- **VC profile**: an early-stage fund investing directly in companies. Pipeline, portfolio of companies, LP letter.
- **FoF profile**: a hybrid fund-of-funds investing in emerging managers and, selectively, directly in companies. Two holding levels (funds and companies), manager diligence, signal capture from conversations as the first module.
The profile is a configuration, not a fork: entities carry a `kind` (fund or company), criteria sets carry a target (manager or company), and screens switch labels and defaults.

### 1.3 Two run modes
- **Demo mode**: seeded synthetic data for two fictional firms, "Northstar Ventures" (VC profile) and "Bay Harbour Capital" (FoF profile); the model gateway is deterministic; nothing leaves the app. This is what a partner sees on a first call.
- **Tenant mode**: the firm's own database and secrets, live adapters switched on one by one behind feature flags, live model providers on the firm's keys. Never enabled by default.

### 1.4 In scope for v3
Platform (data model, ledger, invariants, model gateway, evaluation harness, read-out, roles), M0 Signal capture, M1 Screening, M2 Monitoring (two layers), M3 Reporting, M4 Diligence assist (companies and managers), M6 Operations and audit console. M5 Sourcing signals is designed and deferred: it has no ground truth inside a firm until M1 has held its bar for two months.

### 1.5 Out of scope
Valuation, term sheets, legal drafting, any outbound communication sent by the system, a new CRM (v3 sits on top of the existing one through adapters), fine-tuning on firm data.

### 1.6 What v3 improves over v2
| v2 (static demo, 5 October) | v3 (this document) |
|---|---|
| HTML page, synthetic data in JavaScript arrays | Database as system of record, seeded synthetic data, importable real exports |
| Tabs that look like modules | Modules with services, invariants, logs and tests |
| Invariants described in text | `InvariantGuard` executed before every write and every draft, covered by property tests |
| Run log as a table on a page | Append-only ledger with hash chaining, one record per run, `explain()` in one query |
| Evaluation shown as numbers | Evaluation harness that runs on an imported gold set and produces the Friday read-out |
| One fund type | VC and FoF profiles; M0 Signal capture and manager diligence added |
| No deployment story | Replit project, environments, secrets, feature flags, handover checklist |

---

## 2. Lifecycle and method

### 2.1 Spiral, one turn per module
Each module is one turn: objectives, risk analysis, build and evaluate, plan the next turn. A turn ends with a read-out against a bar signed in week one and a go or no-go. On Replit the turns are build phases (section 14); each phase ends with acceptance tests that run in the project, not in a slide.

### 2.2 Requirements spiral: gather, analyse, assess feasibility, document, validate
Gathering came from interviews, observation and document study for the VC profile (4 October) and from the public posting and site for the FoF profile (26 October). Analysis is Part 6 to 10 of this document. Feasibility is section 4. Documentation is section 5. Validation is shadow mode on real decisions plus the firm's test week; in demo mode, validation is the acceptance test suite and interface proving with a partner on screen.

### 2.3 Verification versus validation
Verification (built right): unit tests on extractors and scorers, property tests on the guard, contract tests on adapters against fixtures, integrity tests on the database, reproducibility of any logged run. Validation (right thing built): shadow mode, test week, Friday read-out, interface proving sessions recorded formally and repeated after changes.

### 2.4 Change management agreed beforehand
Criteria, thresholds, scope, model and prompt versions change only through a `ChangeRequest` record: what, why, who asked, A/B result on the gold set where applicable, who signed, when applied. The record lives in the decision register and is readable from the audit console.

### 2.5 Process products
A system diary (decisions, dates, evidence) and a system glossary (Appendix B) are files in the repository, updated in the same commits as the code they explain.

---

## 3. Current system investigation and problem statement

### 3.1 How the work runs today (VC profile, confirmed with public data; FoF profile, to confirm in discovery)
- Deal flow arrives by email, web form and introductions; a first pass is made by whoever is free; the CRM stores the outcome and rarely the reason.
- Portfolio data arrives as founder emails and board decks in different formats; the monthly picture is assembled by hand.
- In a fund-of-funds, the same happens one level up: managers send quarterly reports as PDFs, capital calls and distributions arrive by email, and the knowledge about a manager lives in the head of the partner who last spoke to them.
- LP letters are written from scratch each quarter; audits trigger a document hunt.
- "Every conversation is a signal" (public job posting of a fund-of-funds, October 2026): calls, emails and meetings produce facts about people, funds and companies that are not captured as data.

Public anchor for where the hours go: about a hundred opportunities per deal closed, one in four reaching a management meeting, 118 hours of due diligence per closed deal over 83 days (Gompers, Gornall, Kaplan, Strebulaev, Journal of Financial Economics, 2020). Everything else is measured in week one.

### 3.2 The problem in one sentence
Information exists but is scattered and unstructured; decisions exist but carry no label and no reason; nothing is measured, so nothing automated can be trusted.

### 3.3 Binding constraints by profile
- VC profile: **trust** (regulated fund, LP reputation, founders' experience). First move: screening in shadow mode, measured against past decisions.
- FoF profile: **data** (scattered across mail, CRM, data rooms, documents, spreadsheets). First move: signal capture, measured against notes already written.
Both share compliance as a shaping constraint (records, retention, provider terms) and skills as the reason the work is bought rather than hired.

---

## 4. Feasibility report for a Replit build

Conclusion: **B, feasible subject to named dependencies**.

| Test | Finding | Dependency if not met |
|---|---|---|
| A similar successful application exists | Internal tooling of this shape exists at many funds; the novelty is the evaluation layer, which v2 already prototyped | None |
| Input data can be provided | Demo mode needs only the synthetic seed; tenant mode needs a CRM export, a mailbox read scope, past updates or manager reports | Labelling session with a partner if labels are missing; import by CSV if no API |
| Dependencies outside the builder's control are named | Replit Postgres and secrets; model provider terms for tenant mode; CRM API availability | Mock gateway and CSV adapters keep every module runnable without them |
| Security property can be enforced | No outbound adapter is wired to a sending capability; drafts are stored, never sent | If a firm insists on auto-send, the request is refused: it violates principle 1 |

Stop conditions: a module whose gold set cannot be built in week one is paused, not faked.

---

## 5. Requirements catalogue

### 5.1 Platform (shared by all modules)
- P-F1 MUST store all records in a relational database that is the single system of record (section 7); secondary indexes (search, reporting mart) are rebuildable and never written to by hand.
- P-F2 MUST run every automated action through `InvariantGuard` before any write to an external system and before any draft is stored; a blocked action is logged with its reason.
- P-F3 MUST write one `Run` record per automated job to an append-only ledger with hash chaining (each record stores the hash of the previous one), including inputs hash, model and prompt version, output reference, reason, cost, latency, invariant results, reviewer.
- P-F4 MUST route all model calls through a `ModelGateway` with a deterministic mock provider (default) and optional live providers behind feature flags; prompts are versioned files in the repository.
- P-F5 MUST provide role-based access: partner, analyst, operations, builder, auditor (read-only); every access to Documents and Decisions is logged.
- P-F6 MUST provide an evaluation harness: import a gold set (CSV or JSON), run a module on it, compute its metrics, compare two criteria or prompt versions (A/B), store an `Evaluation` record.
- P-F7 MUST generate the Friday read-out (one page per live module: bar, this week, last week, disagreements, incidents, cost) as a stored page and an exportable PDF.
- P-F8 MUST support two profiles (VC, FoF) and two modes (demo, tenant) by configuration.
- P-F9 SHOULD expose a read-only MCP server with tools such as `explain_score`, `portfolio_snapshot`, `open_flags`, `search_documents`, so that a firm's own assistants can read from the system of record without writing to it.
- P-F10 COULD expose a REST export API for the fund administrator and auditors (read-only).

### 5.2 M0 Signal capture (first module for the FoF profile; available to both)
Purpose: turn a conversation (email thread, call note, meeting note) into structured records with sources, validated by a person.
- M0-F1 MUST accept a conversation as pasted text, uploaded file or mailbox adapter item, with participants, date and channel.
- M0-F2 MUST extract entities (person, organisation of kind fund or company, document mentioned) and facts (field, value, confidence, source span) into `Signal` records in state Proposed.
- M0-F3 MUST show a review screen where an analyst accepts, edits or rejects each proposed fact; accepted facts become `OrganisationFact` or `PersonFact` with provenance to the conversation and span.
- M0-F4 MUST answer "what do we know about X" with a timeline of accepted facts and their sources.
- M0-F5 SHOULD propose follow-ups (missing standard fields, promised documents) as tasks owned by a person.
- M0-F6 COULD cluster conversations by organisation and surface contradictions between facts.
Invariants: no fact becomes accepted without a person; no record written to the CRM adapter before acceptance; no message drafted to a counterparty.
Evaluation: gold set of 100 past conversations with human-structured notes; precision and recall of extracted fields; minutes per conversation including review; retrieval test: 20 questions answered with correct sources.

### 5.3 M1 Screening (first module for the VC profile)
Unchanged from the PRD of 4 October (M1-F1 to M1-F8), with two additions:
- M1-F9 MUST support a `CriteriaSet` whose target is `manager` (FoF profile): criteria such as team track record documented, strategy consistency, fund size versus stage, terms within the firm's ranges, references available; evidence definitions written in the week-one workshop.
- M1-F10 MUST import a gold set of past decisions from CSV (deal or manager, outcome, date, person) when no CRM API is available.
Invariants, evaluation and upside as in the PRD.

### 5.4 M2 Monitoring, two layers
- M2-F1 MUST hold the company schema (growth, net burn and runway, gross margin, retention, CAC payback, burn multiple) and the fund schema (NAV, called capital, distributed capital, DPI, TVPI, IRR as reported, number of investments, reserves) with period, currency, source, confidence.
- M2-F2 MUST parse uploaded reports (PDF, XLSX, email text) into the schemas with a confidence per value; low-confidence values enter Needs review and are never written as facts.
- M2-F3 MUST recompute derived metrics and show the formula and its version; for funds, MUST recompute DPI and TVPI from reported components and flag any difference with the reported figure.
- M2-F4 MUST raise flags against thresholds per holding (illustrative company thresholds as in the PRD; illustrative fund thresholds: capital call outside notice period, TVPI reported inconsistent with components, report overdue by 30 days).
- M2-F5 MUST draft reminders for overdue reports as drafts owned by a person; never sent.
- M2-F6 SHOULD maintain holding history pages and cohort views by vintage, stage and sector.
Invariants: no message to a founder or a manager; no value below the confidence bar without review; every value traceable to a source.
Evaluation: completeness by day 10 (companies) and by day 45 after quarter end (funds); parse accuracy on 50 labelled reports; time from receipt to flag; false flag rate reviewed monthly.

### 5.5 M3 Reporting from the same table
- M3-F1 MUST compute cohort percentiles per metric per period with the cohort definition visible.
- M3-F2 MUST draft the data-driven sections of the quarterly LP letter from the reporting mart, each figure linked to its source row; narrative sections are human.
- M3-F3 MUST produce the standard LP data pack as an export reconciled to the same table; valuations are inputs from the administrator, never computed.
- M3-F4 SHOULD answer plain-language questions over the mart with row citations.
Invariants: no figure without a source row; no letter leaves the firm without a partner's edit and send.

### 5.6 M4 Diligence assist, companies and managers
- M4-F1 MUST ingest a data room (folder upload or drive adapter) and index documents with provenance.
- M4-F2 MUST extract claims from the deck or PPM (`Claim` records: statement, figure, document, page) and check each against the data room: supported, contradicted, not found.
- M4-F3 MUST draft the factual sections of the firm's memo template with a citation per figure, and mark "not in data room" rather than filling from general knowledge.
- M4-F4 MUST produce a red-flag list (inconsistencies between documents, missing standard documents, figures that do not reconcile) and a question list.
- M4-F5 SHOULD, for managers, recompute track-record multiples from the schedule of investments and compare with the stated figures.
Invariants: no recommendation, no valuation, no outbound request, no figure without a citation.
Evaluation: share of sections accepted without rewrite; citation accuracy on a sample; red flags confirmed versus missed per deal.

### 5.7 M6 Operations and audit console
- M6-F1 MUST maintain the document vault (type, version, hash, owner, retention class; no delete, only supersede).
- M6-F2 MUST maintain the decision register (every decision, override, criteria change, change request) with who, when, why.
- M6-F3 MUST answer standard requests as exports with a provenance sheet.
- M6-F4 SHOULD run compliance checks the firm defines and raise flags to the operations owner.
- M6-F5 SHOULD reconcile capital calls and distributions received against notices (FoF profile).

### 5.8 Non-functional requirements
| Quality | Requirement | How it is checked |
|---|---|---|
| Traceability | Every score, flag, fact and letter figure links to sources and versions | `explain()` on any record; reconciliation check |
| Boundedness | No external action by the system; drafts only | Property tests on `InvariantGuard`; incident count on the read-out |
| Reproducibility | Any logged run can be replayed to the same output with the same versions | Replay test in CI |
| Availability | Queue and flags ready by 08:00 on working days (tenant mode) | Scheduled job heartbeat; missing heartbeat is an incident |
| Latency | Inbound item processed within one hour during working hours | Ledger timestamps |
| Security | Data in the firm's tenant; secrets in the platform's secret store; roles; access logs | Review with compliance; access log sampling |
| Portability | Any adapter or model replaceable without data migration | Adapter interfaces; A/B harness |
| Maintainability | Runbooks for the three most likely failures; handover checklist per module | Test week; handover sign-off |
| Cost transparency | Cost per run recorded and summed weekly | Read-out |
| Accessibility and usability | Keyboard navigation on queue and review screens; interface proving sessions recorded | Proving protocol, section 12.3 |

### 5.9 Acceptable responses to undesired events
| Event | Response |
|---|---|
| Provider timeout | Retry with backoff, fallback provider, then stop with notification; logged |
| Low extraction confidence | Needs review queue; never a fact |
| Duplicate inbound item | Idempotent ingestion by content hash; no second record |
| Second decision on a decided item | Rejected by database rule; user sees existing decision |
| Attempted outbound action | Blocked by guard; incident raised; stop rule evaluated |
| Scheduled job did not run | Heartbeat incident |
| Gold set missing for a module | Module stays in shadow mode; read-out shows "not measurable" |

---

## 6. Process model

### 6.1 Context diagram (data flow, level 0)
```
 Founders / Managers --intro, deck, update, report--> +------------------+ <-- criteria, overrides, decisions -- Partners
 Mailbox / web form / call notes --conversations----> |                  | --- queues, flags, drafts, read-out --> Partners, Analysts
 CRM <------------- proposed records (after review) ->|     FUND OS v3   | <-- data room documents ------------- Deal team
 Registries --public facts-------------------------> |                  | --- memo draft, claim checks --------> Deal team
 Fund administrator --valuations, notices----------> |                  | --- letter draft, data pack ---------> Partners (then LPs, by a person)
 Model providers <-- prompts / outputs -------------> |                  | --- evidence exports ----------------> Auditors (by a person)
 Secret store --keys (never data)------------------> +------------------+ --- MCP read-only tools -------------> Firm's own assistants
```
Founders, managers and LPs are sources, never destinations of automated flows. Model providers receive prompts and return outputs; they do not hold the data store.

### 6.2 Level 1 data flow, M0 Signal capture
```
 conversation --> [0.1 Register] --> D7 Conversation
                        |
                  [0.2 Extract entities and facts] --> D8 Signal (Proposed, with spans and confidence)
                        |
                  [0.3 Review] <-- analyst accepts / edits / rejects --> D9 OrganisationFact, D10 PersonFact (Accepted, provenance)
                        |
                  [0.4 Propose CRM record] --> adapter outbox (held until a person confirms)
                        |
                  [0.5 Answer "what do we know"] reads D9 + D10 + D7 --> timeline with sources
 every process --> [0.9 Log run] --> D6 Ledger     [0.8 Weekly evaluate] reads D8 + D9 against gold set --> read-out
```

### 6.3 Level 1 data flow, M1 Screening
As in the Engineering Dossier B.2 (ingest and dedupe, extract, score and explain, rank and queue, record decision, draft reply, log run, weekly evaluate), with `CriteriaSet.target` deciding whether the item is a company deal or a manager under consideration.

---

## 7. Data model, normalised (Prisma-ready names)

| Entity | Key | Main attributes | Integrity rules |
|---|---|---|---|
| Firm | firm_id | name, profile (vc, fof), mode (demo, tenant), settings | one row per tenant |
| User | user_id | firm_id, name, email, role (partner, analyst, ops, builder, auditor) | email unique per firm |
| Organisation | org_id | firm_id, kind (company, fund, other), legal_name, country, website, registry_id, sector_tags | registry_id unique when present |
| Person | person_id | firm_id, name, email, org_id (nullable), role_label | email unique when present |
| Conversation | conv_id | firm_id, channel (email, call, meeting, note), occurred_at, participants (link table), raw_text_ref, source_uri | raw text stored once, hashed |
| Signal | signal_id | conv_id, target_type (org, person), target_id (nullable), field, value, confidence, span_start, span_end, state (proposed, accepted, rejected), run_id | accepted requires reviewer_id |
| OrganisationFact | fact_id | org_id, field, value, source_type (signal, document, registry), source_ref, confidence, valid_from, run_id | one current value per field; history kept |
| PersonFact | pfact_id | person_id, field, value, source_ref, confidence, run_id | as above |
| Item | item_id | firm_id, kind (deal, manager_review), org_id, source_channel, received_at, stage, status, owner_id | one open item per org at a time |
| CriteriaSet | criteria_id | firm_id, target (company, manager), version, basis_ref, effective_from, signed_by | immutable once used by a Score |
| Criterion | criterion_id | criteria_id, name, evidence_definition, weight | weights of a set sum to 100 |
| Score | score_id | item_id, criteria_id, value, computed_at, run_id | one score per item per criteria version |
| ScoreReason | (score_id, criterion_id) | met (yes, no, unknown), evidence_fact_id, note | unknown requires a gap note |
| Decision | decision_id | item_id, user_id, outcome (meet, pass, keep_warm, commit, decline), reason, decided_at, score_id | user_id mandatory |
| RevisitTrigger | trigger_id | item_id, condition_text, signal_source, created_by | only for keep_warm |
| Holding | holding_id | firm_id, org_id, level (fund, company), invested_at, instrument, schema_version | subset of Organisation |
| MetricObservation | obs_id | holding_id, period, metric_code, value, currency, source_type, source_ref, confidence, formula_version, run_id | one value per holding, period, metric, source |
| Flag | flag_id | obs_id, rule_version, severity, raised_at, resolved_at, resolved_by, note | resolution requires a person |
| Document | doc_id | firm_id, owner_type, owner_id, type, version, hash, storage_ref, retention_class, provenance | hash unique per version; supersede, never delete |
| Claim | claim_id | item_id, doc_id, page, statement, figure, status (supported, contradicted, not_found), evidence_doc_id, run_id | status requires evidence or an explicit not_found |
| Task | task_id | firm_id, owner_id, kind (follow_up, reminder_draft, review), ref_type, ref_id, due_at, state | drafts never auto-sent |
| Run | run_id | firm_id, module, started_at, inputs_hash, model_version, prompt_version, output_ref, reason, cost, latency_ms, status, invariant_results, reviewer_id, prev_hash, hash | append-only; hash chain verified on read |
| Invariant | invariant_id | name, scope, check_definition, since_version | changes only via ChangeRequest |
| ChangeRequest | cr_id | firm_id, what, why, requested_by, ab_evaluation_id, signed_by, applied_at | signed_by mandatory before applied_at |
| GoldSetItem | gs_id | firm_id, module, payload_json, label_json, source, added_at | versioned by month |
| Evaluation | eval_id | firm_id, module, version_a, version_b (nullable), metrics_json, computed_at, run_id | stored, never recomputed in place |
| AccessLog | log_id | user_id, entity, entity_id, action, at | written by middleware |

Concurrency: decisions use optimistic locking on item_id and status. Secondary structures: a full-text or vector index over Document and Conversation text for retrieval, rebuilt from the base tables; a reporting mart (view) over MetricObservation and Flag, refreshed after each cycle; when mart and base disagree, the base wins.

---

## 8. Behaviour

### 8.1 Entity life history, Item (deal or manager review)
```
Item
 |-- Received
 |-- Extracted
 |-- Scored  (iteration: re-scored on criteria promotion; previous Score kept)
 |-- Queued
 |-- Decided by a person  (selection: Meet | Pass | Keep warm | Commit | Decline)
 |      |-- Meet / Commit  -> handed to diligence (M4) -> Decision recorded again at IC by a person
 |      |-- Pass / Decline -> reply drafted -> sent by a person -> Archived by a person
 |      |-- Keep warm      -> RevisitTrigger set -> (iteration: signal checked) -> Re-queued when matched
 |-- Added to gold set with its outcome
 |-- Retention clock started
```
States enterable only by a person: Decided, Archived.

### 8.2 Entity life history, Conversation (M0)
```
Conversation
 |-- Registered
 |-- Extracted (Signals proposed)
 |-- Reviewed by a person (iteration per Signal: Accepted | Edited then Accepted | Rejected)
 |-- Facts written (OrganisationFact, PersonFact) with provenance
 |-- CRM record proposed (outbox) -> Confirmed by a person -> Written through adapter
 |-- Added to gold set when a human-structured note exists
```
States enterable only by a person: Reviewed, Confirmed.

### 8.3 State diagram, periodic report (M2, both layers)
```
Expected --(received)--> Received --(parsed above bar)--> Validated --(rules)--> Flagged | Clear
Expected --(overdue)--> Overdue --(reminder drafted, sent by a person)--> Expected
Received --(low confidence)--> Needs review --(person confirms)--> Validated
Flagged --(resolved with note)--> Resolved
```

### 8.4 Event and response list (extract)
| Event | Response | Owner |
|---|---|---|
| New conversation registered | Extraction job queued; Signals proposed within one hour | System |
| Signal accepted | Fact written; CRM record proposed to outbox | Analyst |
| Item scored | Queue updated; reasons and gaps attached | System |
| Decision recorded | Gold set candidate created; reply draft prepared | Partner |
| Report received | Parse; validate; rules; flags | System, Analyst on review |
| Friday 07:00 | Read-out computed and stored | System |
| Metric below bar two weeks running | Alarm to partner and builder | System |
| Change request signed | Version promoted; A/B stored; register updated | Partner |

---

## 9. Use cases

Actors: Partner, Analyst, Operations, Builder, Auditor (read-only), Scheduler.

| Use case | Actor | Main success scenario | Extensions |
|---|---|---|---|
| UC0 Capture a conversation | Analyst | Pastes or uploads; Signals proposed; reviews; facts written; CRM record proposed | Low confidence: left Proposed |
| UC1 Review ranked queue | Partner | Sees score, reasons, gaps; decides; reason recorded | Override creates gold set example |
| UC2 Score inbound item | Scheduler | Ingest, extract, score, queue, log | Needs review instead of score |
| UC3 Draft reply | Analyst | Draft prepared with gap questions; analyst edits and sends outside the system | Never sent by the system |
| UC4 Promote criteria version | Partner | Reviews A/B; signs; new version effective | Below bar: rejected |
| UC5 Submit or ingest a report | Founder form or Analyst upload | Parsed to schema; validated; flags | Needs review |
| UC6 Resolve flag | Partner, Analyst | Resolve with note | Escalation on severity |
| UC7 Draft quarterly letter | Analyst | Sections from mart with source rows; partner edits | Reconciliation failure blocks |
| UC8 Check claims in a data room | Deal team | Claims extracted; each checked; red flags and questions | Not found left explicit |
| UC9 Answer audit request | Operations | Query; export with provenance | Access logged |
| UC10 Weekly read-out | Scheduler | Metrics against bar; disagreements; incidents | Alarm on two misses |
| UC11 Import gold set | Builder, Analyst | CSV or JSON import; validation; versioned | Schema mismatch report |
| UC12 Run evaluation or A/B | Builder, Partner | Choose module and versions; run; store Evaluation | Attach to ChangeRequest |
| UC13 What do we know about X | Partner | Timeline of accepted facts with sources | Contradictions surfaced |

---

## 10. Class responsibility cards (CARC, abbreviated)

**InvariantGuard** (owner: builder, reviewed by compliance). Responsibilities: evaluate every invariant before any write to an adapter or any draft; block and log on failure; not bypassable by configuration or feature flag. Interface: `check(action, context) -> allow | block(reason)`. Collaborators: every service, Ledger.

**Ledger** (owner: builder). Responsibilities: append-only `Run` records with hash chain; `explain(recordId)` returns the run, inputs, versions and reasons; verify chain integrity on demand. Interface: `append(run)`, `explain(id)`, `verifyChain()`.

**ModelGateway** (owner: builder). Responsibilities: single entry for model calls; deterministic mock by default; live providers behind flags; prompt versioning; cost and latency capture; retry, fallback, stop. Interface: `complete(promptVersion, input, options) -> output, usage`.

**Extractor** (owner: builder). Responsibilities: turn conversation or document text into Signals or CompanyFacts with spans and confidence; never write accepted facts. Interface: `extract(source, schemaVersion) -> proposals`.

**Scorer** (owner: builder). Responsibilities: one ScoreReason per Criterion; no value without reasons; Needs review when evidence is insufficient. Interface: `score(item, criteriaSet) -> Score | NeedsReview`.

**RuleEngine** (owner: analyst). Responsibilities: thresholds per holding and schema; derived metrics with formula versions; flags with rule versions. Interface: `evaluate(observation) -> flags`.

**ReadOut** (owner: partner). Responsibilities: weekly metrics against bar; disagreements; incidents; alarm on two consecutive misses. Interface: `compute(week)`, `render()`.

**ConnectorRegistry** (owner: builder). Responsibilities: register adapters (mailbox, CRM, drive, data room, registry, administrator) behind interfaces; CSV and mock adapters always available; outbox for proposed writes awaiting confirmation. Interface: `get(name)`, `outbox.propose(record)`, `outbox.confirm(id, user)`.

---

## 11. Architecture for Replit

### 11.1 Three tiers inside one project
```
 Presentation : Next.js (App Router, TypeScript), Tailwind, server components; screens by role (section 12)
 Domain       : /src/domain  services (Extractor, Scorer, RuleEngine, ReadOut, Guard, Ledger, Gateway), pure functions where possible
 Data         : PostgreSQL (Replit database) via Prisma; object storage for documents (Replit Object Storage or local in demo mode)
 Adapters     : /src/adapters  mock, csv, mailbox, crm, drive, registry, administrator; each behind an interface with contract tests
 Jobs         : /src/jobs  queue table + worker route invoked by a scheduled deployment (hourly) and by manual trigger in demo mode
 Cross-cutting: secrets in Replit Secrets (never in code); feature flags in Firm.settings; access log middleware; test and demo seeds
```
Python alternative (FastAPI, SQLModel, Jinja or React) is acceptable; the data model and tests do not change. Next.js is chosen because Replit Agent scaffolds it reliably and one language covers UI, API and jobs.

### 11.2 Repository layout
```
/prisma/schema.prisma            data model of section 7
/prisma/seed/northstar.ts        VC demo profile (synthetic)
/prisma/seed/bayharbour.ts       FoF demo profile (synthetic)
/src/domain/*                    services and CARC classes
/src/adapters/*                  interfaces + mock + csv + live stubs
/src/prompts/<module>/<version>.md   versioned prompts
/src/app/(partner|analyst|ops|audit)/*  screens
/src/jobs/*                      worker and schedules
/tests/unit, /tests/property, /tests/contract, /tests/e2e (Playwright)
/docs/system-diary.md  /docs/glossary.md  /docs/runbooks/*.md  /docs/handover-checklist.md
```

### 11.3 Deployment and environments
Demo mode runs on a single Replit deployment with seeded data and the mock gateway. Tenant mode runs on a separate deployment per firm with its own database, secrets and flags; live adapters are enabled one at a time; the first live adapter is always read-only (CRM read, mailbox read). Backups: nightly JSON export of the base tables to object storage; restore procedure in the runbooks.

### 11.4 Security properties as code
No adapter in the repository implements a send capability. The outbox stores proposed writes; only a user action moves them to Confirmed, and only read-and-write adapters explicitly enabled per firm can apply them. Property tests generate random action sequences and assert that no sequence produces an outbound message or a delete.

---

## 12. Interface design and proving

### 12.1 Screens by role
- Partner: Home (the week of the firm by role, live counts), Queue (items with score, reasons, gaps, one-click decision with reason), Holdings (two layers, flags first), Letter (sections with source rows), Read-out (Friday page), Decisions (register).
- Analyst: Capture (paste or upload a conversation, review proposals), Needs review (facts, values, parses), Reports (ingest, validate), Drafts (replies, reminders, never a send button), Gold sets and Evaluations.
- Operations: Vault, Requests console (query and export with provenance), Capital calls and distributions (FoF), Compliance checks.
- Builder: Adapters and flags, Jobs and heartbeat, Prompts and versions, Change requests, Ledger verify.
- Auditor: read-only Decisions, Documents, Exports.

### 12.2 Navigation and labels by profile
Profile switches vocabulary: "Deals" versus "Managers and deals", "Portfolio companies" versus "Funds and companies", "Founder update" versus "Manager report". The data model does not change.

### 12.3 Interface proving protocol
Week one: paper or clickable mock-ups of Queue, Capture review and Holdings shown to one partner and one analyst; responses recorded in a fixed form (task, time, errors, comments); changes made; trial repeated (regression). Week four: the same protocol on the running system during the firm's test week. A queue nobody opens on Monday is a failed requirement, whatever the tests say.

---

## 13. Errors, exceptions and testing

### 13.1 Errors by class
As in the Engineering Dossier B.10, plus: hash chain verification failure (incident, read-only mode until resolved), seed and migration mismatch (deployment blocked), feature flag enabling a live adapter in demo mode (refused by configuration validation).

### 13.2 Testing strategy
- Unit: extractors, scorer, rule engine, formula versions, mart refresh.
- Property: `InvariantGuard` (no sequence of inputs produces an outbound action or a delete), ledger chain (any mutation breaks verification).
- Contract: every adapter against recorded fixtures; mock and CSV adapters are part of the suite.
- Integrity: database rules (one open item per organisation, weights sum to 100, person required on decisions).
- Reproducibility: replay a logged run with the mock gateway and compare outputs.
- End to end (Playwright): the ten use cases of section 9 on the demo seed.
- Acceptance: written from each phase's definition of done (section 14); the gold set is the regression suite for scoring and extraction.
- Validation: shadow mode, test week, Friday read-out, interface proving.

---

## 14. Delivery plan on Replit (phases, definitions of done)

| Phase | Scope | Definition of done (verifiable) |
|---|---|---|
| 0 Constitution | Repository, stack, data model, two seeds, roles, guard, ledger, mock gateway, CI with tests | `npm test` green; seeds load both profiles; guard property tests pass; ledger verify passes; no secret in code |
| 1 M0 Signal capture | Capture, extraction (mock and live behind flag), review screen, facts, "what do we know", outbox | UC0 and UC13 e2e pass; 100-item synthetic gold set evaluated; read-out page shows M0 metrics |
| 2 M1 Screening | Intake (CSV and mock mailbox), extraction, criteria sets (company and manager), scoring, queue, decisions, reply drafts | UC1 to UC4 pass; A/B of two criteria versions stored; no decision without user |
| 3 M2 and M3 | Two-layer schemas, parsing to Needs review, rules and flags, mart, letter draft, data pack export | UC5 to UC7 pass; reconciliation check blocks on mismatch; derived metrics show formula versions |
| 4 M4 and M6 | Data room ingest, claims check, memo sections with citations, vault, register, requests console | UC8 and UC9 pass; "not in data room" explicit; exports carry provenance |
| 5 Hardening and handover | Access logs, heartbeat, runbooks, backups, MCP read-only server, handover checklist, demo script | Appendix C checklist complete; demo runs end to end in under 20 minutes |

Effort is given per phase in the system diary once phase 0 is measured; no estimate is written here before the first phase is timed.

---

## 15. Replit Agent prompts, in order

Paste one prompt per phase. Each prompt repeats the constitution because the agent does not remember it. Review the diff after each prompt; nothing is merged without the tests passing.

### Prompt 0, constitution
```
You are building "Fund OS v3", an operating system for an investment firm. Stack: Next.js (App Router, TypeScript), Tailwind, Prisma, PostgreSQL (Replit database). Create the project with this constitution, and keep it in /docs/constitution.md:

1. The relational database is the single system of record. Search indexes and reporting views are rebuildable and never written by hand.
2. No code path may send a message, email, or external write without a human confirmation step recorded with user_id. Implement src/domain/guard.ts (InvariantGuard) and call it before every adapter write and before storing any draft. Add property tests proving no sequence of actions produces an outbound send or a delete.
3. Every automated job writes one Run record to an append-only ledger with a hash chain (prev_hash, hash) in src/domain/ledger.ts, including inputs_hash, model_version, prompt_version, output_ref, reason, cost, latency_ms, status, invariant_results. Provide explain(id) and verifyChain().
4. All model calls go through src/domain/gateway.ts (ModelGateway). Default provider is a deterministic mock that returns fixtures. Live providers are only enabled by a feature flag per firm and read keys from Replit Secrets. Prompts are versioned markdown files under src/prompts/<module>/<version>.md.
5. Roles: partner, analyst, ops, builder, auditor (read-only). Middleware writes an AccessLog row for every read of Documents and Decisions.
6. Two firm profiles (vc, fof) and two modes (demo, tenant) are configuration on the Firm table. Demo mode must never call a live provider or adapter; add a configuration validation that refuses it.
7. Implement the Prisma schema exactly as in /docs/data-model.md (I will paste it next) with the integrity rules as database constraints where possible and as service checks otherwise.
8. Seeds: prisma/seed/northstar.ts (fictional VC fund "Northstar Ventures": 60 items, 12 holdings, 3 criteria versions, 200 gold set decisions) and prisma/seed/bayharbour.ts (fictional fund-of-funds "Bay Harbour Capital": 25 fund holdings, 10 direct companies, 120 conversations with human-structured notes as gold set, 40 manager reviews). All data synthetic; mark it as synthetic on the home screen.
9. Tests: unit, property, contract (adapters against fixtures), integrity, reproducibility (replay a run), e2e with Playwright. `npm test` must run all of them. CI fails on any secret pattern committed.
10. Documentation files: /docs/system-diary.md (append one entry per phase: decision, date, evidence), /docs/glossary.md, /docs/runbooks/, /docs/handover-checklist.md.

Deliver phase 0: project scaffold, schema, seeds, guard, ledger, gateway mock, roles, access log, CI. Do not build module screens yet. Stop and show me the schema and the test output.
```

### Prompt 1, M0 Signal capture
```
Build module M0 Signal capture under the constitution in /docs/constitution.md.
Screens (analyst): /analyst/capture (paste text or upload .txt/.eml/.md; fields: channel, occurred_at, participants), /analyst/review/[convId] (table of proposed Signals with field, value, confidence, highlighted source span; actions accept, edit then accept, reject; bulk accept above a confidence bar the user sets), /partner/know/[orgId] ("what do we know": timeline of accepted facts with source links and a contradictions panel).
Domain: Extractor.extract(conversation, schemaVersion) returns Signals (proposed) via the gateway; prompts in src/prompts/m0/v1.md; schema for organisation facts: legal_name, kind, strategy, stage_focus, fund_size, last_contact, next_step, documents_promised; for person facts: role, organisation, email, last_contact.
Rules: a Signal becomes a Fact only through a review action with user_id. Accepted facts create an outbox record "propose CRM update" that stays pending until a user confirms on /analyst/outbox; the mock CRM adapter applies it only then.
Evaluation: /builder/evaluations lets me pick module m0, run extraction on the Bay Harbour gold set (120 conversations), and stores precision and recall per field, minutes per conversation (simulated), and a 20-question retrieval test with source correctness. Show results on /partner/readout.
Tests: e2e for UC0 and UC13; unit tests for the extractor on fixtures; property test that no review-less path writes a Fact. Update the system diary. Stop and show me the evaluation output.
```

### Prompt 2, M1 Screening
```
Build module M1 Screening under the constitution.
Data: CriteriaSet with target company or manager, versioned, signed_by; Criterion weights sum to 100 (database check). Seeds include criteria v1 and v2 for Northstar (company target) and v1 for Bay Harbour (manager target).
Intake: CSV import of items (company or manager, source, received_at, deck text or notes) and a mock mailbox adapter; dedupe by registry_id or domain plus content hash; idempotent.
Domain: Extractor to CompanyFact/OrganisationFact with source pointers; Scorer.score(item, criteriaSet) returns one ScoreReason per criterion (met yes/no/unknown, evidence fact, gap note) or NeedsReview when evidence is insufficient; never a score without reasons.
Screens: /partner/queue (ranked list, score, reasons, gaps, decision buttons meet/pass/keep warm or commit/decline with mandatory reason; optimistic locking so a second partner sees the first decision), /analyst/drafts (reply drafts generated after a decision; no send button anywhere), /partner/criteria (versions, diff between versions, promote only through a ChangeRequest with an attached A/B Evaluation).
Evaluation: run scoring on the 200 Northstar gold decisions; metrics recall on "took a meeting", precision on "meet", disagreement rate; A/B v1 versus v2 stored as Evaluation and shown on the read-out.
Tests: e2e UC1 to UC4; integrity test for one open item per organisation and for person-required decisions; reproducibility test replaying a scoring run. Update the system diary. Stop and show me the read-out.
```

### Prompt 3, M2 Monitoring and M3 Reporting
```
Build M2 and M3 under the constitution.
Schemas: company (growth, net_burn, runway_months, gross_margin, retention, cac_payback_months, burn_multiple) and fund (nav, called, distributed, dpi, tvpi, irr_reported, investments_count, reserves), with period, currency, source_type, source_ref, confidence, formula_version for derived values.
Ingest: upload PDF, XLSX or paste text; parse through the gateway into MetricObservations; values below the confidence bar go to /analyst/needs-review and are never written as Validated without a user action. Recompute runway, burn multiple, DPI and TVPI from components and flag any difference with reported figures.
Rules: RuleEngine with thresholds per holding and schema (seed illustrative thresholds and label them illustrative); flags with rule_version; /partner/holdings shows two layers (funds, companies) with flags first; flag resolution requires a note and user_id.
Reminders: overdue reports create Task records of kind reminder_draft; drafts visible on /analyst/drafts; no send.
M3: a reporting mart (SQL view) refreshed after each ingest; /partner/letter drafts data-driven sections with a source row link per figure; a reconciliation check (letter figures equal mart figures) blocks the draft on mismatch; /ops/datapack exports CSV with a provenance sheet. Valuations are inputs from the administrator adapter (mock), never computed.
Tests: e2e UC5 to UC7; unit tests for formulas and the reconciliation check; parse accuracy on 50 seeded labelled reports shown on the read-out. Update the system diary.
```

### Prompt 4, M4 Diligence assist and M6 Operations
```
Build M4 and M6 under the constitution.
M4: /dealteam/dataroom/[itemId] accepts a folder upload; documents stored with hash, type, provenance; an index for retrieval rebuilt from Documents. Claims: extract statements and figures from the deck or PPM into Claim records (statement, figure, doc, page); check each against the other documents: supported, contradicted, not_found, with evidence pointers; memo sections drafted from the firm's template with a citation per figure; "not in data room" explicit; red-flag list and question list. For manager items, recompute track-record multiples from a schedule of investments sheet and compare with stated figures. No recommendation and no valuation anywhere in the output.
M6: /ops/vault (documents with version, hash, retention class; supersede only), /ops/register (decisions, overrides, criteria changes, change requests), /ops/requests (query by organisation, period, document type; export with provenance sheet; every access logged), /ops/capital (FoF: capital calls and distributions reconciled against notices, mock administrator adapter), /ops/compliance (checks defined in Firm.settings, flags to the ops owner).
Tests: e2e UC8 and UC9; unit tests for claim checking and multiple recomputation; access log assertions. Update the system diary.
```

### Prompt 5, hardening, read-out, MCP and handover
```
Finish v3 under the constitution.
Read-out: scheduled job every Friday 07:00 (and a manual trigger in demo mode) computes one page per live module: bar, this week, last week, disagreements to review, incidents, cost; stored as a page and exportable as PDF; alarm when a metric is below bar two weeks running.
Heartbeat: a job that records its own run; a missing heartbeat creates an incident visible on /builder/jobs.
MCP: a read-only MCP server exposing explain_score(id), portfolio_snapshot(period), open_flags(), search_documents(query), what_do_we_know(orgId); no tool writes anything; include a contract test.
Backups: nightly JSON export of base tables to object storage; restore script; runbook.
Runbooks in /docs/runbooks: provider outage, adapter credential expiry, ledger chain verification failure.
Handover checklist in /docs/handover-checklist.md: test and production copies, configuration and secrets inventory (names only), backups and restore tested, six-minute walkthrough script, one-page architecture map, support terms placeholder.
Demo script in /docs/demo-20-min.md: home, capture and review, queue and decision, holdings and flags, letter with sources, ledger explain, read-out, roadmap.
Run the full test suite, fix anything red, verify that demo mode cannot reach any live provider or adapter, and show me the final test output and the demo script.
```

---

## 16. Risk register for the build

| Risk | Likelihood | Impact | Early signal | Response |
|---|---|---|---|---|
| Agent scaffolds a send capability "for convenience" | Medium | High | Any mail or webhook client in the diff | Reject the diff; guard tests must fail on it |
| Schema drifts from this document | Medium | Medium | Prisma schema differs from section 7 | Diff review after each prompt; integrity tests |
| Demo seed looks real | Low | High | Real company or fund names in seeds | Synthetic names only; review seeds |
| Over-building screens before the ledger and guard exist | Medium | Medium | Screens in phase 0 | Prompt 0 forbids it |
| Live provider enabled in demo mode | Low | High | Flag set in demo firm | Configuration validation refuses |
| Evaluation numbers typed rather than computed | Medium | High | Metrics without an Evaluation record | Read-out reads only Evaluation rows |
| Scope creep from "can it also" | High | Medium | New requirements mid-phase | Change request; version 2 list |

---

## 17. Open questions before tenant mode
1. Which CRM, and does it expose a write API or only exports?
2. Mailbox provider and the smallest read scope that works.
3. Who signs criteria, thresholds and the stop rule?
4. Which model providers are acceptable, and is a tenant-hosted model required for M4 or M6?
5. Retention periods per document type and personal data.

---

## Appendix A. Requirements document skeleton used per module
Introduction (purpose, scope, definitions, references); general description (perspective, functions, users, constraints, assumptions and dependencies); specific requirements (functional MUST, SHOULD, COULD; non-functional; interfaces; data; acceptable responses to undesired events); feasibility statement (A, B or C with dependencies); definition of done and acceptance tests; change management procedure.

## Appendix B. Glossary
Item: a company deal or a manager under review. Signal: a proposed fact extracted from a conversation. Fact: an accepted signal or document-derived value with provenance. Gold set: labelled past records owned by the firm, used for measurement. Shadow mode: the system scores while people decide as before. Criteria set: versioned, signed translation of the firm's thesis or manager selection policy. Invariant: a rule checked in code before any action. Ledger: the append-only, hash-chained log of runs. Read-out: the weekly one-page metric report against the bar. Outbox: proposed external writes awaiting a person's confirmation. Mart: rebuildable reporting view. Definition of done: the verifiable list that closes a phase.

## Appendix C. Verification checklist before any module goes live
Gold set exists and is owned by the firm. Bar signed. Guard property tests pass. Contract tests pass for every enabled adapter. Reproducibility test passes. Ledger chain verifies. Demo and tenant separated. Runbooks for three failures written. Heartbeat configured. Roles reviewed with compliance. Handover checklist started. Read-out automated for Friday.

## Appendix D. Internal: where each part comes from (remove before sharing)
| Part | Diploma unit | Reused |
|---|---|---|
| 2, 4, 14, 16 | The System Development Life-cycle and Management | Spiral lifecycle, cost of errors, requirements spiral, feasibility A/B/C with dependencies, V&V, change management agreed beforehand, process products |
| 6, 8, 12.3 | Data Driven and Procedural Techniques | Context diagram, level 1 DFDs, entity life histories (Jackson structures: sequence, selection, iteration), state diagrams, event and response modelling, interface proving |
| 7, 11 (data tier), 13.1 | Data Organisation | Keys, integrity rules, normalisation, concurrency, access control, post-relational structures as secondary indexes, backup and restore |
| 9, 10, 11, 13.2 | Objects and Architectures | Use cases, CARC cards, separable interfaces, three-tier architecture, distributed concerns, errors and exceptions, testing |
| 2.5, 16 | Team and individual projects | System diary, process metrics, risk register |
