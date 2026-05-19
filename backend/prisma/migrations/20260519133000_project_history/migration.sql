CREATE TABLE "ProjectHistory" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "actorId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "eventType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectHistory_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ProjectHistory" ADD CONSTRAINT "ProjectHistory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
