-- New users start in client mode and are not listed as freelancers until onboarding is completed.
ALTER TABLE "User" ALTER COLUMN "isAvailable" SET DEFAULT false;
