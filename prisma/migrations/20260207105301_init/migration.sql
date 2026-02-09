-- CreateTable
CREATE TABLE "Project" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AIRating" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "insightCompression" REAL NOT NULL,
    "substrateEfficiency" REAL NOT NULL,
    "broadUtility" REAL NOT NULL,
    "awareness" REAL NOT NULL,
    "agentFriction" REAL NOT NULL,
    "humanCoefficient" REAL NOT NULL,
    "survivalScore" REAL NOT NULL,
    "tier" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "reasoning" JSONB NOT NULL,
    "model" TEXT NOT NULL,
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
CREATE TABLE "UserRating" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "insightCompression" REAL NOT NULL,
    "substrateEfficiency" REAL NOT NULL,
    "broadUtility" REAL NOT NULL,
    "awareness" REAL NOT NULL,
    "agentFriction" REAL NOT NULL,
    "humanCoefficient" REAL NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserRating_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_name_key" ON "Project"("name");

-- CreateIndex
CREATE INDEX "Project_type_idx" ON "Project"("type");

-- CreateIndex
CREATE INDEX "Project_category_idx" ON "Project"("category");

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
