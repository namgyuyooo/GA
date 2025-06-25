-- CreateTable
CREATE TABLE "WeeklyReportSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT '주간 보고서',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dayOfWeek" INTEGER NOT NULL DEFAULT 1,
    "hour" INTEGER NOT NULL DEFAULT 10,
    "minute" INTEGER NOT NULL DEFAULT 30,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Seoul',
    "recipients" TEXT,
    "includeSummary" BOOLEAN NOT NULL DEFAULT true,
    "includeIssues" BOOLEAN NOT NULL DEFAULT true,
    "includeAI" BOOLEAN NOT NULL DEFAULT true,
    "aiPrompt" TEXT,
    "propertyIds" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
