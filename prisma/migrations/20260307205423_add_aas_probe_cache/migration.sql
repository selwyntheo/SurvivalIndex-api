-- CreateTable
CREATE TABLE "AasProbeCache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "modelLabel" TEXT NOT NULL,
    "promptType" TEXT NOT NULL,
    "extraction" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AasProbeCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AasProbeCache_cacheKey_key" ON "AasProbeCache"("cacheKey");

-- CreateIndex
CREATE INDEX "AasProbeCache_categoryId_idx" ON "AasProbeCache"("categoryId");

-- CreateIndex
CREATE INDEX "AasProbeCache_modelLabel_idx" ON "AasProbeCache"("modelLabel");
