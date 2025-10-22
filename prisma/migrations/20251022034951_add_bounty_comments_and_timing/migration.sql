-- CreateTable
CREATE TABLE "bounty_comments" (
    "id" TEXT NOT NULL,
    "bountyId" TEXT NOT NULL,
    "authorPubkey" VARCHAR(66) NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "bounty_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bounty_comments_bountyId_idx" ON "bounty_comments"("bountyId");

-- CreateIndex
CREATE INDEX "bounty_comments_authorPubkey_idx" ON "bounty_comments"("authorPubkey");

-- CreateIndex
CREATE INDEX "bounty_comments_bountyId_createdAt_idx" ON "bounty_comments"("bountyId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "bounty_comments_deletedAt_idx" ON "bounty_comments"("deletedAt");

-- AddForeignKey
ALTER TABLE "bounty_comments" ADD CONSTRAINT "bounty_comments_bountyId_fkey" FOREIGN KEY ("bountyId") REFERENCES "bounties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bounty_comments" ADD CONSTRAINT "bounty_comments_authorPubkey_fkey" FOREIGN KEY ("authorPubkey") REFERENCES "users"("pubkey") ON DELETE RESTRICT ON UPDATE CASCADE;
