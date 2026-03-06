-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT,
    "githubUrl" TEXT,
    "logo" TEXT,
    "tags" TEXT,
    "yearCreated" INTEGER,
    "selfHostable" BOOLEAN NOT NULL DEFAULT false,
    "license" TEXT,
    "techStack" TEXT,
    "alternativeTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIRating" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "insightCompression" DOUBLE PRECISION NOT NULL,
    "substrateEfficiency" DOUBLE PRECISION NOT NULL,
    "broadUtility" DOUBLE PRECISION NOT NULL,
    "awareness" DOUBLE PRECISION NOT NULL,
    "agentFriction" DOUBLE PRECISION NOT NULL,
    "humanCoefficient" DOUBLE PRECISION NOT NULL,
    "acesScore" DOUBLE PRECISION,
    "insightEvidence" TEXT,
    "substrateEvidence" TEXT,
    "utilityEvidence" TEXT,
    "awarenessEvidence" TEXT,
    "agentEvidence" TEXT,
    "humanEvidence" TEXT,
    "acesEvidence" TEXT,
    "survivalScore" DOUBLE PRECISION NOT NULL,
    "tier" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reasoning" JSONB NOT NULL,
    "suggestions" JSONB,
    "model" TEXT NOT NULL,
    "dataSources" TEXT[],
    "humanReviewed" BOOLEAN NOT NULL DEFAULT false,
    "githubStars" INTEGER,
    "githubForks" INTEGER,
    "githubIssues" INTEGER,
    "npmDownloads" INTEGER,
    "documentationQuality" DOUBLE PRECISION,
    "lastAnalyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRating" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "insightCompression" DOUBLE PRECISION NOT NULL,
    "substrateEfficiency" DOUBLE PRECISION NOT NULL,
    "broadUtility" DOUBLE PRECISION NOT NULL,
    "awareness" DOUBLE PRECISION NOT NULL,
    "agentFriction" DOUBLE PRECISION NOT NULL,
    "humanCoefficient" DOUBLE PRECISION NOT NULL,
    "acesScore" DOUBLE PRECISION,
    "userId" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectSubmission" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT,
    "githubUrl" TEXT,
    "logo" TEXT,
    "tags" TEXT,
    "yearCreated" INTEGER,
    "selfHostable" BOOLEAN NOT NULL DEFAULT false,
    "license" TEXT,
    "techStack" TEXT,
    "alternativeTo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedBy" TEXT,
    "submitterEmail" TEXT,
    "reviewedBy" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "rejectionReason" TEXT,
    "projectId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectHealth" (
    "projectId" INTEGER NOT NULL,
    "lastCommitDate" TIMESTAMP(3),
    "commitFrequency30d" INTEGER,
    "openIssues" INTEGER,
    "closedIssuesRatio" DOUBLE PRECISION,
    "lastReleaseDate" TIMESTAMP(3),
    "contributorCount" INTEGER,
    "healthStatus" TEXT NOT NULL DEFAULT 'active',
    "alerts" TEXT[],
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectHealth_pkey" PRIMARY KEY ("projectId")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "techStack" TEXT NOT NULL,
    "integrationType" TEXT,
    "setupComplexity" TEXT,
    "documentationUrl" TEXT,
    "quickStart" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Composition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "useCase" TEXT NOT NULL,
    "replaces" TEXT[],
    "deploymentComplexity" TEXT,
    "documentationUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Composition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompositionComponent" (
    "compositionId" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "alternatives" TEXT[],

    CONSTRAINT "CompositionComponent_pkey" PRIMARY KEY ("compositionId","projectId")
);

-- CreateTable
CREATE TABLE "ReinventionCost" (
    "category" TEXT NOT NULL,
    "typicalBuildTime" TEXT,
    "commonMissedEdgeCases" TEXT[],
    "knowledgeYears" INTEGER,
    "historicalFailures" TEXT[],
    "estimatedCostRatio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReinventionCost_pkey" PRIMARY KEY ("category")
);

-- CreateTable
CREATE TABLE "CommunityOverride" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "lever" TEXT NOT NULL,
    "originalScore" DOUBLE PRECISION NOT NULL,
    "overrideScore" DOUBLE PRECISION NOT NULL,
    "justification" TEXT NOT NULL,
    "submittedBy" TEXT,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcesObservation" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "agentName" TEXT NOT NULL,
    "promptCategory" TEXT NOT NULL,
    "promptText" TEXT,
    "wasChosen" BOOLEAN NOT NULL,
    "alternativeChosen" TEXT,
    "wasCustomDIY" BOOLEAN NOT NULL DEFAULT false,
    "expertAgreed" BOOLEAN,
    "expertReviewedBy" TEXT,
    "expertReviewedAt" TIMESTAMP(3),
    "sessionId" TEXT,
    "source" TEXT,
    "alternatives" JSONB,
    "mentions" JSONB,
    "extractionConfidence" DOUBLE PRECISION,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "implementationSucceeded" BOOLEAN,
    "abandoned" BOOLEAN NOT NULL DEFAULT false,
    "repoType" TEXT,
    "modelName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcesObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcesMetric" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "agentPickRate" DOUBLE PRECISION NOT NULL,
    "survivalAlignment" DOUBLE PRECISION NOT NULL,
    "customDIYRate" DOUBLE PRECISION NOT NULL,
    "expertAgreementRate" DOUBLE PRECISION NOT NULL,
    "phrasingStability" DOUBLE PRECISION NOT NULL,
    "totalObservations" INTEGER NOT NULL,
    "lastAggregatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcesMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolSurvivalScore" (
    "id" TEXT NOT NULL,
    "toolId" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "savingsScore" DOUBLE PRECISION NOT NULL,
    "usageScore" DOUBLE PRECISION NOT NULL,
    "humanScore" DOUBLE PRECISION NOT NULL,
    "awarenessCost" DOUBLE PRECISION NOT NULL,
    "frictionCost" DOUBLE PRECISION NOT NULL,
    "weightSavings" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "weightUsage" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "weightHuman" DOUBLE PRECISION NOT NULL DEFAULT 0.6,
    "weightAwareness" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "weightFriction" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "survivalRatio" DOUBLE PRECISION NOT NULL,
    "survivalScore" DOUBLE PRECISION NOT NULL,
    "survivalTier" TEXT NOT NULL,
    "dataPoints" INTEGER NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pickRate" DOUBLE PRECISION,
    "visibilityRate" DOUBLE PRECISION,
    "customDiyRateInCategory" DOUBLE PRECISION,
    "expertEndorsementRate" DOUBLE PRECISION,
    "visibilityByModel" JSONB,
    "awarenessDetail" JSONB,
    "tierThresholds" JSONB,

    CONSTRAINT "ToolSurvivalScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChoiceScoreRecord" (
    "id" TEXT NOT NULL,
    "extractionId" INTEGER NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "survivalAlignment" DOUBLE PRECISION NOT NULL,
    "expertEndorsement" DOUBLE PRECISION NOT NULL,
    "contextFit" DOUBLE PRECISION NOT NULL,
    "consistency" DOUBLE PRECISION NOT NULL,
    "reasoningQuality" DOUBLE PRECISION NOT NULL,
    "flags" JSONB,

    CONSTRAINT "ChoiceScoreRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TierThreshold" (
    "id" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tier" TEXT NOT NULL,
    "percentileFloor" DOUBLE PRECISION NOT NULL,
    "scoreMin" DOUBLE PRECISION NOT NULL,
    "scoreMax" DOUBLE PRECISION NOT NULL,
    "toolCount" INTEGER NOT NULL,

    CONSTRAINT "TierThreshold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeightCalibration" (
    "id" TEXT NOT NULL,
    "calibratedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wSavings" DOUBLE PRECISION NOT NULL,
    "wUsage" DOUBLE PRECISION NOT NULL,
    "wHuman" DOUBLE PRECISION NOT NULL,
    "wAwareness" DOUBLE PRECISION NOT NULL,
    "wFriction" DOUBLE PRECISION NOT NULL,
    "trainingSamples" INTEGER NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "WeightCalibration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentExecution" (
    "id" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "repositoryType" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "promptType" TEXT NOT NULL,
    "promptText" TEXT NOT NULL,
    "responseText" TEXT,
    "executionTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolExtraction" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "primaryToolId" INTEGER,
    "isCustomDiy" BOOLEAN NOT NULL DEFAULT false,
    "reasoning" TEXT,
    "confidence" DOUBLE PRECISION,
    "considerationSet" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToolExtraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpertEvaluation" (
    "id" TEXT NOT NULL,
    "toolId" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "wouldYouUse" TEXT NOT NULL,
    "contextNotes" TEXT,
    "appropriateness" INTEGER,
    "productionReadiness" INTEGER,
    "longTermViability" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpertEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AasScore" (
    "id" TEXT NOT NULL,
    "toolId" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aas" DOUBLE PRECISION NOT NULL,
    "unpromptedPickRate" DOUBLE PRECISION,
    "ecosystemPickRate" DOUBLE PRECISION,
    "considerationRate" DOUBLE PRECISION,
    "contextBreadth" INTEGER,
    "crossModelConsistency" DOUBLE PRECISION,
    "expertPreference" DOUBLE PRECISION,
    "hiddenGemGap" DOUBLE PRECISION,
    "hiddenGemClass" TEXT,
    "modelScores" JSONB,
    "dataPoints" INTEGER NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "AasScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_name_key" ON "Project"("name");

-- CreateIndex
CREATE INDEX "Project_type_idx" ON "Project"("type");

-- CreateIndex
CREATE INDEX "Project_category_idx" ON "Project"("category");

-- CreateIndex
CREATE INDEX "Project_selfHostable_idx" ON "Project"("selfHostable");

-- CreateIndex
CREATE UNIQUE INDEX "AIRating_projectId_key" ON "AIRating"("projectId");

-- CreateIndex
CREATE INDEX "AIRating_survivalScore_idx" ON "AIRating"("survivalScore");

-- CreateIndex
CREATE INDEX "AIRating_tier_idx" ON "AIRating"("tier");

-- CreateIndex
CREATE INDEX "UserRating_projectId_idx" ON "UserRating"("projectId");

-- CreateIndex
CREATE INDEX "UserRating_userId_idx" ON "UserRating"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSubmission_projectId_key" ON "ProjectSubmission"("projectId");

-- CreateIndex
CREATE INDEX "ProjectSubmission_status_idx" ON "ProjectSubmission"("status");

-- CreateIndex
CREATE INDEX "ProjectSubmission_createdAt_idx" ON "ProjectSubmission"("createdAt");

-- CreateIndex
CREATE INDEX "ProjectHealth_healthStatus_idx" ON "ProjectHealth"("healthStatus");

-- CreateIndex
CREATE INDEX "Integration_techStack_idx" ON "Integration"("techStack");

-- CreateIndex
CREATE INDEX "Integration_projectId_idx" ON "Integration"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_projectId_techStack_key" ON "Integration"("projectId", "techStack");

-- CreateIndex
CREATE INDEX "CompositionComponent_compositionId_idx" ON "CompositionComponent"("compositionId");

-- CreateIndex
CREATE INDEX "CommunityOverride_projectId_idx" ON "CommunityOverride"("projectId");

-- CreateIndex
CREATE INDEX "AcesObservation_projectId_idx" ON "AcesObservation"("projectId");

-- CreateIndex
CREATE INDEX "AcesObservation_agentName_idx" ON "AcesObservation"("agentName");

-- CreateIndex
CREATE INDEX "AcesObservation_promptCategory_idx" ON "AcesObservation"("promptCategory");

-- CreateIndex
CREATE INDEX "AcesObservation_createdAt_idx" ON "AcesObservation"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AcesMetric_projectId_key" ON "AcesMetric"("projectId");

-- CreateIndex
CREATE INDEX "ToolSurvivalScore_toolId_idx" ON "ToolSurvivalScore"("toolId");

-- CreateIndex
CREATE INDEX "ToolSurvivalScore_categoryId_idx" ON "ToolSurvivalScore"("categoryId");

-- CreateIndex
CREATE INDEX "ToolSurvivalScore_survivalScore_idx" ON "ToolSurvivalScore"("survivalScore");

-- CreateIndex
CREATE INDEX "ToolSurvivalScore_survivalTier_idx" ON "ToolSurvivalScore"("survivalTier");

-- CreateIndex
CREATE INDEX "ToolSurvivalScore_computedAt_idx" ON "ToolSurvivalScore"("computedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ToolSurvivalScore_toolId_categoryId_computedAt_key" ON "ToolSurvivalScore"("toolId", "categoryId", "computedAt");

-- CreateIndex
CREATE INDEX "ChoiceScoreRecord_extractionId_idx" ON "ChoiceScoreRecord"("extractionId");

-- CreateIndex
CREATE INDEX "ChoiceScoreRecord_computedAt_idx" ON "ChoiceScoreRecord"("computedAt");

-- CreateIndex
CREATE INDEX "TierThreshold_computedAt_idx" ON "TierThreshold"("computedAt");

-- CreateIndex
CREATE INDEX "TierThreshold_tier_idx" ON "TierThreshold"("tier");

-- CreateIndex
CREATE INDEX "WeightCalibration_calibratedAt_idx" ON "WeightCalibration"("calibratedAt");

-- CreateIndex
CREATE INDEX "AgentExecution_agentName_modelName_idx" ON "AgentExecution"("agentName", "modelName");

-- CreateIndex
CREATE INDEX "AgentExecution_categoryId_idx" ON "AgentExecution"("categoryId");

-- CreateIndex
CREATE INDEX "AgentExecution_promptType_idx" ON "AgentExecution"("promptType");

-- CreateIndex
CREATE INDEX "AgentExecution_createdAt_idx" ON "AgentExecution"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ToolExtraction_executionId_key" ON "ToolExtraction"("executionId");

-- CreateIndex
CREATE INDEX "ToolExtraction_primaryToolId_idx" ON "ToolExtraction"("primaryToolId");

-- CreateIndex
CREATE INDEX "ToolExtraction_executionId_idx" ON "ToolExtraction"("executionId");

-- CreateIndex
CREATE INDEX "ExpertEvaluation_toolId_idx" ON "ExpertEvaluation"("toolId");

-- CreateIndex
CREATE INDEX "ExpertEvaluation_categoryId_idx" ON "ExpertEvaluation"("categoryId");

-- CreateIndex
CREATE INDEX "ExpertEvaluation_evaluatorId_idx" ON "ExpertEvaluation"("evaluatorId");

-- CreateIndex
CREATE INDEX "AasScore_toolId_idx" ON "AasScore"("toolId");

-- CreateIndex
CREATE INDEX "AasScore_categoryId_idx" ON "AasScore"("categoryId");

-- CreateIndex
CREATE INDEX "AasScore_aas_idx" ON "AasScore"("aas");

-- CreateIndex
CREATE INDEX "AasScore_computedAt_idx" ON "AasScore"("computedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AasScore_toolId_categoryId_computedAt_key" ON "AasScore"("toolId", "categoryId", "computedAt");

-- AddForeignKey
ALTER TABLE "AIRating" ADD CONSTRAINT "AIRating_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRating" ADD CONSTRAINT "UserRating_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectHealth" ADD CONSTRAINT "ProjectHealth_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompositionComponent" ADD CONSTRAINT "CompositionComponent_compositionId_fkey" FOREIGN KEY ("compositionId") REFERENCES "Composition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompositionComponent" ADD CONSTRAINT "CompositionComponent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityOverride" ADD CONSTRAINT "CommunityOverride_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcesObservation" ADD CONSTRAINT "AcesObservation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcesMetric" ADD CONSTRAINT "AcesMetric_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolSurvivalScore" ADD CONSTRAINT "ToolSurvivalScore_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoiceScoreRecord" ADD CONSTRAINT "ChoiceScoreRecord_extractionId_fkey" FOREIGN KEY ("extractionId") REFERENCES "AcesObservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolExtraction" ADD CONSTRAINT "ToolExtraction_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AgentExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolExtraction" ADD CONSTRAINT "ToolExtraction_primaryToolId_fkey" FOREIGN KEY ("primaryToolId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertEvaluation" ADD CONSTRAINT "ExpertEvaluation_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AasScore" ADD CONSTRAINT "AasScore_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

