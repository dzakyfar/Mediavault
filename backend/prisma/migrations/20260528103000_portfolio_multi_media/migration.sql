-- Allow one portfolio item/title to contain multiple media assets.
CREATE TABLE "PortfolioMedia" (
    "id" TEXT NOT NULL,
    "portfolioItemId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioMedia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PortfolioMedia_portfolioItemId_sortOrder_idx" ON "PortfolioMedia"("portfolioItemId", "sortOrder");

ALTER TABLE "PortfolioMedia"
ADD CONSTRAINT "PortfolioMedia_portfolioItemId_fkey"
FOREIGN KEY ("portfolioItemId") REFERENCES "PortfolioItem"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "PortfolioMedia" ("id", "portfolioItemId", "fileUrl", "fileName", "fileType", "fileSize", "sortOrder", "createdAt")
SELECT
  'legacy_' || "id",
  "id",
  "fileUrl",
  "fileName",
  "fileType",
  "fileSize",
  0,
  "createdAt"
FROM "PortfolioItem"
WHERE "fileUrl" IS NOT NULL AND "fileUrl" <> '';
