-- Applied together with migration.sql by the Phase 0 development setup.
-- These are protective database triggers, never application deletion paths.
ALTER TABLE "User" ADD CONSTRAINT user_firm_fk FOREIGN KEY (firm_id) REFERENCES "Firm"(firm_id);
ALTER TABLE "Organisation" ADD CONSTRAINT org_firm_fk FOREIGN KEY (firm_id) REFERENCES "Firm"(firm_id);
ALTER TABLE "Organisation" ADD CONSTRAINT org_kind CHECK (kind IN ('company','fund','other'));
ALTER TABLE "Organisation" ADD CONSTRAINT org_state CHECK (state IN ('proposed','confirmed'));
ALTER TABLE "Person" ADD CONSTRAINT person_firm_fk FOREIGN KEY (firm_id) REFERENCES "Firm"(firm_id);
ALTER TABLE "Person" ADD CONSTRAINT person_org_fk FOREIGN KEY (org_id) REFERENCES "Organisation"(org_id);
ALTER TABLE "Conversation" ADD CONSTRAINT conv_firm_fk FOREIGN KEY (firm_id) REFERENCES "Firm"(firm_id);
ALTER TABLE "Conversation" ADD CONSTRAINT conv_channel CHECK (channel IN ('call','meeting','email','memo','note'));
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT participant_person_fk FOREIGN KEY (person_id) REFERENCES "Person"(person_id);
ALTER TABLE "Consent" ADD CONSTRAINT consent_conv_fk FOREIGN KEY (conv_id) REFERENCES "Conversation"(conv_id);
ALTER TABLE "Consent" ADD CONSTRAINT consent_person_fk FOREIGN KEY (person_id) REFERENCES "Person"(person_id);
ALTER TABLE "Consent" ADD CONSTRAINT consent_user_fk FOREIGN KEY (recorded_by) REFERENCES "User"(user_id);
ALTER TABLE "Consent" ADD CONSTRAINT consent_type CHECK (type IN ('recording','transcription'));
ALTER TABLE "Document" ADD CONSTRAINT doc_firm_fk FOREIGN KEY (firm_id) REFERENCES "Firm"(firm_id);
ALTER TABLE "Document" ADD CONSTRAINT doc_type CHECK (type IN ('deck','update','report','notice','transcript','snapshot','letter','brief','agent_note','memo','other'));
ALTER TABLE "Observation" ADD CONSTRAINT obs_doc_fk FOREIGN KEY (doc_id) REFERENCES "Document"(doc_id);
ALTER TABLE "Observation" ADD CONSTRAINT obs_conv_fk FOREIGN KEY (conv_id) REFERENCES "Conversation"(conv_id);
ALTER TABLE "Observation" ADD CONSTRAINT obs_run_fk FOREIGN KEY (run_id) REFERENCES "Run"(run_id);
ALTER TABLE "Observation" ADD CONSTRAINT obs_source CHECK ((doc_id IS NULL) <> (conv_id IS NULL));
ALTER TABLE "Observation" ADD CONSTRAINT obs_confidence CHECK (confidence BETWEEN 0 AND 1);
ALTER TABLE "Episode" ADD CONSTRAINT episode_firm_fk FOREIGN KEY (firm_id) REFERENCES "Firm"(firm_id);
ALTER TABLE "Episode" ADD CONSTRAINT episode_actor_fk FOREIGN KEY (acting_user_id) REFERENCES "User"(user_id);
ALTER TABLE "Episode" ADD CONSTRAINT episode_actor CHECK ((acting_user_id IS NULL) <> (service_identity IS NULL));
ALTER TABLE "Episode" ADD CONSTRAINT episode_trigger CHECK (trigger IN ('user','schedule','inbound'));
ALTER TABLE "Episode" ADD CONSTRAINT presented_critic CHECK (status <> 'done' OR critic_verdict = 'passed');
ALTER TABLE "Episode" ADD CONSTRAINT positive_cost CHECK (cost >= 0);
ALTER TABLE "Step" ADD CONSTRAINT step_run_fk FOREIGN KEY (run_id) REFERENCES "Run"(run_id);
ALTER TABLE "Proposal" ADD CONSTRAINT proposal_firm_fk FOREIGN KEY (firm_id) REFERENCES "Firm"(firm_id);
ALTER TABLE "Proposal" ADD CONSTRAINT proposal_reviewer_fk FOREIGN KEY (reviewer_id) REFERENCES "User"(user_id);
ALTER TABLE "Proposal" ADD CONSTRAINT review_requires_human CHECK (state = 'proposed' OR (reviewer_id IS NOT NULL AND reviewed_at IS NOT NULL));
ALTER TABLE "Proposal" ADD CONSTRAINT external_state CHECK (state NOT IN ('confirmed','applied') OR type IN ('crm_update','document_request'));
ALTER TABLE "Proposal" ADD CONSTRAINT no_applied_in_phase0 CHECK (state <> 'applied');
ALTER TABLE "OrganisationFact" ADD CONSTRAINT fact_org_fk FOREIGN KEY (org_id) REFERENCES "Organisation"(org_id);
ALTER TABLE "OrganisationFact" ADD CONSTRAINT fact_obs_fk FOREIGN KEY (obs_id) REFERENCES "Observation"(obs_id);
ALTER TABLE "OrganisationFact" ADD CONSTRAINT fact_run_fk FOREIGN KEY (run_id) REFERENCES "Run"(run_id);
ALTER TABLE "OrganisationFact" ADD CONSTRAINT fact_reviewer_fk FOREIGN KEY (reviewer_id) REFERENCES "User"(user_id);
CREATE UNIQUE INDEX one_current_org_fact ON "OrganisationFact"(org_id, field) WHERE valid_to IS NULL;
ALTER TABLE "PersonFact" ADD CONSTRAINT pfact_person_fk FOREIGN KEY (person_id) REFERENCES "Person"(person_id);
ALTER TABLE "PersonFact" ADD CONSTRAINT pfact_obs_fk FOREIGN KEY (obs_id) REFERENCES "Observation"(obs_id);
ALTER TABLE "PersonFact" ADD CONSTRAINT pfact_reviewer_fk FOREIGN KEY (reviewer_id) REFERENCES "User"(user_id);
CREATE UNIQUE INDEX one_current_person_fact ON "PersonFact"(person_id, field) WHERE valid_to IS NULL;
ALTER TABLE "Item" ADD CONSTRAINT item_org_fk FOREIGN KEY (org_id) REFERENCES "Organisation"(org_id);
ALTER TABLE "Item" ADD CONSTRAINT item_firm_fk FOREIGN KEY (firm_id) REFERENCES "Firm"(firm_id);
ALTER TABLE "Item" ADD CONSTRAINT item_owner_fk FOREIGN KEY (owner_id) REFERENCES "User"(user_id);
ALTER TABLE "Item" ADD CONSTRAINT item_kind CHECK (kind IN ('deal','manager_review'));
CREATE UNIQUE INDEX one_open_item ON "Item"(org_id) WHERE status = 'open';
ALTER TABLE "CriteriaSet" ADD CONSTRAINT criteria_firm_fk FOREIGN KEY (firm_id) REFERENCES "Firm"(firm_id);
ALTER TABLE "CriteriaSet" ADD CONSTRAINT criteria_signer_fk FOREIGN KEY (signed_by) REFERENCES "User"(user_id);
ALTER TABLE "CriteriaSet" ADD CONSTRAINT criteria_target CHECK (target IN ('company','manager'));
ALTER TABLE "Criterion" ADD CONSTRAINT criterion_weight CHECK (weight >= 0 AND weight <= 100);
ALTER TABLE "Score" ADD CONSTRAINT score_item_fk FOREIGN KEY (item_id) REFERENCES "Item"(item_id);
ALTER TABLE "Score" ADD CONSTRAINT score_criteria_fk FOREIGN KEY (criteria_id) REFERENCES "CriteriaSet"(criteria_id);
ALTER TABLE "Score" ADD CONSTRAINT score_run_fk FOREIGN KEY (run_id) REFERENCES "Run"(run_id);
ALTER TABLE "ScoreReason" ADD CONSTRAINT reason_score_fk FOREIGN KEY (score_id) REFERENCES "Score"(score_id);
ALTER TABLE "ScoreReason" ADD CONSTRAINT reason_criterion_fk FOREIGN KEY (criterion_id) REFERENCES "Criterion"(criterion_id);
ALTER TABLE "ScoreReason" ADD CONSTRAINT reason_obs_fk FOREIGN KEY (evidence_obs_id) REFERENCES "Observation"(obs_id);
ALTER TABLE "ScoreReason" ADD CONSTRAINT unknown_note CHECK (met <> 'unknown' OR length(trim(note)) > 0);
ALTER TABLE "Decision" ADD CONSTRAINT decision_item_fk FOREIGN KEY (item_id) REFERENCES "Item"(item_id);
ALTER TABLE "Decision" ADD CONSTRAINT decision_user_fk FOREIGN KEY (user_id) REFERENCES "User"(user_id);
ALTER TABLE "Decision" ADD CONSTRAINT decision_score_fk FOREIGN KEY (score_id) REFERENCES "Score"(score_id);
ALTER TABLE "RevisitTrigger" ADD CONSTRAINT revisit_item_fk FOREIGN KEY (item_id) REFERENCES "Item"(item_id);
ALTER TABLE "Holding" ADD CONSTRAINT holding_org_fk FOREIGN KEY (org_id) REFERENCES "Organisation"(org_id);
ALTER TABLE "Holding" ADD CONSTRAINT holding_firm_fk FOREIGN KEY (firm_id) REFERENCES "Firm"(firm_id);
ALTER TABLE "Holding" ADD CONSTRAINT holding_level CHECK (level IN ('fund','company'));
ALTER TABLE "MetricObservation" ADD CONSTRAINT metric_holding_fk FOREIGN KEY (holding_id) REFERENCES "Holding"(holding_id);
ALTER TABLE "MetricObservation" ADD CONSTRAINT metric_obs_fk FOREIGN KEY (obs_id) REFERENCES "Observation"(obs_id);
ALTER TABLE "MetricObservation" ADD CONSTRAINT metric_run_fk FOREIGN KEY (run_id) REFERENCES "Run"(run_id);
ALTER TABLE "MetricObservation" ADD CONSTRAINT metric_validator_fk FOREIGN KEY (validated_by) REFERENCES "User"(user_id);
ALTER TABLE "MetricObservation" ADD CONSTRAINT indicative_validation CHECK (NOT indicative OR source_type <> 'validated' OR validated_by IS NOT NULL);
ALTER TABLE "Flag" ADD CONSTRAINT flag_metric_fk FOREIGN KEY (metric_obs_id) REFERENCES "MetricObservation"(metric_obs_id);
ALTER TABLE "Flag" ADD CONSTRAINT flag_person CHECK (resolved_at IS NULL OR resolved_by IS NOT NULL);
ALTER TABLE "Claim" ADD CONSTRAINT claim_item_fk FOREIGN KEY (item_id) REFERENCES "Item"(item_id);
ALTER TABLE "Claim" ADD CONSTRAINT claim_doc_fk FOREIGN KEY (doc_id) REFERENCES "Document"(doc_id);
ALTER TABLE "Claim" ADD CONSTRAINT claim_obs_fk FOREIGN KEY (evidence_obs_id) REFERENCES "Observation"(obs_id);
ALTER TABLE "Claim" ADD CONSTRAINT claim_status CHECK (status IN ('supported','contradicted','not_found'));
ALTER TABLE "Claim" ADD CONSTRAINT claim_evidence CHECK (status = 'not_found' OR evidence_obs_id IS NOT NULL);
ALTER TABLE "Task" ADD CONSTRAINT task_firm_fk FOREIGN KEY (firm_id) REFERENCES "Firm"(firm_id);
ALTER TABLE "Task" ADD CONSTRAINT task_kind CHECK (kind IN ('follow_up','reminder_draft','review','consent'));
ALTER TABLE "Brief" ADD CONSTRAINT brief_doc_fk FOREIGN KEY (doc_id) REFERENCES "Document"(doc_id);
ALTER TABLE "Brief" ADD CONSTRAINT brief_run_fk FOREIGN KEY (generated_by_run) REFERENCES "Run"(run_id);
ALTER TABLE "Brief" ADD CONSTRAINT brief_kind CHECK (kind IN ('daily','monday_pack','readout'));
ALTER TABLE "Run" ADD CONSTRAINT run_firm_fk FOREIGN KEY (firm_id) REFERENCES "Firm"(firm_id);
ALTER TABLE "Run" ADD CONSTRAINT run_reviewer_fk FOREIGN KEY (reviewer_id) REFERENCES "User"(user_id);
ALTER TABLE "Run" ADD CONSTRAINT run_cost CHECK (cost >= 0);
ALTER TABLE "AutonomyPolicy" ADD CONSTRAINT autonomy_range CHECK (level BETWEEN 0 AND 3);
ALTER TABLE "AutonomyPolicy" ADD CONSTRAINT autonomy_firm_fk FOREIGN KEY (firm_id) REFERENCES "Firm"(firm_id);
ALTER TABLE "AutonomyPolicy" ADD CONSTRAINT autonomy_setter_fk FOREIGN KEY (set_by) REFERENCES "User"(user_id);
ALTER TABLE "AutonomyPolicy" ADD CONSTRAINT autonomy_change_fk FOREIGN KEY (change_request_id) REFERENCES "ChangeRequest"(cr_id);
ALTER TABLE "ChangeRequest" ADD CONSTRAINT change_firm_fk FOREIGN KEY (firm_id) REFERENCES "Firm"(firm_id);
ALTER TABLE "ChangeRequest" ADD CONSTRAINT change_signer_fk FOREIGN KEY (signed_by) REFERENCES "User"(user_id);
ALTER TABLE "ChangeRequest" ADD CONSTRAINT applied_signature CHECK (applied_at IS NULL OR signed_by IS NOT NULL);
ALTER TABLE "GoldSetItem" ADD CONSTRAINT gold_firm_fk FOREIGN KEY (firm_id) REFERENCES "Firm"(firm_id);
ALTER TABLE "Evaluation" ADD CONSTRAINT eval_firm_fk FOREIGN KEY (firm_id) REFERENCES "Firm"(firm_id);
ALTER TABLE "Evaluation" ADD CONSTRAINT eval_run_fk FOREIGN KEY (run_id) REFERENCES "Run"(run_id);
ALTER TABLE "Evaluation" ADD CONSTRAINT eval_suite CHECK (suite IN ('gold','planted_error','injection','perception'));
ALTER TABLE "AccessLog" ADD CONSTRAINT access_actor CHECK ((user_id IS NULL) <> (service_identity IS NULL));

