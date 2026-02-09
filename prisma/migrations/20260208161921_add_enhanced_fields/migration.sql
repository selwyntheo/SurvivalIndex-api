-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
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
INSERT INTO "new_Project" ("category", "createdAt", "description", "githubUrl", "id", "logo", "name", "tags", "type", "updatedAt", "url", "yearCreated") SELECT "category", "createdAt", "description", "githubUrl", "id", "logo", "name", "tags", "type", "updatedAt", "url", "yearCreated" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_name_key" ON "Project"("name");
CREATE INDEX "Project_type_idx" ON "Project"("type");
CREATE INDEX "Project_category_idx" ON "Project"("category");
CREATE INDEX "Project_selfHostable_idx" ON "Project"("selfHostable");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
