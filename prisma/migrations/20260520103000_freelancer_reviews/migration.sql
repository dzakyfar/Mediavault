CREATE TABLE "FreelancerReview" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "freelancerId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "FreelancerReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FreelancerReview_projectId_key" ON "FreelancerReview"("projectId");
CREATE INDEX "FreelancerReview_freelancerId_createdAt_idx" ON "FreelancerReview"("freelancerId", "createdAt");

ALTER TABLE "FreelancerReview" ADD CONSTRAINT "FreelancerReview_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
