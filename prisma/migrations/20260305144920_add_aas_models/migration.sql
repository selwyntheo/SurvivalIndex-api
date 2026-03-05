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
ALTER TABLE "ToolExtraction" ADD CONSTRAINT "ToolExtraction_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AgentExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolExtraction" ADD CONSTRAINT "ToolExtraction_primaryToolId_fkey" FOREIGN KEY ("primaryToolId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertEvaluation" ADD CONSTRAINT "ExpertEvaluation_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AasScore" ADD CONSTRAINT "AasScore_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
