-- CreateTable
CREATE TABLE "auth_challenges" (
    "id" TEXT NOT NULL,
    "k1" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "auth_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_challenges_k1_key" ON "auth_challenges"("k1");

-- CreateIndex
CREATE INDEX "auth_challenges_k1_idx" ON "auth_challenges"("k1");

-- CreateIndex
CREATE INDEX "auth_challenges_expiresAt_idx" ON "auth_challenges"("expiresAt");
