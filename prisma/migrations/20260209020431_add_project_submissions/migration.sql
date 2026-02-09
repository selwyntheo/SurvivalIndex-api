-- CreateTable
CREATE TABLE "ProjectSubmission" (
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

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSubmission_projectId_key" ON "ProjectSubmission"("projectId");

-- CreateIndex
CREATE INDEX "ProjectSubmission_status_idx" ON "ProjectSubmission"("status");

-- CreateIndex
CREATE INDEX "ProjectSubmission_createdAt_idx" ON "ProjectSubmission"("createdAt");
