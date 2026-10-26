-- SQL CHECK permits NULL unless explicitly refused.
-- Preserve the malformed synthetic row created by the failing integrity test,
-- but never leave it visible as successfully completed.
UPDATE "Episode" SET status='failed', critic_verdict='blocked',
  plan_json='{"failure":"Integrity test: completion lacked a critic verdict"}'
WHERE status='done' AND critic_verdict IS DISTINCT FROM 'passed';
ALTER TABLE "Episode" DROP CONSTRAINT presented_critic;
ALTER TABLE "Episode" ADD CONSTRAINT presented_critic CHECK (
  status <> 'done' OR (critic_verdict IS NOT NULL AND critic_verdict = 'passed')
);
