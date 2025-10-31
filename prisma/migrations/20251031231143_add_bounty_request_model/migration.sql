-- CreateEnum
CREATE TYPE "BountyRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BountyActivityAction" ADD VALUE 'REQUESTED';
ALTER TYPE "BountyActivityAction" ADD VALUE 'REQUEST_APPROVED';
ALTER TYPE "BountyActivityAction" ADD VALUE 'REQUEST_REJECTED';

-- CreateTable
CREATE TABLE "bounty_requests" (
    "id" TEXT NOT NULL,
    "bountyId" TEXT NOT NULL,
    "requesterPubkey" VARCHAR(66) NOT NULL,
    "status" "BountyRequestStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "reviewedBy" VARCHAR(66),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bounty_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bounty_requests_bountyId_idx" ON "bounty_requests"("bountyId");

-- CreateIndex
CREATE INDEX "bounty_requests_requesterPubkey_idx" ON "bounty_requests"("requesterPubkey");

-- CreateIndex
CREATE INDEX "bounty_requests_status_idx" ON "bounty_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bounty_requests_bountyId_requesterPubkey_key" ON "bounty_requests"("bountyId", "requesterPubkey");

-- AddForeignKey
ALTER TABLE "bounty_requests" ADD CONSTRAINT "bounty_requests_bountyId_fkey" FOREIGN KEY ("bountyId") REFERENCES "bounties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bounty_requests" ADD CONSTRAINT "bounty_requests_requesterPubkey_fkey" FOREIGN KEY ("requesterPubkey") REFERENCES "users"("pubkey") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bounty_requests" ADD CONSTRAINT "bounty_requests_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("pubkey") ON DELETE RESTRICT ON UPDATE CASCADE;
