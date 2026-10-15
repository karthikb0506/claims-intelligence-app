-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('SUPPORTED', 'PARTIALLY_SUPPORTED', 'NOT_SUPPORTED', 'INSUFFICIENT_EVIDENCE');

-- CreateTable
CREATE TABLE "claims" (
    "id" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "wording" TEXT NOT NULL,
    "market" TEXT NOT NULL DEFAULT 'EU',
    "submittedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "evidenceText" TEXT NOT NULL,
    "evidenceHash" TEXT NOT NULL,
    "verdict" "Verdict" NOT NULL,
    "modelConfidence" DOUBLE PRECISION NOT NULL,
    "evidenceStrength" INTEGER NOT NULL,
    "reasoning" TEXT NOT NULL,
    "suggestedClaim" TEXT,
    "extractedFacts" JSONB NOT NULL,
    "ruleFindings" JSONB NOT NULL,
    "rawModelOutput" JSONB NOT NULL,
    "modelId" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "rulesVersion" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "claims_productName_idx" ON "claims"("productName");

-- CreateIndex
CREATE UNIQUE INDEX "claims_productName_wording_market_key" ON "claims"("productName", "wording", "market");

-- CreateIndex
CREATE UNIQUE INDEX "assessments_fingerprint_key" ON "assessments"("fingerprint");

-- CreateIndex
CREATE INDEX "assessments_claimId_createdAt_idx" ON "assessments"("claimId", "createdAt");

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;
