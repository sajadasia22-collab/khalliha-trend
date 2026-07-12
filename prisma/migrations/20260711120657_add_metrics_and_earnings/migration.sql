-- CreateEnum
CREATE TYPE "EarningStatus" AS ENUM ('ESTIMATED', 'PENDING_VERIFICATION', 'HELD', 'AVAILABLE', 'PAID', 'REVERSED');

-- CreateTable
CREATE TABLE "MetricsSnapshot" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "observedViews" BIGINT NOT NULL,
    "qualifiedViews" BIGINT NOT NULL,
    "disqualifiedViews" BIGINT NOT NULL DEFAULT 0,
    "disqualificationReason" TEXT,
    "source" TEXT NOT NULL DEFAULT 'MANUAL_ADMIN',
    "capturedByUserId" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EarningAccrual" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "metricsSnapshotId" TEXT,
    "amount" BIGINT NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'IQD',
    "status" "EarningStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "heldUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EarningAccrual_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MetricsSnapshot_submissionId_idx" ON "MetricsSnapshot"("submissionId");

-- CreateIndex
CREATE INDEX "EarningAccrual_submissionId_idx" ON "EarningAccrual"("submissionId");

-- AddForeignKey
ALTER TABLE "MetricsSnapshot" ADD CONSTRAINT "MetricsSnapshot_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricsSnapshot" ADD CONSTRAINT "MetricsSnapshot_capturedByUserId_fkey" FOREIGN KEY ("capturedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EarningAccrual" ADD CONSTRAINT "EarningAccrual_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EarningAccrual" ADD CONSTRAINT "EarningAccrual_metricsSnapshotId_fkey" FOREIGN KEY ("metricsSnapshotId") REFERENCES "MetricsSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
