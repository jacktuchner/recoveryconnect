-- Safety & Content Moderation Tables
-- Run this in Supabase SQL Editor

-- Report status enum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');

-- Report table for user-submitted content reports
CREATE TABLE "Report" (
  "id" TEXT PRIMARY KEY,
  "reporterId" TEXT NOT NULL REFERENCES "User"("id"),
  "contentType" TEXT NOT NULL, -- 'recording', 'call', 'review'
  "contentId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "details" TEXT,
  "status" "ReportStatus" DEFAULT 'PENDING',
  "reviewedBy" TEXT REFERENCES "User"("id"),
  "reviewedAt" TIMESTAMP,
  "reviewNotes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Content flag status enum
CREATE TYPE "ContentFlagStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- ContentFlag table for automated keyword-based flagging
CREATE TABLE "ContentFlag" (
  "id" TEXT PRIMARY KEY,
  "recordingId" TEXT NOT NULL REFERENCES "Recording"("id") ON DELETE CASCADE,
  "flagType" TEXT NOT NULL, -- 'medical_directive', 'dosage', 'contradict_doctor', etc.
  "flaggedText" TEXT NOT NULL, -- The text that triggered the flag
  "context" TEXT, -- Surrounding context
  "status" "ContentFlagStatus" DEFAULT 'PENDING',
  "reviewedBy" TEXT REFERENCES "User"("id"),
  "reviewedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX "Report_status_idx" ON "Report"("status");
CREATE INDEX "Report_contentType_contentId_idx" ON "Report"("contentType", "contentId");
CREATE INDEX "ContentFlag_recordingId_idx" ON "ContentFlag"("recordingId");
CREATE INDEX "ContentFlag_status_idx" ON "ContentFlag"("status");

-- Row Level Security
ALTER TABLE "Report" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContentFlag" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to Report" ON "Report" FOR ALL USING (true);
CREATE POLICY "Service role has full access to ContentFlag" ON "ContentFlag" FOR ALL USING (true);
