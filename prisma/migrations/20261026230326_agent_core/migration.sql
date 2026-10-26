-- CreateEnum
CREATE TYPE "Profile" AS ENUM ('vc', 'fof');

-- CreateEnum
CREATE TYPE "Mode" AS ENUM ('demo', 'tenant');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('partner', 'analyst', 'ops', 'ir', 'compliance', 'builder', 'auditor');

-- CreateEnum
CREATE TYPE "EpisodeStatus" AS ENUM ('planned', 'awaiting_approval', 'running', 'stopped', 'done', 'failed');

-- CreateEnum
CREATE TYPE "StepKind" AS ENUM ('perceive', 'resolve', 'plan', 'tool', 'critic', 'present', 'learn');

-- CreateEnum
CREATE TYPE "ProposalState" AS ENUM ('proposed', 'accepted', 'edited', 'rejected', 'confirmed', 'applied', 'failed');

-- CreateEnum
CREATE TYPE "ProposalType" AS ENUM ('entity', 'fact', 'score', 'flag', 'draft', 'crm_update', 'task', 'document_request');

-- CreateEnum
CREATE TYPE "Modality" AS ENUM ('text', 'table', 'chart', 'audio', 'video', 'web');

-- CreateTable
CREATE TABLE "Firm" (
    "firm_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profile" "Profile" NOT NULL,
    "mode" "Mode" NOT NULL DEFAULT 'demo',
    "language" TEXT NOT NULL DEFAULT 'en',
    "settings" JSONB NOT NULL,

    CONSTRAINT "Firm_pkey" PRIMARY KEY ("firm_id")
);

