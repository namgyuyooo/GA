-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "description" TEXT,
    "industry" TEXT,
    "keywords" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competitor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Competitor_domain_key" ON "Competitor"("domain");

-- CreateIndex
CREATE INDEX "Competitor_domain_idx" ON "Competitor"("domain");

-- CreateIndex
CREATE INDEX "Competitor_isActive_idx" ON "Competitor"("isActive");