CREATE FUNCTION reject_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'IMMUTABLE_RECORD: %', TG_TABLE_NAME; END $$;
DO $$ DECLARE table_name text; BEGIN
  FOREACH table_name IN ARRAY ARRAY['Run','Observation','AccessLog','Document','Decision','Evaluation','Brief','Step'] LOOP
    EXECUTE format('CREATE TRIGGER immutable_record BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION reject_mutation()', table_name);
  END LOOP;
END $$;

CREATE FUNCTION enforce_tenant_integrity() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target_firm text; user_firm text; user_role text; prior_state text;
BEGIN
  IF TG_TABLE_NAME = 'Episode' THEN
    IF NEW.acting_user_id IS NOT NULL THEN
      SELECT firm_id INTO user_firm FROM "User" WHERE user_id = NEW.acting_user_id;
      IF user_firm IS DISTINCT FROM NEW.firm_id THEN RAISE EXCEPTION 'ACTOR_TENANT_MISMATCH'; END IF;
    ELSIF NEW.service_identity <> 'scheduler:' || NEW.firm_id THEN RAISE EXCEPTION 'SERVICE_IDENTITY_MISMATCH'; END IF;
  ELSIF TG_TABLE_NAME = 'Proposal' THEN
    SELECT firm_id INTO target_firm FROM "Episode" WHERE episode_id = NEW.episode_id;
    IF target_firm IS DISTINCT FROM NEW.firm_id THEN RAISE EXCEPTION 'EPISODE_TENANT_MISMATCH'; END IF;
    IF NEW.reviewer_id IS NOT NULL THEN
      SELECT firm_id, role::text INTO user_firm, user_role FROM "User" WHERE user_id = NEW.reviewer_id;
      IF user_firm IS DISTINCT FROM NEW.firm_id OR user_role = 'auditor' THEN RAISE EXCEPTION 'REVIEWER_FORBIDDEN'; END IF;
    END IF;
    IF TG_OP = 'UPDATE' THEN
      IF OLD.state NOT IN ('proposed','edited') THEN RAISE EXCEPTION 'TERMINAL_REVIEW_STATE'; END IF;
      IF NEW.version <> OLD.version + 1 THEN RAISE EXCEPTION 'VERSION_CONFLICT'; END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'Consent' THEN
    IF NOT EXISTS (SELECT 1 FROM "ConversationParticipant" WHERE conv_id=NEW.conv_id AND person_id=NEW.person_id) THEN RAISE EXCEPTION 'PARTICIPANT_REQUIRED'; END IF;
  ELSIF TG_TABLE_NAME = 'Step' AND NEW.kind = 'present' THEN
    IF NOT EXISTS (SELECT 1 FROM "Episode" WHERE episode_id=NEW.episode_id AND critic_verdict='passed') THEN RAISE EXCEPTION 'CRITIC_VERDICT_REQUIRED'; END IF;
  ELSIF TG_TABLE_NAME = 'AutonomyPolicy' THEN
    IF TG_OP = 'INSERT' THEN prior_state := '0'; ELSE prior_state := OLD.level::text; END IF;
    IF NEW.level > prior_state::int AND NOT EXISTS (
      SELECT 1 FROM "ChangeRequest" c JOIN "User" u ON u.user_id=c.signed_by
      WHERE c.cr_id=NEW.change_request_id AND c.firm_id=NEW.firm_id AND u.firm_id=NEW.firm_id
      AND u.role='partner' AND c.what='autonomy:' || NEW.skill || ':' || NEW.level::text
    ) THEN RAISE EXCEPTION 'SIGNED_CHANGE_REQUEST_REQUIRED'; END IF;
    IF TG_OP = 'UPDATE' AND NEW.level < OLD.level AND coalesce(trim(NEW.reason),'')='' THEN RAISE EXCEPTION 'DEMOTION_REASON_REQUIRED'; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER episode_tenant BEFORE INSERT OR UPDATE ON "Episode" FOR EACH ROW EXECUTE FUNCTION enforce_tenant_integrity();
