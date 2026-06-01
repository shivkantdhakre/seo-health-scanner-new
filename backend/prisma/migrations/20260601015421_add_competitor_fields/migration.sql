-- AlterTable
ALTER TABLE "public"."Scan" ADD COLUMN     "comparisonInsights" JSONB,
ADD COLUMN     "competitorData" JSONB,
ADD COLUMN     "competitorUrl" TEXT,
ADD COLUMN     "isComparison" BOOLEAN NOT NULL DEFAULT false;
