-- A budget stop is a system state, not a fabricated human review.
ALTER TABLE "Proposal" DROP CONSTRAINT review_requires_human;
ALTER TABLE "Proposal" ADD CONSTRAINT review_requires_human CHECK (
  state='proposed'
  OR (state='stopped' AND type='draft' AND coalesce(payload_json->>'status','')='stopped')
  OR (reviewer_id IS NOT NULL AND reviewed_at IS NOT NULL)
);
CREATE FUNCTION valid_critic(v jsonb) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce(
    jsonb_typeof(v)='object' AND v->>'overall' IN ('pass','pass_with_notes','block')
    AND jsonb_typeof(v->'checks')='object'
    AND (v->'checks') ?& ARRAY['citations_resolve','citation_supports_text','forbidden_content','injected_instruction','confidence_language']
    AND NOT EXISTS (
      SELECT 1 FROM unnest(ARRAY['citations_resolve','citation_supports_text','forbidden_content','injected_instruction','confidence_language']) k
      WHERE coalesce(v->'checks'->k->>'status','') NOT IN ('pass','fail')
        OR jsonb_typeof(v->'checks'->k->'note') IS DISTINCT FROM 'string'
        OR coalesce(v->'checks'->k->>'note','')=''
        OR (v->>'overall'<>'block' AND v->'checks'->k->>'status'='fail')
    ), false
  )
$$;
ALTER TABLE "Episode" ADD CONSTRAINT structured_critic CHECK (critic_verdict IS NULL OR valid_critic(critic_verdict));
