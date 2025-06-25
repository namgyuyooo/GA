-- CreateTable
CREATE TABLE "PromptTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "prompt" TEXT NOT NULL,
    "variables" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "PromptTemplate_type_isActive_idx" ON "PromptTemplate"("type", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PromptTemplate_name_type_key" ON "PromptTemplate"("name", "type");
