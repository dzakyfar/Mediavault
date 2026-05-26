-- Extend existing role/status enums for marketplace payment flow.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ADMIN';
ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'PAID';
ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'DELIVERED';
ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'AUTO_COMPLETED';
ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'DISPUTED';

ALTER TABLE "Project" ADD COLUMN "deliveredAt" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN "autoReleaseAt" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN "completedAt" TIMESTAMP(3);

CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'FAILED');
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

CREATE TABLE "Offering" (
    "id" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "description" TEXT,
    "benefits" TEXT[] NOT NULL,
    "toolsSpec" TEXT,
    "capacityPersons" INTEGER,
    "relatedSpecs" TEXT[] NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offering_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "klikqrisOrderId" TEXT NOT NULL,
    "amountRequest" INTEGER NOT NULL,
    "amountPaid" INTEGER,
    "baseAmount" INTEGER NOT NULL,
    "adminFeeClient" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "qrisUrl" TEXT,
    "directUrl" TEXT,
    "signature" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "expiredAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "gatewayResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Wallet" (
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "Withdrawal" (
    "id" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "adminFee" INTEGER NOT NULL,
    "netAmount" INTEGER NOT NULL,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "accountName" TEXT,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Withdrawal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Payment_klikqrisOrderId_key" ON "Payment"("klikqrisOrderId");
CREATE INDEX "Offering_freelancerId_isActive_idx" ON "Offering"("freelancerId", "isActive");
CREATE INDEX "Payment_projectId_status_idx" ON "Payment"("projectId", "status");
CREATE INDEX "Withdrawal_freelancerId_status_idx" ON "Withdrawal"("freelancerId", "status");

ALTER TABLE "Offering" ADD CONSTRAINT "Offering_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
