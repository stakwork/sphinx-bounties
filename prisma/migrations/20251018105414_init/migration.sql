-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'CONTRIBUTOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "BountyStatus" AS ENUM ('DRAFT', 'OPEN', 'ASSIGNED', 'IN_REVIEW', 'COMPLETED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProofStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CHANGES_REQUESTED');

-- CreateEnum
CREATE TYPE "BountyActivityAction" AS ENUM ('CREATED', 'UPDATED', 'ASSIGNED', 'UNASSIGNED', 'PROOF_SUBMITTED', 'PROOF_REVIEWED', 'COMPLETED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProgrammingLanguage" AS ENUM ('TYPESCRIPT', 'JAVASCRIPT', 'PYTHON', 'RUST', 'GO', 'JAVA', 'CSHARP', 'CPP', 'C', 'RUBY', 'PHP', 'SWIFT', 'KOTLIN', 'SOLIDITY', 'REACT', 'VUE', 'ANGULAR', 'NEXTJS', 'NUXTJS', 'SVELTE', 'NODEJS', 'DJANGO', 'FLASK', 'RAILS', 'LARAVEL', 'DOTNET', 'SPRING', 'EXPRESS', 'NESTJS', 'OTHER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'PAYMENT', 'REFUND', 'STAKE', 'STAKE_RETURN');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BOUNTY_ASSIGNED', 'BOUNTY_COMPLETED', 'PAYMENT_RECEIVED', 'PROOF_REVIEWED', 'WORKSPACE_INVITE', 'MEMBER_ADDED', 'MEMBER_REMOVED');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "WorkspaceActivityAction" AS ENUM ('MEMBER_ADDED', 'MEMBER_REMOVED', 'ROLE_CHANGED', 'BUDGET_DEPOSITED', 'BUDGET_WITHDRAWN', 'SETTINGS_UPDATED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "pubkey" VARCHAR(66) NOT NULL,
    "username" VARCHAR(20) NOT NULL,
    "alias" VARCHAR(50),
    "description" TEXT,
    "avatarUrl" VARCHAR(2048),
    "contactKey" VARCHAR(66),
    "routeHint" TEXT,
    "githubUsername" VARCHAR(50),
    "githubVerified" BOOLEAN NOT NULL DEFAULT false,
    "twitterUsername" VARCHAR(50),
    "twitterVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "ownerPubkey" VARCHAR(66) NOT NULL,
    "description" VARCHAR(120),
    "mission" TEXT,
    "avatarUrl" VARCHAR(2048),
    "websiteUrl" VARCHAR(2048),
    "githubUrl" VARCHAR(2048),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userPubkey" VARCHAR(66) NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'CONTRIBUTOR',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bounties" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "creatorPubkey" VARCHAR(66) NOT NULL,
    "assigneePubkey" VARCHAR(66),
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "deliverables" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "status" "BountyStatus" NOT NULL DEFAULT 'DRAFT',
    "codingLanguages" "ProgrammingLanguage"[],
    "tags" TEXT[],
    "estimatedHours" INTEGER,
    "estimatedCompletionDate" TIMESTAMP(3),
    "githubIssueUrl" VARCHAR(2048),
    "loomVideoUrl" VARCHAR(2048),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assignedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "bounties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bounty_proofs" (
    "id" TEXT NOT NULL,
    "bountyId" TEXT NOT NULL,
    "submittedByPubkey" VARCHAR(66) NOT NULL,
    "description" TEXT NOT NULL,
    "proofUrl" VARCHAR(2048) NOT NULL,
    "status" "ProofStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "reviewedByPubkey" VARCHAR(66),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bounty_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bounty_activities" (
    "id" TEXT NOT NULL,
    "bountyId" TEXT NOT NULL,
    "userPubkey" VARCHAR(66) NOT NULL,
    "action" "BountyActivityAction" NOT NULL,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bounty_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_budgets" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "totalBudget" BIGINT NOT NULL DEFAULT 0,
    "availableBudget" BIGINT NOT NULL DEFAULT 0,
    "reservedBudget" BIGINT NOT NULL DEFAULT 0,
    "paidBudget" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "bountyId" TEXT,
    "type" "TransactionType" NOT NULL,
    "amount" BIGINT NOT NULL,
    "fromUserPubkey" VARCHAR(66),
    "toUserPubkey" VARCHAR(66),
    "lightningInvoice" TEXT,
    "paymentHash" VARCHAR(64),
    "preimage" VARCHAR(64),
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "memo" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "paymentRequest" TEXT NOT NULL,
    "paymentHash" VARCHAR(64) NOT NULL,
    "amount" BIGINT NOT NULL,
    "memo" TEXT,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connection_codes" (
    "id" TEXT NOT NULL,
    "connectionString" VARCHAR(100) NOT NULL,
    "creatorPubkey" VARCHAR(66) NOT NULL,
    "routeHint" TEXT,
    "satsAmount" BIGINT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedByPubkey" VARCHAR(66),
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connection_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_invites" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "inviterPubkey" VARCHAR(66) NOT NULL,
    "inviteePubkey" VARCHAR(66) NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'CONTRIBUTOR',
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "workspace_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userPubkey" VARCHAR(66) NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "relatedEntityType" VARCHAR(50),
    "relatedEntityId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_activities" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userPubkey" VARCHAR(66) NOT NULL,
    "action" "WorkspaceActivityAction" NOT NULL,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_pubkey_key" ON "users"("pubkey");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_pubkey_idx" ON "users"("pubkey");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_name_key" ON "workspaces"("name");

-- CreateIndex
CREATE INDEX "workspaces_name_idx" ON "workspaces"("name");

-- CreateIndex
CREATE INDEX "workspaces_ownerPubkey_idx" ON "workspaces"("ownerPubkey");

-- CreateIndex
CREATE INDEX "workspaces_deletedAt_idx" ON "workspaces"("deletedAt");

-- CreateIndex
CREATE INDEX "workspace_members_workspaceId_idx" ON "workspace_members"("workspaceId");

-- CreateIndex
CREATE INDEX "workspace_members_userPubkey_idx" ON "workspace_members"("userPubkey");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_workspaceId_userPubkey_key" ON "workspace_members"("workspaceId", "userPubkey");

-- CreateIndex
CREATE INDEX "bounties_workspaceId_idx" ON "bounties"("workspaceId");

-- CreateIndex
CREATE INDEX "bounties_creatorPubkey_idx" ON "bounties"("creatorPubkey");

-- CreateIndex
CREATE INDEX "bounties_assigneePubkey_idx" ON "bounties"("assigneePubkey");

-- CreateIndex
CREATE INDEX "bounties_status_idx" ON "bounties"("status");

-- CreateIndex
CREATE INDEX "bounties_deletedAt_idx" ON "bounties"("deletedAt");

-- CreateIndex
CREATE INDEX "bounties_workspaceId_status_idx" ON "bounties"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "bounties_assigneePubkey_status_idx" ON "bounties"("assigneePubkey", "status");

-- CreateIndex
CREATE INDEX "bounty_proofs_bountyId_idx" ON "bounty_proofs"("bountyId");

-- CreateIndex
CREATE INDEX "bounty_proofs_submittedByPubkey_idx" ON "bounty_proofs"("submittedByPubkey");

-- CreateIndex
CREATE INDEX "bounty_proofs_status_idx" ON "bounty_proofs"("status");

-- CreateIndex
CREATE INDEX "bounty_activities_bountyId_idx" ON "bounty_activities"("bountyId");

-- CreateIndex
CREATE INDEX "bounty_activities_bountyId_timestamp_idx" ON "bounty_activities"("bountyId", "timestamp" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "workspace_budgets_workspaceId_key" ON "workspace_budgets"("workspaceId");

-- CreateIndex
CREATE INDEX "workspace_budgets_workspaceId_idx" ON "workspace_budgets"("workspaceId");

-- CreateIndex
CREATE INDEX "transactions_workspaceId_idx" ON "transactions"("workspaceId");

-- CreateIndex
CREATE INDEX "transactions_bountyId_idx" ON "transactions"("bountyId");

-- CreateIndex
CREATE INDEX "transactions_paymentHash_idx" ON "transactions"("paymentHash");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_workspaceId_type_status_idx" ON "transactions"("workspaceId", "type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_transactionId_key" ON "invoices"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_paymentRequest_key" ON "invoices"("paymentRequest");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_paymentHash_key" ON "invoices"("paymentHash");

-- CreateIndex
CREATE INDEX "invoices_workspaceId_idx" ON "invoices"("workspaceId");

-- CreateIndex
CREATE INDEX "invoices_paymentRequest_idx" ON "invoices"("paymentRequest");

-- CreateIndex
CREATE INDEX "invoices_paymentHash_idx" ON "invoices"("paymentHash");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE UNIQUE INDEX "connection_codes_connectionString_key" ON "connection_codes"("connectionString");

-- CreateIndex
CREATE INDEX "connection_codes_connectionString_idx" ON "connection_codes"("connectionString");

-- CreateIndex
CREATE INDEX "connection_codes_creatorPubkey_idx" ON "connection_codes"("creatorPubkey");

-- CreateIndex
CREATE INDEX "connection_codes_isUsed_idx" ON "connection_codes"("isUsed");

-- CreateIndex
CREATE INDEX "workspace_invites_workspaceId_idx" ON "workspace_invites"("workspaceId");

-- CreateIndex
CREATE INDEX "workspace_invites_inviteePubkey_idx" ON "workspace_invites"("inviteePubkey");

-- CreateIndex
CREATE INDEX "workspace_invites_status_idx" ON "workspace_invites"("status");

-- CreateIndex
CREATE INDEX "notifications_userPubkey_idx" ON "notifications"("userPubkey");

-- CreateIndex
CREATE INDEX "notifications_read_idx" ON "notifications"("read");

-- CreateIndex
CREATE INDEX "notifications_userPubkey_read_createdAt_idx" ON "notifications"("userPubkey", "read", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "workspace_activities_workspaceId_idx" ON "workspace_activities"("workspaceId");

-- CreateIndex
CREATE INDEX "workspace_activities_workspaceId_timestamp_idx" ON "workspace_activities"("workspaceId", "timestamp" DESC);

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_ownerPubkey_fkey" FOREIGN KEY ("ownerPubkey") REFERENCES "users"("pubkey") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_userPubkey_fkey" FOREIGN KEY ("userPubkey") REFERENCES "users"("pubkey") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bounties" ADD CONSTRAINT "bounties_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bounties" ADD CONSTRAINT "bounties_creatorPubkey_fkey" FOREIGN KEY ("creatorPubkey") REFERENCES "users"("pubkey") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bounties" ADD CONSTRAINT "bounties_assigneePubkey_fkey" FOREIGN KEY ("assigneePubkey") REFERENCES "users"("pubkey") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bounty_proofs" ADD CONSTRAINT "bounty_proofs_bountyId_fkey" FOREIGN KEY ("bountyId") REFERENCES "bounties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bounty_proofs" ADD CONSTRAINT "bounty_proofs_submittedByPubkey_fkey" FOREIGN KEY ("submittedByPubkey") REFERENCES "users"("pubkey") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bounty_proofs" ADD CONSTRAINT "bounty_proofs_reviewedByPubkey_fkey" FOREIGN KEY ("reviewedByPubkey") REFERENCES "users"("pubkey") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bounty_activities" ADD CONSTRAINT "bounty_activities_bountyId_fkey" FOREIGN KEY ("bountyId") REFERENCES "bounties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bounty_activities" ADD CONSTRAINT "bounty_activities_userPubkey_fkey" FOREIGN KEY ("userPubkey") REFERENCES "users"("pubkey") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_budgets" ADD CONSTRAINT "workspace_budgets_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_bountyId_fkey" FOREIGN KEY ("bountyId") REFERENCES "bounties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_fromUserPubkey_fkey" FOREIGN KEY ("fromUserPubkey") REFERENCES "users"("pubkey") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_toUserPubkey_fkey" FOREIGN KEY ("toUserPubkey") REFERENCES "users"("pubkey") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_codes" ADD CONSTRAINT "connection_codes_creatorPubkey_fkey" FOREIGN KEY ("creatorPubkey") REFERENCES "users"("pubkey") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_codes" ADD CONSTRAINT "connection_codes_usedByPubkey_fkey" FOREIGN KEY ("usedByPubkey") REFERENCES "users"("pubkey") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_invites" ADD CONSTRAINT "workspace_invites_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_invites" ADD CONSTRAINT "workspace_invites_inviterPubkey_fkey" FOREIGN KEY ("inviterPubkey") REFERENCES "users"("pubkey") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userPubkey_fkey" FOREIGN KEY ("userPubkey") REFERENCES "users"("pubkey") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_activities" ADD CONSTRAINT "workspace_activities_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_activities" ADD CONSTRAINT "workspace_activities_userPubkey_fkey" FOREIGN KEY ("userPubkey") REFERENCES "users"("pubkey") ON DELETE RESTRICT ON UPDATE CASCADE;
