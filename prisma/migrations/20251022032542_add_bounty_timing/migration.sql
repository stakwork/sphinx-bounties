/*
  Warnings:

  - You are about to drop the `bounty_comments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."bounty_comments" DROP CONSTRAINT "bounty_comments_authorPubkey_fkey";

-- DropForeignKey
ALTER TABLE "public"."bounty_comments" DROP CONSTRAINT "bounty_comments_bountyId_fkey";

-- AlterTable
ALTER TABLE "bounties" ADD COLUMN     "workClosedAt" TIMESTAMP(3),
ADD COLUMN     "workStartedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "public"."bounty_comments";
