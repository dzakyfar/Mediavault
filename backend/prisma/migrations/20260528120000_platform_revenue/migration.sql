-- Platform revenue tracking: mencatat setiap fee admin yang masuk ke kas platform
CREATE TABLE "PlatformRevenue" (
    "id"            TEXT NOT NULL,
    "amount"        INTEGER NOT NULL,
    "sourceType"    TEXT NOT NULL,
    "referenceType" TEXT,
    "referenceId"   TEXT,
    "description"   TEXT NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformRevenue_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlatformRevenue_sourceType_createdAt_idx" ON "PlatformRevenue"("sourceType", "createdAt");
CREATE INDEX "PlatformRevenue_referenceType_referenceId_idx" ON "PlatformRevenue"("referenceType", "referenceId");
