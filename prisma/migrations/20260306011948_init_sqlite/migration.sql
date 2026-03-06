-- CreateTable
CREATE TABLE IF NOT EXISTS "Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AIRating" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "insightCompression" REAL NOT NULL,
    "substrateEfficiency" REAL NOT NULL,
    "broadUtility" REAL NOT NULL,
    "awareness" REAL NOT NULL,
    "agentFriction" REAL NOT NULL,
    "humanCoefficient" REAL NOT NULL,
    "acesScore" REAL,
    "insightEvidence" TEXT,
    "substrateEvidence" TEXT,
    "utilityEvidence" TEXT,
    "awarenessEvidence" TEXT,
    "agentEvidence" TEXT,
    "humanEvidence" TEXT,
    "acesEvidence" TEXT,
    "survivalScore" REAL NOT NULL,
    "tier" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "reasoning" JSONB NOT NULL,
    "suggestions" JSONB,
    "model" TEXT NOT NULL,
    "dataSources" TEXT,
    "humanReviewed" BOOLEAN NOT NULL DEFAULT false,
    "githubStars" INTEGER,
    "githubForks" INTEGER,
    "githubIssues" INTEGER,
    "npmDownloads" INTEGER,
    "documentationQuality" REAL,
    "lastAnalyzedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AIRating_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "UserRating" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "insightCompression" REAL NOT NULL,
    "substrateEfficiency" REAL NOT NULL,
    "broadUtility" REAL NOT NULL,
    "awareness" REAL NOT NULL,
    "agentFriction" REAL NOT NULL,
    "humanCoefficient" REAL NOT NULL,
    "acesScore" REAL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserRating_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ProjectSubmission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    "reviewedAt" DATETIME,
    "reviewNotes" TEXT,
    "rejectionReason" TEXT,
    "projectId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ProjectHealth" (
    "projectId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lastCommitDate" DATETIME,
    "commitFrequency30d" INTEGER,
    "openIssues" INTEGER,
    "closedIssuesRatio" REAL,
    "lastReleaseDate" DATETIME,
    "contributorCount" INTEGER,
    "healthStatus" TEXT NOT NULL DEFAULT 'active',
    "alerts" TEXT,
    "lastChecked" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectHealth_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Integration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "techStack" TEXT NOT NULL,
    "integrationType" TEXT,
    "setupComplexity" TEXT,
    "documentationUrl" TEXT,
    "quickStart" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Integration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Composition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "useCase" TEXT NOT NULL,
    "replaces" TEXT,
    "deploymentComplexity" TEXT,
    "documentationUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CompositionComponent" (
    "compositionId" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "alternatives" TEXT,

    PRIMARY KEY ("compositionId", "projectId"),
    CONSTRAINT "CompositionComponent_compositionId_fkey" FOREIGN KEY ("compositionId") REFERENCES "Composition" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CompositionComponent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ReinventionCost" (
    "category" TEXT NOT NULL PRIMARY KEY,
    "typicalBuildTime" TEXT,
    "commonMissedEdgeCases" TEXT,
    "knowledgeYears" INTEGER,
    "historicalFailures" TEXT,
    "estimatedCostRatio" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CommunityOverride" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "lever" TEXT NOT NULL,
    "originalScore" REAL NOT NULL,
    "overrideScore" REAL NOT NULL,
    "justification" TEXT NOT NULL,
    "submittedBy" TEXT,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommunityOverride_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AcesObservation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "agentName" TEXT NOT NULL,
    "promptCategory" TEXT NOT NULL,
    "promptText" TEXT,
    "wasChosen" BOOLEAN NOT NULL,
    "alternativeChosen" TEXT,
    "wasCustomDIY" BOOLEAN NOT NULL DEFAULT false,
    "expertAgreed" BOOLEAN,
    "expertReviewedBy" TEXT,
    "expertReviewedAt" DATETIME,
    "sessionId" TEXT,
    "source" TEXT,
    "alternatives" JSONB,
    "mentions" JSONB,
    "extractionConfidence" REAL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "implementationSucceeded" BOOLEAN,
    "abandoned" BOOLEAN NOT NULL DEFAULT false,
    "repoType" TEXT,
    "modelName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AcesObservation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AcesMetric" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "agentPickRate" REAL NOT NULL,
    "survivalAlignment" REAL NOT NULL,
    "customDIYRate" REAL NOT NULL,
    "expertAgreementRate" REAL NOT NULL,
    "phrasingStability" REAL NOT NULL,
    "totalObservations" INTEGER NOT NULL,
    "lastAggregatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AcesMetric_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ToolSurvivalScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "toolId" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,
    "computedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "savingsScore" REAL NOT NULL,
    "usageScore" REAL NOT NULL,
    "humanScore" REAL NOT NULL,
    "awarenessCost" REAL NOT NULL,
    "frictionCost" REAL NOT NULL,
    "weightSavings" REAL NOT NULL DEFAULT 1.0,
    "weightUsage" REAL NOT NULL DEFAULT 0.8,
    "weightHuman" REAL NOT NULL DEFAULT 0.6,
    "weightAwareness" REAL NOT NULL DEFAULT 1.0,
    "weightFriction" REAL NOT NULL DEFAULT 1.0,
    "survivalRatio" REAL NOT NULL,
    "survivalScore" REAL NOT NULL,
    "survivalTier" TEXT NOT NULL,
    "dataPoints" INTEGER NOT NULL DEFAULT 0,
    "confidence" REAL NOT NULL DEFAULT 0,
    "pickRate" REAL,
    "visibilityRate" REAL,
    "customDiyRateInCategory" REAL,
    "expertEndorsementRate" REAL,
    "visibilityByModel" JSONB,
    "awarenessDetail" JSONB,
    "tierThresholds" JSONB,
    CONSTRAINT "ToolSurvivalScore_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ChoiceScoreRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "extractionId" INTEGER NOT NULL,
    "computedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "overallScore" REAL NOT NULL,
    "survivalAlignment" REAL NOT NULL,
    "expertEndorsement" REAL NOT NULL,
    "contextFit" REAL NOT NULL,
    "consistency" REAL NOT NULL,
    "reasoningQuality" REAL NOT NULL,
    "flags" JSONB,
    CONSTRAINT "ChoiceScoreRecord_extractionId_fkey" FOREIGN KEY ("extractionId") REFERENCES "AcesObservation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TierThreshold" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "computedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tier" TEXT NOT NULL,
    "percentileFloor" REAL NOT NULL,
    "scoreMin" REAL NOT NULL,
    "scoreMax" REAL NOT NULL,
    "toolCount" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "WeightCalibration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "calibratedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wSavings" REAL NOT NULL,
    "wUsage" REAL NOT NULL,
    "wHuman" REAL NOT NULL,
    "wAwareness" REAL NOT NULL,
    "wFriction" REAL NOT NULL,
    "trainingSamples" INTEGER NOT NULL DEFAULT 0,
    "accuracy" REAL,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AgentExecution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentName" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "repositoryType" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "promptType" TEXT NOT NULL,
    "promptText" TEXT NOT NULL,
    "responseText" TEXT,
    "executionTimeMs" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ToolExtraction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "executionId" TEXT NOT NULL,
    "primaryToolId" INTEGER,
    "isCustomDiy" BOOLEAN NOT NULL DEFAULT false,
    "reasoning" TEXT,
    "confidence" REAL,
    "considerationSet" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ToolExtraction_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AgentExecution" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ToolExtraction_primaryToolId_fkey" FOREIGN KEY ("primaryToolId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ExpertEvaluation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "toolId" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "wouldYouUse" TEXT NOT NULL,
    "contextNotes" TEXT,
    "appropriateness" INTEGER,
    "productionReadiness" INTEGER,
    "longTermViability" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExpertEvaluation_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AasScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "toolId" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,
    "computedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aas" REAL NOT NULL,
    "unpromptedPickRate" REAL,
    "ecosystemPickRate" REAL,
    "considerationRate" REAL,
    "contextBreadth" INTEGER,
    "crossModelConsistency" REAL,
    "expertPreference" REAL,
    "hiddenGemGap" REAL,
    "hiddenGemClass" TEXT,
    "modelScores" JSONB,
    "dataPoints" INTEGER NOT NULL DEFAULT 0,
    "confidence" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "AasScore_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Project_name_key" ON "Project"("name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Project_type_idx" ON "Project"("type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Project_category_idx" ON "Project"("category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Project_selfHostable_idx" ON "Project"("selfHostable");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AIRating_projectId_key" ON "AIRating"("projectId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AIRating_survivalScore_idx" ON "AIRating"("survivalScore");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AIRating_tier_idx" ON "AIRating"("tier");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserRating_projectId_idx" ON "UserRating"("projectId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserRating_userId_idx" ON "UserRating"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ProjectSubmission_projectId_key" ON "ProjectSubmission"("projectId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProjectSubmission_status_idx" ON "ProjectSubmission"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProjectSubmission_createdAt_idx" ON "ProjectSubmission"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProjectHealth_healthStatus_idx" ON "ProjectHealth"("healthStatus");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Integration_techStack_idx" ON "Integration"("techStack");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Integration_projectId_idx" ON "Integration"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Integration_projectId_techStack_key" ON "Integration"("projectId", "techStack");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CompositionComponent_compositionId_idx" ON "CompositionComponent"("compositionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CommunityOverride_projectId_idx" ON "CommunityOverride"("projectId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AcesObservation_projectId_idx" ON "AcesObservation"("projectId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AcesObservation_agentName_idx" ON "AcesObservation"("agentName");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AcesObservation_promptCategory_idx" ON "AcesObservation"("promptCategory");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AcesObservation_createdAt_idx" ON "AcesObservation"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AcesMetric_projectId_key" ON "AcesMetric"("projectId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ToolSurvivalScore_toolId_idx" ON "ToolSurvivalScore"("toolId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ToolSurvivalScore_categoryId_idx" ON "ToolSurvivalScore"("categoryId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ToolSurvivalScore_survivalScore_idx" ON "ToolSurvivalScore"("survivalScore");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ToolSurvivalScore_survivalTier_idx" ON "ToolSurvivalScore"("survivalTier");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ToolSurvivalScore_computedAt_idx" ON "ToolSurvivalScore"("computedAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ToolSurvivalScore_toolId_categoryId_computedAt_key" ON "ToolSurvivalScore"("toolId", "categoryId", "computedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ChoiceScoreRecord_extractionId_idx" ON "ChoiceScoreRecord"("extractionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ChoiceScoreRecord_computedAt_idx" ON "ChoiceScoreRecord"("computedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TierThreshold_computedAt_idx" ON "TierThreshold"("computedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TierThreshold_tier_idx" ON "TierThreshold"("tier");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WeightCalibration_calibratedAt_idx" ON "WeightCalibration"("calibratedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AgentExecution_agentName_modelName_idx" ON "AgentExecution"("agentName", "modelName");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AgentExecution_categoryId_idx" ON "AgentExecution"("categoryId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AgentExecution_promptType_idx" ON "AgentExecution"("promptType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AgentExecution_createdAt_idx" ON "AgentExecution"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ToolExtraction_executionId_key" ON "ToolExtraction"("executionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ToolExtraction_primaryToolId_idx" ON "ToolExtraction"("primaryToolId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ToolExtraction_executionId_idx" ON "ToolExtraction"("executionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ExpertEvaluation_toolId_idx" ON "ExpertEvaluation"("toolId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ExpertEvaluation_categoryId_idx" ON "ExpertEvaluation"("categoryId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ExpertEvaluation_evaluatorId_idx" ON "ExpertEvaluation"("evaluatorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AasScore_toolId_idx" ON "AasScore"("toolId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AasScore_categoryId_idx" ON "AasScore"("categoryId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AasScore_aas_idx" ON "AasScore"("aas");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AasScore_computedAt_idx" ON "AasScore"("computedAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AasScore_toolId_categoryId_computedAt_key" ON "AasScore"("toolId", "categoryId", "computedAt");
