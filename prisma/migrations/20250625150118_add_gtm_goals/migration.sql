-- CreateTable
CREATE TABLE "KeywordCohortGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "keywords" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UtmCohortGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#10B981',
    "campaigns" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "KeywordCohortData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cohortDate" DATETIME NOT NULL,
    "keyword" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "ctr" REAL NOT NULL DEFAULT 0,
    "position" REAL NOT NULL DEFAULT 0,
    "initialUsers" INTEGER NOT NULL DEFAULT 0,
    "retentionWeek1" INTEGER NOT NULL DEFAULT 0,
    "retentionWeek2" INTEGER NOT NULL DEFAULT 0,
    "retentionWeek4" INTEGER NOT NULL DEFAULT 0,
    "retentionWeek8" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" REAL NOT NULL DEFAULT 0,
    "groupId" TEXT,
    "propertyId" TEXT NOT NULL,
    "dataSource" TEXT NOT NULL DEFAULT 'GSC',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DataUpdateLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dataType" TEXT NOT NULL,
    "propertyId" TEXT,
    "status" TEXT NOT NULL,
    "recordsCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "triggeredBy" TEXT NOT NULL DEFAULT 'SCHEDULED'
);

-- CreateTable
CREATE TABLE "ConversionGoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "goalType" TEXT NOT NULL,
    "eventName" TEXT,
    "pagePath" TEXT,
    "revenueThreshold" REAL,
    "durationSeconds" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "propertyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GTMGoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ConversionPath" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "goalId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "propertyId" TEXT NOT NULL,
    "conversionDate" DATETIME NOT NULL,
    "entryKeyword" TEXT,
    "entrySource" TEXT,
    "entryMedium" TEXT,
    "entryPage" TEXT,
    "pageSequence" TEXT NOT NULL,
    "eventSequence" TEXT NOT NULL,
    "sessionDuration" INTEGER NOT NULL DEFAULT 0,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "totalEvents" INTEGER NOT NULL DEFAULT 0,
    "revenue" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConversionPath_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "ConversionGoal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserInterestProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "profileDate" DATETIME NOT NULL,
    "entryKeyword" TEXT,
    "entrySource" TEXT,
    "entryMedium" TEXT,
    "entryPage" TEXT,
    "sessionDuration" INTEGER NOT NULL DEFAULT 0,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "totalEvents" INTEGER NOT NULL DEFAULT 0,
    "scrollDepth" REAL NOT NULL DEFAULT 0,
    "goalProximityScore" REAL NOT NULL DEFAULT 0,
    "engagementScore" REAL NOT NULL DEFAULT 0,
    "returnVisitCount" INTEGER NOT NULL DEFAULT 0,
    "conversionProbability" REAL NOT NULL DEFAULT 0,
    "riskOfChurn" REAL NOT NULL DEFAULT 0,
    "pageSequence" TEXT NOT NULL,
    "eventSequence" TEXT NOT NULL,
    "visitPattern" TEXT NOT NULL,
    "interestedGoals" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "KeywordCohortGroup_name_key" ON "KeywordCohortGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UtmCohortGroup_name_key" ON "UtmCohortGroup"("name");

-- CreateIndex
CREATE INDEX "KeywordCohortData_propertyId_cohortDate_idx" ON "KeywordCohortData"("propertyId", "cohortDate");

-- CreateIndex
CREATE INDEX "KeywordCohortData_keyword_idx" ON "KeywordCohortData"("keyword");

-- CreateIndex
CREATE UNIQUE INDEX "KeywordCohortData_cohortDate_keyword_propertyId_key" ON "KeywordCohortData"("cohortDate", "keyword", "propertyId");

-- CreateIndex
CREATE INDEX "DataUpdateLog_dataType_propertyId_idx" ON "DataUpdateLog"("dataType", "propertyId");

-- CreateIndex
CREATE INDEX "ConversionGoal_propertyId_isActive_idx" ON "ConversionGoal"("propertyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ConversionGoal_name_propertyId_key" ON "ConversionGoal"("name", "propertyId");

-- CreateIndex
CREATE INDEX "GTMGoal_accountId_containerId_idx" ON "GTMGoal"("accountId", "containerId");

-- CreateIndex
CREATE UNIQUE INDEX "GTMGoal_accountId_containerId_tagId_key" ON "GTMGoal"("accountId", "containerId", "tagId");

-- CreateIndex
CREATE INDEX "ConversionPath_goalId_conversionDate_idx" ON "ConversionPath"("goalId", "conversionDate");

-- CreateIndex
CREATE INDEX "ConversionPath_propertyId_conversionDate_idx" ON "ConversionPath"("propertyId", "conversionDate");

-- CreateIndex
CREATE INDEX "ConversionPath_entryKeyword_idx" ON "ConversionPath"("entryKeyword");

-- CreateIndex
CREATE INDEX "UserInterestProfile_propertyId_profileDate_idx" ON "UserInterestProfile"("propertyId", "profileDate");

-- CreateIndex
CREATE INDEX "UserInterestProfile_conversionProbability_idx" ON "UserInterestProfile"("conversionProbability");

-- CreateIndex
CREATE INDEX "UserInterestProfile_userId_idx" ON "UserInterestProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserInterestProfile_sessionId_propertyId_key" ON "UserInterestProfile"("sessionId", "propertyId");
