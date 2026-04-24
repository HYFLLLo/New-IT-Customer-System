-- AddEvaluationModels
CREATE TABLE "EvaluationDataset" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "version" VARCHAR(50) NOT NULL DEFAULT 'v1.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EvaluationDataset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EvaluationItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "datasetId" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "category" VARCHAR(255) NOT NULL,
    "subcategory" VARCHAR(255) NOT NULL,
    "difficulty" VARCHAR(50) NOT NULL,
    "questionType" VARCHAR(50) NOT NULL,
    "expectedKeyPoints" TEXT NOT NULL,
    "sourceDoc" VARCHAR(255) NOT NULL,
    "sourceSection" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EvaluationItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EvaluationResult" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "itemId" UUID NOT NULL,
    "runId" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "accuracyScore" DOUBLE PRECISION NOT NULL,
    "relevanceScore" DOUBLE PRECISION NOT NULL,
    "completenessScore" DOUBLE PRECISION NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "retrievalScore" DOUBLE PRECISION NOT NULL,
    "answerQualityScore" DOUBLE PRECISION NOT NULL,
    "coverageScore" DOUBLE PRECISION NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EvaluationResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EvaluationRun" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "datasetId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "runType" VARCHAR(50) NOT NULL,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "avgScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgLatencyMs" INTEGER NOT NULL DEFAULT 0,
    "passRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EvaluationRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RealtimeCheckLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sessionId" VARCHAR(255) NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "failReasons" TEXT,
    "latencyMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RealtimeCheckLog_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "EvaluationItem" ADD CONSTRAINT "EvaluationItem_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "EvaluationDataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EvaluationResult" ADD CONSTRAINT "EvaluationResult_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "EvaluationItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EvaluationResult" ADD CONSTRAINT "EvaluationResult_runId_fkey" FOREIGN KEY ("runId") REFERENCES "EvaluationRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EvaluationRun" ADD CONSTRAINT "EvaluationRun_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "EvaluationDataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX "EvaluationItem_datasetId_idx" ON "EvaluationItem"("datasetId");
CREATE INDEX "EvaluationResult_itemId_idx" ON "EvaluationResult"("itemId");
CREATE INDEX "EvaluationResult_runId_idx" ON "EvaluationResult"("runId");
CREATE INDEX "EvaluationRun_datasetId_idx" ON "EvaluationRun"("datasetId");
CREATE INDEX "RealtimeCheckLog_sessionId_idx" ON "RealtimeCheckLog"("sessionId");