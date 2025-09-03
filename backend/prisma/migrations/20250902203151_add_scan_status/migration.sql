-- CreateEnum
CREATE TYPE "public"."ScanStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "public"."Scan" ADD COLUMN     "status" "public"."ScanStatus" NOT NULL DEFAULT 'PENDING';
