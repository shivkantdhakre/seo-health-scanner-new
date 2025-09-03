-- CreateIndex
CREATE INDEX "Scan_status_idx" ON "public"."Scan"("status");

-- CreateIndex
CREATE INDEX "Scan_userId_createdAt_idx" ON "public"."Scan"("userId", "createdAt" DESC);