-- CreateTable
CREATE TABLE "User" (
    "user_id" TEXT NOT NULL,
    "firm_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "sso_subject" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Organisation" (
    "org_id" TEXT NOT NULL,
    "firm_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "country" TEXT,
    "website" TEXT,
    "registry_id" TEXT,
    "sector_tags" TEXT[],
    "state" TEXT NOT NULL DEFAULT 'proposed',

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("org_id")
);

-- CreateTable
CREATE TABLE "Person" (
    "person_id" TEXT NOT NULL,
    "firm_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "org_id" TEXT,
    "role_label" TEXT,
    "state" TEXT NOT NULL DEFAULT 'proposed',

    CONSTRAINT "Person_pkey" PRIMARY KEY ("person_id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "conv_id" TEXT NOT NULL,
    "firm_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "raw_ref" TEXT NOT NULL,
    "raw_hash" TEXT NOT NULL,
    "source_uri" TEXT,
    "language" TEXT NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("conv_id")
);

-- CreateTable
CREATE TABLE "ConversationParticipant" (
    "conv_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("conv_id","person_id")
);

-- CreateTable
CREATE TABLE "Consent" (
    "consent_id" TEXT NOT NULL,
    "conv_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "recorded_by" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "method" TEXT NOT NULL,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("consent_id")
);

-- CreateTable
CREATE TABLE "Observation" (
    "obs_id" TEXT NOT NULL,
    "doc_id" TEXT,
    "conv_id" TEXT,
    "modality" "Modality" NOT NULL,
    "locator_json" JSONB NOT NULL,
    "text" TEXT NOT NULL,
    "value_json" JSONB,
    "confidence" DOUBLE PRECISION NOT NULL,
    "extractor_version" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,

    CONSTRAINT "Observation_pkey" PRIMARY KEY ("obs_id")
);

-- CreateTable
CREATE TABLE "Document" (
    "doc_id" TEXT NOT NULL,
    "firm_id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "hash" TEXT NOT NULL,
    "storage_ref" TEXT NOT NULL,
    "retention_class" TEXT NOT NULL,
    "legal_hold" BOOLEAN NOT NULL DEFAULT false,
    "provenance" JSONB NOT NULL,
    "language" TEXT NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("doc_id")
);

-- CreateTable
CREATE TABLE "Episode" (
    "episode_id" TEXT NOT NULL,
    "firm_id" TEXT NOT NULL,
    "acting_user_id" TEXT,
    "service_identity" TEXT,
    "surface" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "plan_json" JSONB NOT NULL,
    "status" "EpisodeStatus" NOT NULL DEFAULT 'planned',
    "cost" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "critic_verdict" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("episode_id")
);

-- CreateTable
CREATE TABLE "Step" (
    "step_id" TEXT NOT NULL,
    "episode_id" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "kind" "StepKind" NOT NULL,
    "tool_name" TEXT,
    "tool_version" TEXT,
    "input_ref" TEXT,
    "output_ref" TEXT,
    "run_id" TEXT,

    CONSTRAINT "Step_pkey" PRIMARY KEY ("step_id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "proposal_id" TEXT NOT NULL,
    "firm_id" TEXT NOT NULL,
    "episode_id" TEXT NOT NULL,
    "type" "ProposalType" NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "state" "ProposalState" NOT NULL DEFAULT 'proposed',
    "reviewer_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "edit_diff" JSONB,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("proposal_id")
);

-- CreateTable
CREATE TABLE "OrganisationFact" (
    "fact_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "obs_id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3),
    "run_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,

    CONSTRAINT "OrganisationFact_pkey" PRIMARY KEY ("fact_id")
);

-- CreateTable
CREATE TABLE "PersonFact" (
    "pfact_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "obs_id" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "run_id" TEXT NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_to" TIMESTAMP(3),
    "reviewer_id" TEXT NOT NULL,

    CONSTRAINT "PersonFact_pkey" PRIMARY KEY ("pfact_id")
);

-- CreateTable
CREATE TABLE "Item" (
    "item_id" TEXT NOT NULL,
    "firm_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "source_channel" TEXT NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL,
    "stage" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "CriteriaSet" (
    "criteria_id" TEXT NOT NULL,
    "firm_id" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "basis_ref" TEXT NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "signed_by" TEXT NOT NULL,

    CONSTRAINT "CriteriaSet_pkey" PRIMARY KEY ("criteria_id")
);

-- CreateTable
CREATE TABLE "Criterion" (
    "criterion_id" TEXT NOT NULL,
    "criteria_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "evidence_definition" TEXT NOT NULL,
    "weight" DECIMAL(6,2) NOT NULL,

    CONSTRAINT "Criterion_pkey" PRIMARY KEY ("criterion_id")
);

-- CreateTable
CREATE TABLE "Score" (
    "score_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "criteria_id" TEXT NOT NULL,
    "value" DECIMAL(8,3) NOT NULL,
    "run_id" TEXT NOT NULL,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("score_id")
);

-- CreateTable
CREATE TABLE "ScoreReason" (
    "score_id" TEXT NOT NULL,
    "criterion_id" TEXT NOT NULL,
    "met" TEXT NOT NULL,
    "evidence_obs_id" TEXT,
    "note" TEXT NOT NULL,

    CONSTRAINT "ScoreReason_pkey" PRIMARY KEY ("score_id","criterion_id")
);

-- CreateTable
CREATE TABLE "Decision" (
    "decision_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "reason_audio_ref" TEXT,
    "decided_at" TIMESTAMP(3) NOT NULL,
    "score_id" TEXT,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("decision_id")
);

-- CreateTable
CREATE TABLE "RevisitTrigger" (
    "trigger_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "condition_text" TEXT NOT NULL,
    "signal_source" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "RevisitTrigger_pkey" PRIMARY KEY ("trigger_id")
);

-- CreateTable
CREATE TABLE "Holding" (
    "holding_id" TEXT NOT NULL,
    "firm_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "invested_at" TIMESTAMP(3) NOT NULL,
    "instrument" TEXT NOT NULL,
    "schema_version" TEXT NOT NULL,

    CONSTRAINT "Holding_pkey" PRIMARY KEY ("holding_id")
);

-- CreateTable
CREATE TABLE "MetricObservation" (
    "metric_obs_id" TEXT NOT NULL,
    "holding_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "metric_code" TEXT NOT NULL,
    "value" DECIMAL(24,8) NOT NULL,
    "currency" TEXT,
    "source_type" TEXT NOT NULL,
    "obs_id" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "indicative" BOOLEAN NOT NULL,
    "formula_version" TEXT,
    "run_id" TEXT NOT NULL,
    "validated_by" TEXT,

    CONSTRAINT "MetricObservation_pkey" PRIMARY KEY ("metric_obs_id")
);

-- CreateTable
CREATE TABLE "Flag" (
    "flag_id" TEXT NOT NULL,
    "metric_obs_id" TEXT NOT NULL,
    "rule_version" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "playbook_ref" TEXT NOT NULL,
    "raised_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "note" TEXT,

    CONSTRAINT "Flag_pkey" PRIMARY KEY ("flag_id")
);

-- CreateTable
CREATE TABLE "Claim" (
    "claim_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "doc_id" TEXT NOT NULL,
    "page" INTEGER,
    "statement" TEXT NOT NULL,
    "figure" TEXT,
    "status" TEXT NOT NULL,
    "evidence_obs_id" TEXT,
    "run_id" TEXT NOT NULL,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("claim_id")
);

-- CreateTable
CREATE TABLE "Task" (
    "task_id" TEXT NOT NULL,
    "firm_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "ref_type" TEXT NOT NULL,
    "ref_id" TEXT NOT NULL,
    "due_at" TIMESTAMP(3),
    "state" TEXT NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("task_id")
);

-- CreateTable
CREATE TABLE "Brief" (
    "brief_id" TEXT NOT NULL,
    "firm_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "doc_id" TEXT NOT NULL,
    "audio_ref" TEXT,
    "generated_by_run" TEXT NOT NULL,

    CONSTRAINT "Brief_pkey" PRIMARY KEY ("brief_id")
);

-- CreateTable
CREATE TABLE "ChartSpec" (
    "chart_id" TEXT NOT NULL,
    "firm_id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "spec_json" JSONB NOT NULL,
    "data_query" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChartSpec_pkey" PRIMARY KEY ("chart_id")
);

-- CreateTable
CREATE TABLE "Run" (
    "run_id" TEXT NOT NULL,
    "firm_id" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "tool_name" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inputs_hash" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model_version" TEXT NOT NULL,
    "prompt_version" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "seed" INTEGER NOT NULL,
    "output_ref" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "cost" DECIMAL(18,8) NOT NULL,
    "latency_ms" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "invariant_results" JSONB NOT NULL,
    "reviewer_id" TEXT,
    "prev_hash" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,

    CONSTRAINT "Run_pkey" PRIMARY KEY ("run_id")
);

-- CreateTable
CREATE TABLE "Invariant" (
    "invariant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "check_definition" TEXT NOT NULL,
    "since_version" TEXT NOT NULL,

    CONSTRAINT "Invariant_pkey" PRIMARY KEY ("invariant_id")
);

-- CreateTable
CREATE TABLE "AutonomyPolicy" (
    "firm_id" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "since" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "change_request_id" TEXT,
    "set_by" TEXT NOT NULL,
    "reason" TEXT,

    CONSTRAINT "AutonomyPolicy_pkey" PRIMARY KEY ("firm_id","skill")
);

-- CreateTable
CREATE TABLE "ChangeRequest" (
    "cr_id" TEXT NOT NULL,
    "firm_id" TEXT NOT NULL,
    "what" TEXT NOT NULL,
    "why" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "ab_evaluation_id" TEXT,
    "signed_by" TEXT,
    "applied_at" TIMESTAMP(3),

    CONSTRAINT "ChangeRequest_pkey" PRIMARY KEY ("cr_id")
);

-- CreateTable
CREATE TABLE "GoldSetItem" (
    "gs_id" TEXT NOT NULL,
    "firm_id" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "modality" TEXT NOT NULL,
    "payload_ref" TEXT NOT NULL,
    "label_json" JSONB NOT NULL,
    "source" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL,
    "month_version" TEXT NOT NULL,

    CONSTRAINT "GoldSetItem_pkey" PRIMARY KEY ("gs_id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "eval_id" TEXT NOT NULL,
    "firm_id" TEXT NOT NULL,
    "skill" TEXT,
    "sense" TEXT,
    "version_a" TEXT NOT NULL,
    "version_b" TEXT,
    "metrics_json" JSONB NOT NULL,
    "suite" TEXT NOT NULL,
    "computed_at" TIMESTAMP(3) NOT NULL,
    "run_id" TEXT NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("eval_id")
);

-- CreateTable
CREATE TABLE "AccessLog" (
    "log_id" TEXT NOT NULL,
    "user_id" TEXT,
    "service_identity" TEXT,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessLog_pkey" PRIMARY KEY ("log_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_firm_id_email_key" ON "User"("firm_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "User_firm_id_user_id_key" ON "User"("firm_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Organisation_firm_id_registry_id_key" ON "Organisation"("firm_id", "registry_id");

-- CreateIndex
CREATE UNIQUE INDEX "Organisation_firm_id_org_id_key" ON "Organisation"("firm_id", "org_id");

-- CreateIndex
CREATE UNIQUE INDEX "Person_firm_id_email_key" ON "Person"("firm_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_raw_hash_key" ON "Conversation"("raw_hash");

-- CreateIndex
CREATE UNIQUE INDEX "Consent_conv_id_person_id_type_key" ON "Consent"("conv_id", "person_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Document_firm_id_hash_version_key" ON "Document"("firm_id", "hash", "version");

-- CreateIndex
CREATE INDEX "Episode_firm_id_started_at_idx" ON "Episode"("firm_id", "started_at");

-- CreateIndex
CREATE UNIQUE INDEX "Step_episode_id_seq_key" ON "Step"("episode_id", "seq");

-- CreateIndex
CREATE INDEX "Proposal_firm_id_state_idx" ON "Proposal"("firm_id", "state");

-- CreateIndex
CREATE UNIQUE INDEX "CriteriaSet_firm_id_target_version_key" ON "CriteriaSet"("firm_id", "target", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Score_item_id_criteria_id_key" ON "Score"("item_id", "criteria_id");

-- CreateIndex
CREATE UNIQUE INDEX "MetricObservation_holding_id_period_metric_code_source_type_key" ON "MetricObservation"("holding_id", "period", "metric_code", "source_type");

-- CreateIndex
CREATE UNIQUE INDEX "Run_hash_key" ON "Run"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Run_seq_key" ON "Run"("seq");

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conv_id_fkey" FOREIGN KEY ("conv_id") REFERENCES "Conversation"("conv_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step" ADD CONSTRAINT "Step_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "Episode"("episode_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "Episode"("episode_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Criterion" ADD CONSTRAINT "Criterion_criteria_id_fkey" FOREIGN KEY ("criteria_id") REFERENCES "CriteriaSet"("criteria_id") ON DELETE RESTRICT ON UPDATE CASCADE;
