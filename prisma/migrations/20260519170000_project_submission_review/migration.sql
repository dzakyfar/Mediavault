CREATE TYPE "ProjectSubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REVISION_REQUESTED');

CREATE TABLE "ProjectSubmission" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "freelancerId" TEXT NOT NULL,
  "comment" TEXT NOT NULL,
  "fileUrl" TEXT,
  "fileName" TEXT,
  "fileType" TEXT,
  "fileSize" INTEGER,
  "status" "ProjectSubmissionStatus" NOT NULL DEFAULT 'PENDING',
  "reviewComment" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProjectSubmission_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ProjectSubmission" ADD CONSTRAINT "ProjectSubmission_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "ProjectSubmission_projectId_createdAt_idx" ON "ProjectSubmission"("projectId", "createdAt");
