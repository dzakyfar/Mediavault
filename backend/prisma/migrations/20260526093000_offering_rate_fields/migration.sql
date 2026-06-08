ALTER TABLE "Offering" ADD COLUMN "serviceType" TEXT;
ALTER TABLE "Offering" ADD COLUMN "ratePerHour" INTEGER;
ALTER TABLE "Offering" ADD COLUMN "ratePerPhoto" INTEGER;
ALTER TABLE "Offering" ADD COLUMN "extraPersonFee" INTEGER;
ALTER TABLE "Offering" ADD COLUMN "estimatedHours" INTEGER NOT NULL DEFAULT 2;

UPDATE "Offering"
SET "serviceType" = COALESCE(NULLIF("relatedSpecs"[1], ''), "title"),
    "ratePerHour" = "price",
    "extraPersonFee" = 0
WHERE "serviceType" IS NULL;
