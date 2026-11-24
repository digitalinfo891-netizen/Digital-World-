/*
  Warnings:

  - A unique constraint covering the columns `[conversionId]` on the table `RewardLedger` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "UsdtWithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- AlterEnum
ALTER TYPE "RewardLedgerType" ADD VALUE 'POINTS_TO_USDT';

-- AlterTable
ALTER TABLE "RewardLedger" ADD COLUMN     "conversionId" TEXT;

-- CreateTable
CREATE TABLE "UsdtWallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "network" TEXT NOT NULL DEFAULT 'BEP20',
    "address" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsdtWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardConversion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "pointsPerUsdt" INTEGER NOT NULL DEFAULT 100,
    "usdtAmount" DECIMAL(18,8) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardConversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsdtLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(18,8) NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "conversionId" TEXT,
    "withdrawalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsdtLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsdtWithdrawal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "network" TEXT NOT NULL DEFAULT 'BEP20',
    "amount" DECIMAL(18,8) NOT NULL,
    "status" "UsdtWithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "transactionHash" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsdtWithdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UsdtWallet_userId_key" ON "UsdtWallet"("userId");

-- CreateIndex
CREATE INDEX "UsdtWallet_address_idx" ON "UsdtWallet"("address");

-- CreateIndex
CREATE INDEX "RewardConversion_userId_createdAt_idx" ON "RewardConversion"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UsdtLedger_conversionId_key" ON "UsdtLedger"("conversionId");

-- CreateIndex
CREATE UNIQUE INDEX "UsdtLedger_withdrawalId_key" ON "UsdtLedger"("withdrawalId");

-- CreateIndex
CREATE INDEX "UsdtLedger_userId_createdAt_idx" ON "UsdtLedger"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UsdtWithdrawal_transactionHash_key" ON "UsdtWithdrawal"("transactionHash");

-- CreateIndex
CREATE INDEX "UsdtWithdrawal_userId_status_idx" ON "UsdtWithdrawal"("userId", "status");

-- CreateIndex
CREATE INDEX "UsdtWithdrawal_status_createdAt_idx" ON "UsdtWithdrawal"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RewardLedger_conversionId_key" ON "RewardLedger"("conversionId");

-- AddForeignKey
ALTER TABLE "UsdtWallet" ADD CONSTRAINT "UsdtWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardConversion" ADD CONSTRAINT "RewardConversion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsdtLedger" ADD CONSTRAINT "UsdtLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsdtWithdrawal" ADD CONSTRAINT "UsdtWithdrawal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
