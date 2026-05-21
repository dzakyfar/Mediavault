ALTER TABLE "Project" ADD COLUMN "serviceType" TEXT;
ALTER TABLE "Project" ADD COLUMN "address" TEXT;
ALTER TABLE "Project" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "Project" ADD COLUMN "longitude" DOUBLE PRECISION;
ALTER TABLE "Project" ADD COLUMN "locationSource" TEXT;
ALTER TABLE "Project" ADD COLUMN "eventDate" TIMESTAMP(3);
ALTER TABLE "ProjectApplication" ADD COLUMN "serviceType" TEXT;
