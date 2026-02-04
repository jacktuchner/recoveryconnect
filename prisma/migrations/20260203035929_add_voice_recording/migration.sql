-- CreateEnum
CREATE TYPE "TranscriptionStatus" AS ENUM ('NONE', 'PENDING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Recording" ADD COLUMN     "faqPromptId" TEXT,
ADD COLUMN     "transcription" TEXT,
ADD COLUMN     "transcriptionStatus" "TranscriptionStatus" NOT NULL DEFAULT 'NONE';

-- CreateTable
CREATE TABLE "FaqPrompt" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "category" "RecordingCategory" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FaqPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Recording_faqPromptId_idx" ON "Recording"("faqPromptId");

-- AddForeignKey
ALTER TABLE "Recording" ADD CONSTRAINT "Recording_faqPromptId_fkey" FOREIGN KEY ("faqPromptId") REFERENCES "FaqPrompt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
