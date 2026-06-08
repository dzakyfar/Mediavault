ALTER TABLE "User"
ADD COLUMN "telegramChatId" TEXT,
ADD COLUMN "telegramUsername" TEXT,
ADD COLUMN "telegramNotifyEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "telegramLinkedAt" TIMESTAMP(3),
ADD COLUMN "telegramConnectToken" TEXT,
ADD COLUMN "telegramConnectExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_telegramConnectToken_key" ON "User"("telegramConnectToken");
