/*
  Warnings:

  - You are about to alter the column `amount` on the `bounties` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `satsAmount` on the `connection_codes` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `amount` on the `invoices` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `amount` on the `transactions` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `totalBudget` on the `workspace_budgets` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `availableBudget` on the `workspace_budgets` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `reservedBudget` on the `workspace_budgets` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `paidBudget` on the `workspace_budgets` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "bounties" ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "connection_codes" ALTER COLUMN "satsAmount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "invoices" ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "workspace_budgets" ALTER COLUMN "totalBudget" SET DATA TYPE INTEGER,
ALTER COLUMN "availableBudget" SET DATA TYPE INTEGER,
ALTER COLUMN "reservedBudget" SET DATA TYPE INTEGER,
ALTER COLUMN "paidBudget" SET DATA TYPE INTEGER;
