13. Data model, normalised (Prisma-ready names)

Entities kept from v3 are listed briefly; new or changed ones are marked (new).

Entity	Key	Main attributes	Integrity rules
Firm	firm_id	name, profile (vc, fof), mode (demo, tenant), language, settings (budgets, thresholds, providers allowlist, flags)	one row per tenant
User	user_id	firm_id, name, email, role, sso_subject	email unique per firm
Organisation	org_id	firm_id, kind (company, fund, other), legal_name, country, website, registry_id, sector_tags, state (proposed, confirmed)	registry_id unique when present
Person	person_id	firm_id, name, email, org_id, role_label, state	email unique when present
Conversation	conv_id	firm_id, channel (call, meeting, email, memo, note), occurred_at, participants (link table), raw_ref, source_uri, language	raw stored once, hashed
Consent (new)	consent_id	conv_id, person_id, type (recording, transcription), recorded_by, recorded_at, method	required before any transcribe run on conv_id
Observation (new)	obs_id	doc_id or conv_id, modality (text, table, chart, audio, video, web), locator_json (page, bbox, cell, t_start, t_end, url), text, value_json, confidence, extractor_version, run_id	one per extracted unit; immutable
Document	doc_id	firm_id, owner_type, owner_id, type (deck, update, report, notice, transcript, snapshot, letter, brief, agent_note, memo, other), version, hash, storage_ref, retention_class, legal_hold, provenance, language	hash unique per version; supersede, never delete
Episode (new)	episode_id	firm_id, acting_user_id or service_identity, surface, trigger (user, schedule, inbound), skill, goal, plan_json, status (planned, awaiting_approval, running, stopped, done, failed), cost, critic_verdict, started_at, ended_at	status Presented requires critic_verdict
Step (new)	step_id	episode_id, seq, kind (perceive, resolve, plan, tool, critic, present, learn), tool_name, tool_version, input_ref, output_ref, run_id	seq unique per episode
Proposal (new)	proposal_id	firm_id, episode_id, type (entity, fact, score, flag, draft, crm_update, task, document_request), target_type, target_id, payload_json, state (proposed, accepted, edited, rejected, confirmed, applied, failed), reviewer_id, reviewed_at, edit_diff	confirmed and applied only for external types; applied requires confirmed and an enabled adapter
OrganisationFact	fact_id	org_id, field, value, obs_id, source_type, confidence, valid_from, run_id	one current value per field; history kept
PersonFact	pfact_id	person_id, field, value, obs_id, confidence, run_id	as above
Item	item_id	firm_id, kind (deal, manager_review), org_id, source_channel, received_at, stage, status, owner_id	one open item per organisation
CriteriaSet, Criterion	criteria_id; criterion_id	target (company, manager), version, basis_ref, effective_from, signed_by; name, evidence_definition, weight	immutable once scored; weights sum to 100
Score, ScoreReason	score_id; (score_id, criterion_id)	item_id, criteria_id, value, run_id; met, evidence_obs_id, note	one score per item per criteria version; unknown requires a gap note
Decision	decision_id	item_id, user_id, outcome, reason, reason_audio_ref, decided_at, score_id	user_id mandatory
RevisitTrigger	trigger_id	item_id, condition_text, signal_source, created_by	only for keep_warm
Holding	holding_id	firm_id, org_id, level (fund, company), invested_at, instrument, schema_version	subset of Organisation
MetricObservation	metric_obs_id	holding_id, period, metric_code, value, currency, source_type, obs_id, confidence, indicative (chart-read), formula_version, run_id	one value per holding, period, metric, source; indicative never Validated without a person
Flag	flag_id	metric_obs_id, rule_version, severity, playbook_ref, raised_at, resolved_at, resolved_by, note	resolution requires a person
Claim	claim_id	item_id, doc_id, page, statement, figure, status (supported, contradicted, not_found), evidence_obs_id, run_id	status requires evidence or an explicit not_found
Task	task_id	firm_id, owner_id, kind (follow_up, reminder_draft, review, consent), ref_type, ref_id, due_at, state	drafts never auto-sent
Brief (new)	brief_id	firm_id, kind (daily, monday_pack, readout), period, doc_id, audio_ref (nullable), generated_by_run	regenerated, never edited in place
ChartSpec (new)	chart_id	firm_id, owner_type, owner_id, spec_json, data_query, generated_at	regenerable from the mart
Run	run_id	firm_id, skill, tool_name, started_at, inputs_hash, provider, model_version, prompt_version, temperature, seed, output_ref, reason, cost, latency_ms, status, invariant_results, reviewer_id, prev_hash, hash	append-only; chain verified
Invariant	invariant_id	name, scope, check_definition, since_version	changes only via ChangeRequest
AutonomyPolicy (new)	(firm_id, skill)	level (0 to 3), since, change_request_id, set_by	level up requires change_request_id; level down requires a reason
ChangeRequest	cr_id	firm_id, what, why, requested_by, ab_evaluation_id, signed_by, applied_at	signed_by mandatory before applied_at
GoldSetItem	gs_id	firm_id, skill, modality, payload_ref, label_json, source (import, review), added_at	versioned by month
Evaluation	eval_id	firm_id, skill or sense, version_a, version_b, metrics_json, suite (gold, planted_error, injection, perception), computed_at, run_id	stored, never recomputed in place
AccessLog	log_id	user_id or service_identity, entity, entity_id, action, at	written by middleware

Concurrency: optimistic locking on Item status and on Proposal state. Secondary structures: full-text and vector indexes over Observation and Document text, rebuilt from base tables; reporting mart as views over MetricObservation, Flag and Decision; when a view and the base disagree, the base wins.