CREATE TRIGGER proposal_tenant BEFORE INSERT OR UPDATE ON "Proposal" FOR EACH ROW EXECUTE FUNCTION enforce_tenant_integrity();
CREATE TRIGGER consent_participant BEFORE INSERT ON "Consent" FOR EACH ROW EXECUTE FUNCTION enforce_tenant_integrity();
CREATE TRIGGER presented_verdict BEFORE INSERT ON "Step" FOR EACH ROW EXECUTE FUNCTION enforce_tenant_integrity();
CREATE TRIGGER autonomy_signature BEFORE INSERT OR UPDATE ON "AutonomyPolicy" FOR EACH ROW EXECUTE FUNCTION enforce_tenant_integrity();

CREATE FUNCTION weights_total() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE total numeric; cid text;
BEGIN
  cid := NEW.criteria_id;
  SELECT sum(weight) INTO total FROM "Criterion" WHERE criteria_id=cid;
  IF total IS DISTINCT FROM 100 THEN RAISE EXCEPTION 'CRITERIA_WEIGHTS_MUST_SUM_TO_100'; END IF;
  RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER criteria_weights AFTER INSERT OR UPDATE ON "Criterion" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION weights_total();
CREATE FUNCTION scored_criteria_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Score" WHERE criteria_id=OLD.criteria_id) THEN RAISE EXCEPTION 'SCORED_CRITERIA_IMMUTABLE'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER scored_criteria BEFORE UPDATE OR DELETE ON "CriteriaSet" FOR EACH ROW EXECUTE FUNCTION scored_criteria_immutable();
CREATE TRIGGER scored_criterion BEFORE UPDATE OR DELETE ON "Criterion" FOR EACH ROW EXECUTE FUNCTION scored_criteria_immutable();
CREATE FUNCTION revisit_keep_warm() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Decision" WHERE item_id=NEW.item_id AND outcome='keep_warm') THEN RAISE EXCEPTION 'KEEP_WARM_REQUIRED'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER revisit_rule BEFORE INSERT ON "RevisitTrigger" FOR EACH ROW EXECUTE FUNCTION revisit_keep_warm();
