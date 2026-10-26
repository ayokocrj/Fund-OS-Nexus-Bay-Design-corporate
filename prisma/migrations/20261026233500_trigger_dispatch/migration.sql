-- Resolve trigger-table dispatch before accessing table-specific NEW fields.
CREATE OR REPLACE FUNCTION enforce_tenant_integrity() RETURNS trigger LANGUAGE plpgsql AS $$
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
  ELSIF TG_TABLE_NAME = 'Step' THEN
    IF NEW.kind = 'present' AND NOT EXISTS (SELECT 1 FROM "Episode" WHERE episode_id=NEW.episode_id AND critic_verdict='passed') THEN RAISE EXCEPTION 'CRITIC_VERDICT_REQUIRED'; END IF;
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
