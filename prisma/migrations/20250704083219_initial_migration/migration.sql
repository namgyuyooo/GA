-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "UtmCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "medium" TEXT NOT NULL,
    "campaign" TEXT NOT NULL,
    "term" TEXT,
    "content" TEXT,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UtmCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyReport" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalSessions" INTEGER NOT NULL,
    "totalUsers" INTEGER NOT NULL,
    "totalConversions" INTEGER NOT NULL,
    "avgEngagementRate" DOUBLE PRECISION NOT NULL,
    "totalClicks" INTEGER NOT NULL,
    "totalImpressions" INTEGER NOT NULL,
    "avgCtr" DOUBLE PRECISION NOT NULL,
    "avgPosition" DOUBLE PRECISION NOT NULL,
    "reportData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledJob" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRun" TIMESTAMP(3),
    "nextRun" TIMESTAMP(3),
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyReportSchedule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '주간 보고서',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dayOfWeek" INTEGER NOT NULL DEFAULT 1,
    "hour" INTEGER NOT NULL DEFAULT 10,
    "minute" INTEGER NOT NULL DEFAULT 30,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Seoul',
    "recipients" JSONB,
    "includeSummary" BOOLEAN NOT NULL DEFAULT true,
    "includeIssues" BOOLEAN NOT NULL DEFAULT true,
    "includeAI" BOOLEAN NOT NULL DEFAULT true,
    "aiPrompt" TEXT,
    "propertyIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyReportSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "KeywordCohortGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "keywords" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeywordCohortGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UtmCohortGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#10B981',
    "campaigns" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UtmCohortGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeywordCohortData" (
    "id" TEXT NOT NULL,
    "cohortDate" TIMESTAMP(3) NOT NULL,
    "keyword" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "initialUsers" INTEGER NOT NULL DEFAULT 0,
    "retentionWeek1" INTEGER NOT NULL DEFAULT 0,
    "retentionWeek2" INTEGER NOT NULL DEFAULT 0,
    "retentionWeek4" INTEGER NOT NULL DEFAULT 0,
    "retentionWeek8" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "groupId" TEXT,
    "propertyId" TEXT NOT NULL,
    "dataSource" TEXT NOT NULL DEFAULT 'GSC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeywordCohortData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataUpdateLog" (
    "id" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "propertyId" TEXT,
    "status" TEXT NOT NULL,
    "recordsCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "triggeredBy" TEXT NOT NULL DEFAULT 'SCHEDULED',

    CONSTRAINT "DataUpdateLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversionGoal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "goalType" TEXT NOT NULL,
    "eventName" TEXT,
    "pagePath" TEXT,
    "revenueThreshold" DOUBLE PRECISION,
    "durationSeconds" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversionGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GTMGoal" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GTMGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "dataSourceTypes" JSONB,
    "analysisStartDate" TIMESTAMP(3),
    "analysisEndDate" TIMESTAMP(3),
    "sourceInsightIds" JSONB,
    "isComprehensive" BOOLEAN NOT NULL DEFAULT false,
    "weeklyTrend" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CachedAnalyticsData" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updateFrequency" INTEGER NOT NULL DEFAULT 3600,

    CONSTRAINT "CachedAnalyticsData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CachedSearchData" (
    "id" TEXT NOT NULL,
    "siteUrl" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updateFrequency" INTEGER NOT NULL DEFAULT 86400,

    CONSTRAINT "CachedSearchData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CachedGTMData" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updateFrequency" INTEGER NOT NULL DEFAULT 43200,

    CONSTRAINT "CachedGTMData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyTrendData" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "week1" JSONB NOT NULL,
    "week2" JSONB NOT NULL,
    "week3" JSONB NOT NULL,
    "week4" JSONB NOT NULL,
    "changeRates" JSONB NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyTrendData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "prompt" TEXT NOT NULL,
    "variables" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnifiedEventSequence" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "propertyId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnifiedEventSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBehaviorPattern" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "patternDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "patternType" TEXT NOT NULL,
    "segmentName" TEXT NOT NULL,
    "entryPatterns" JSONB NOT NULL,
    "entryPagePatterns" JSONB NOT NULL,
    "journeyPatterns" JSONB NOT NULL,
    "durationPatterns" JSONB NOT NULL,
    "scrollPatterns" JSONB NOT NULL,
    "conversionPatterns" JSONB NOT NULL,
    "dropoffPatterns" JSONB NOT NULL,
    "sessionCount" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgInterestScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgDuration" INTEGER NOT NULL DEFAULT 0,
    "insights" JSONB,
    "recommendations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBehaviorPattern_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "UtmCampaign_campaign_source_medium_key" ON "UtmCampaign"("campaign", "source", "medium");

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
CREATE INDEX "Insight_type_propertyId_createdAt_idx" ON "Insight"("type", "propertyId", "createdAt");

-- CreateIndex
CREATE INDEX "Insight_isComprehensive_createdAt_idx" ON "Insight"("isComprehensive", "createdAt");

-- CreateIndex
CREATE INDEX "CachedAnalyticsData_expiresAt_idx" ON "CachedAnalyticsData"("expiresAt");

-- CreateIndex
CREATE INDEX "CachedAnalyticsData_propertyId_dataType_idx" ON "CachedAnalyticsData"("propertyId", "dataType");

-- CreateIndex
CREATE UNIQUE INDEX "CachedAnalyticsData_propertyId_dataType_period_key" ON "CachedAnalyticsData"("propertyId", "dataType", "period");

-- CreateIndex
CREATE INDEX "CachedSearchData_expiresAt_idx" ON "CachedSearchData"("expiresAt");

-- CreateIndex
CREATE INDEX "CachedSearchData_siteUrl_dataType_idx" ON "CachedSearchData"("siteUrl", "dataType");

-- CreateIndex
CREATE UNIQUE INDEX "CachedSearchData_siteUrl_dataType_period_key" ON "CachedSearchData"("siteUrl", "dataType", "period");

-- CreateIndex
CREATE INDEX "CachedGTMData_expiresAt_idx" ON "CachedGTMData"("expiresAt");

-- CreateIndex
CREATE INDEX "CachedGTMData_accountId_containerId_idx" ON "CachedGTMData"("accountId", "containerId");

-- CreateIndex
CREATE UNIQUE INDEX "CachedGTMData_accountId_containerId_dataType_key" ON "CachedGTMData"("accountId", "containerId", "dataType");

-- CreateIndex
CREATE INDEX "WeeklyTrendData_propertyId_calculatedAt_idx" ON "WeeklyTrendData"("propertyId", "calculatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyTrendData_propertyId_dataType_key" ON "WeeklyTrendData"("propertyId", "dataType");

-- CreateIndex
CREATE INDEX "PromptTemplate_type_isActive_idx" ON "PromptTemplate"("type", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PromptTemplate_name_type_key" ON "PromptTemplate"("name", "type");

-- CreateIndex
CREATE INDEX "UnifiedEventSequence_propertyId_timestamp_idx" ON "UnifiedEventSequence"("propertyId", "timestamp");

-- CreateIndex
CREATE INDEX "UnifiedEventSequence_userId_idx" ON "UnifiedEventSequence"("userId");

-- CreateIndex
CREATE INDEX "UnifiedEventSequence_eventType_idx" ON "UnifiedEventSequence"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "UnifiedEventSequence_sessionId_propertyId_timestamp_key" ON "UnifiedEventSequence"("sessionId", "propertyId", "timestamp");

-- CreateIndex
CREATE INDEX "UserBehaviorPattern_propertyId_patternDate_idx" ON "UserBehaviorPattern"("propertyId", "patternDate");

-- CreateIndex
CREATE INDEX "UserBehaviorPattern_patternType_idx" ON "UserBehaviorPattern"("patternType");

-- CreateIndex
CREATE INDEX "UserBehaviorPattern_segmentName_idx" ON "UserBehaviorPattern"("segmentName");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
