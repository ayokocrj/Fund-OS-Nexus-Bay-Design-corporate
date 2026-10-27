ALTER TYPE "ProposalState" ADD VALUE 'stopped';
ALTER TABLE "Episode" DROP CONSTRAINT presented_critic;
-- Preserve historical verdicts and mark their missing per-check detail honestly.
CREATE FUNCTION legacy_critic(value text) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN value IS NULL THEN NULL ELSE jsonb_build_object(
    'overall', CASE WHEN value='passed' THEN 'pass_with_notes' ELSE 'block' END,
    'checks', (SELECT jsonb_object_agg(k, jsonb_build_object(
      'status', CASE WHEN value='passed' THEN 'pass' ELSE 'fail' END,
      'note', 'Historical aggregate verdict: ' || value || '. Per-check detail was not recorded.'))
      FROM unnest(ARRAY['citations_resolve','citation_supports_text','forbidden_content','injected_instruction','confidence_language']) k)
  ) END
$$;
ALTER TABLE "Episode" ALTER COLUMN critic_verdict TYPE jsonb USING legacy_critic(critic_verdict);
ALTER TABLE "Episode" ADD COLUMN context_json jsonb, ADD COLUMN intent text NOT NULL DEFAULT 'ask';
ALTER TABLE "Episode" ADD CONSTRAINT presented_critic CHECK (
  status<>'done' OR (critic_verdict IS NOT NULL AND coalesce(critic_verdict->>'overall','') IN ('pass','pass_with_notes'))
);
ALTER TABLE "Episode" ADD CONSTRAINT episode_intent CHECK (intent IN ('ask','draft'));
ALTER TABLE "Proposal" ADD COLUMN identity_key text;
CREATE UNIQUE INDEX proposal_semantic_active ON "Proposal"(firm_id,identity_key)
  WHERE identity_key IS NOT NULL AND state IN ('proposed','accepted','edited','confirmed');
ALTER TABLE "Run" ADD COLUMN episode_id text REFERENCES "Episode"(episode_id),
  ADD COLUMN input_ref jsonb, ADD COLUMN hash_version integer NOT NULL DEFAULT 1;
CREATE TABLE "EpisodeProposal" (
  episode_id text NOT NULL REFERENCES "Episode"(episode_id),
  proposal_id text NOT NULL REFERENCES "Proposal"(proposal_id),
  linked_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(episode_id,proposal_id)
);
INSERT INTO "EpisodeProposal"(episode_id,proposal_id) SELECT episode_id,proposal_id FROM "Proposal";
CREATE TABLE "LedgerCheckpoint" (
  key text PRIMARY KEY, last_seq integer NOT NULL, last_hash text NOT NULL,
  verified_at timestamp(3) NOT NULL, valid boolean NOT NULL
);
CREATE OR REPLACE FUNCTION enforce_tenant_integrity() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target_firm text; user_firm text; user_role text; prior_state text; allowed jsonb;
BEGIN
  IF TG_TABLE_NAME='Episode' THEN
    IF NEW.acting_user_id IS NOT NULL THEN
      SELECT firm_id INTO user_firm FROM "User" WHERE user_id=NEW.acting_user_id;
      IF user_firm IS DISTINCT FROM NEW.firm_id THEN RAISE EXCEPTION 'ACTOR_TENANT_MISMATCH'; END IF;
    ELSIF NEW.service_identity<>'scheduler:' || NEW.firm_id THEN RAISE EXCEPTION 'SERVICE_IDENTITY_MISMATCH'; END IF;
  ELSIF TG_TABLE_NAME='Proposal' THEN
    SELECT firm_id INTO target_firm FROM "Episode" WHERE episode_id=NEW.episode_id;
    IF target_firm IS DISTINCT FROM NEW.firm_id THEN RAISE EXCEPTION 'EPISODE_TENANT_MISMATCH'; END IF;
    IF NEW.reviewer_id IS NOT NULL THEN
      SELECT firm_id,role::text INTO user_firm,user_role FROM "User" WHERE user_id=NEW.reviewer_id;
      IF user_firm IS DISTINCT FROM NEW.firm_id OR user_role IN ('auditor','builder') THEN RAISE EXCEPTION 'REVIEWER_FORBIDDEN'; END IF;
      IF NEW.state='accepted' AND NEW.type='fact' AND user_role NOT IN ('partner','analyst') THEN RAISE EXCEPTION 'FACT_ROLE_FORBIDDEN'; END IF;
      IF NEW.state='confirmed' THEN
        SELECT coalesce(settings#>'{permissions,outboxConfirmRoles}','["partner","analyst","ops"]'::jsonb) INTO allowed FROM "Firm" WHERE firm_id=NEW.firm_id;
        IF user_role NOT IN ('partner','analyst','ops') OR NOT (allowed ? user_role) THEN RAISE EXCEPTION 'OUTBOX_ROLE_FORBIDDEN'; END IF;
      END IF;
    END IF;
    IF TG_OP='UPDATE' THEN
      IF OLD.state<>'proposed' THEN RAISE EXCEPTION 'TERMINAL_REVIEW_STATE'; END IF;
      IF NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'VERSION_CONFLICT'; END IF;
    END IF;
  ELSIF TG_TABLE_NAME='Consent' THEN
    IF NOT EXISTS(SELECT 1 FROM "ConversationParticipant" WHERE conv_id=NEW.conv_id AND person_id=NEW.person_id) THEN RAISE EXCEPTION 'PARTICIPANT_REQUIRED'; END IF;
  ELSIF TG_TABLE_NAME='Step' THEN
    IF NEW.kind='present' AND NOT EXISTS(SELECT 1 FROM "Episode" WHERE episode_id=NEW.episode_id AND critic_verdict->>'overall' IN ('pass','pass_with_notes')) THEN RAISE EXCEPTION 'CRITIC_VERDICT_REQUIRED'; END IF;
  ELSIF TG_TABLE_NAME='AutonomyPolicy' THEN
    IF TG_OP='INSERT' THEN prior_state:='0'; ELSE prior_state:=OLD.level::text; END IF;
    IF NEW.level>prior_state::int AND NOT EXISTS(
      SELECT 1 FROM "ChangeRequest" c JOIN "User" u ON u.user_id=c.signed_by
      WHERE c.cr_id=NEW.change_request_id AND c.firm_id=NEW.firm_id AND u.firm_id=NEW.firm_id
      AND u.role='partner' AND c.what='autonomy:' || NEW.skill || ':' || NEW.level::text
    ) THEN RAISE EXCEPTION 'SIGNED_CHANGE_REQUEST_REQUIRED'; END IF;
    IF TG_OP='UPDATE' AND NEW.level<OLD.level AND coalesce(trim(NEW.reason),'')='' THEN RAISE EXCEPTION 'DEMOTION_REASON_REQUIRED'; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE FUNCTION episode_proposal_scope() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM "Episode" e JOIN "Proposal" p ON e.firm_id=p.firm_id
    WHERE e.episode_id=NEW.episode_id AND p.proposal_id=NEW.proposal_id) THEN RAISE EXCEPTION 'PROPOSAL_LINK_SCOPE'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER linked_proposal_scope BEFORE INSERT ON "EpisodeProposal" FOR EACH ROW EXECUTE FUNCTION episode_proposal_scope();
