import { NextResponse } from "next/server";
import {
  Prisma,
  UsdtWithdrawalStatus,
} from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in first." },
        { status: 401 }
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const [
          ledger,
          positiveLedger,
          completedWithdrawals,
          reservedWithdrawals,
          wallet,
          conversions,
          withdrawals,
        ] = await Promise.all([
          tx.usdtLedger.aggregate({
            where: { userId: user.id },
            _sum: { amount: true },
          }),

          tx.usdtLedger.aggregate({
            where: {
              userId: user.id,
              amount: { gt: new Prisma.Decimal(0) },
            },
            _sum: { amount: true },
          }),

          tx.usdtWithdrawal.aggregate({
            where: {
              userId: user.id,
              status: UsdtWithdrawalStatus.COMPLETED,
            },
            _sum: { amount: true },
          }),

          tx.usdtWithdrawal.aggregate({
            where: {
              userId: user.id,
              status: {
                in: [
                  UsdtWithdrawalStatus.PENDING,
                  UsdtWithdrawalStatus.APPROVED,
                ],
              },
            },
            _sum: { amount: true },
          }),

          tx.usdtWallet.findUnique({
            where: { userId: user.id },
            select: {
              network: true,
              address: true,
              isActive: true,
            },
          }),

          tx.rewardConversion.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true,
              points: true,
              pointsPerUsdt: true,
              usdtAmount: true,
              status: true,
              createdAt: true,
            },
          }),

          tx.usdtWithdrawal.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true,
              walletAddress: true,
              network: true,
              amount: true,
              status: true,
              adminNote: true,
              transactionHash: true,
              completedAt: true,
              createdAt: true,
              updatedAt: true,
            },
          }),
        ]);

        const zero = new Prisma.Decimal(0);

        const ledgerBalance = ledger._sum.amount ?? zero;
        const totalCredited = positiveLedger._sum.amount ?? zero;
        const totalWithdrawn =
          completedWithdrawals._sum.amount ?? zero;
        const reservedAmount = reservedWithdrawals._sum.amount ?? zero;

        const availableBalance = ledgerBalance.minus(reservedAmount);

        return {
          network: "BEP20",
          wallet,
          balance: {
            totalCredited: totalCredited.toFixed(8),
            totalWithdrawn: totalWithdrawn.toFixed(8),
            pendingAndApprovedWithdrawals: reservedAmount.toFixed(8),
            ledgerBalance: ledgerBalance.toFixed(8),
            availableBalance: availableBalance.toFixed(8),
          },
          conversions: conversions.map((item) => ({
            ...item,
            usdtAmount: item.usdtAmount.toFixed(8),
          })),
          withdrawals: withdrawals.map((item) => ({
            ...item,
            amount: item.amount.toFixed(8),
          })),
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
        maxWait: 10000,
        timeout: 15000,
      }
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("USDT balance retrieval failed:", error);

    return NextResponse.json(
      { error: "Unable to retrieve USDT wallet balance." },
      { status: 500 }
    );
  }
}