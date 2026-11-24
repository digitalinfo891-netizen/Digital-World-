import { NextResponse } from "next/server";
import {
  Prisma,
  UsdtWithdrawalStatus,
} from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


const withdrawalSchema = z.object({
  amount: z
    .string()
    .trim()
    .regex(
      /^(?:0|[1-9]\d*)(?:\.\d{1,8})?$/,
      "Enter a valid USDT amount with up to 8 decimal places."
    )
    .max(32),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in first." },
        { status: 401 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const parsed = withdrawalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ??
            "Invalid withdrawal amount.",
        },
        { status: 400 }
      );
    }

    const amount = new Prisma.Decimal(parsed.data.amount);

    if (!amount.greaterThan(0)) {
      return NextResponse.json(
        { error: "Withdrawal amount must be greater than zero." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        // Serialize withdrawal requests for this user.
        await tx.$queryRaw`
          SELECT "id" FROM "User" WHERE "id" = ${user.id} FOR UPDATE
        `;

        const wallet = await tx.usdtWallet.findUnique({
          where: { userId: user.id },
          select: {
            address: true,
            network: true,
            isActive: true,
          },
        });

        if (!wallet || !wallet.isActive) {
          return {
            error: "Please save an active BEP20 wallet first.",
            httpStatus: 400,
          } as const;
        }

        const [ledger, reservedWithdrawals] = await Promise.all([
          tx.usdtLedger.aggregate({
            where: { userId: user.id },
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
        ]);

        const zero = new Prisma.Decimal(0);

        const ledgerBalance = ledger._sum.amount ?? zero;
        const reservedAmount =
          reservedWithdrawals._sum.amount ?? zero;

        const availableBalance = ledgerBalance.minus(reservedAmount);

        if (amount.greaterThan(availableBalance)) {
          return {
            error: "Insufficient available USDT balance.",
            availableBalance: availableBalance.toFixed(8),
            httpStatus: 409,
          } as const;
        }

        const withdrawal = await tx.usdtWithdrawal.create({
          data: {
            userId: user.id,
            walletAddress: wallet.address,
            network: "BEP20",
            amount,
            status: UsdtWithdrawalStatus.PENDING,
          },
          select: {
            id: true,
            walletAddress: true,
            network: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        });

        return {
          withdrawal: {
            ...withdrawal,
            amount: withdrawal.amount.toFixed(8),
          },
          message:
            "Withdrawal request submitted. It is awaiting admin review. No USDT has been transferred.",
        } as const;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10000,
        timeout: 15000,
      }
    );

    if ("error" in result) {
      return NextResponse.json(
        {
          error: result.error,
          ...("availableBalance" in result
            ? { availableBalance: result.availableBalance }
            : {}),
        },
        { status: result.httpStatus }
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("USDT withdrawal request failed:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        {
          error: "A concurrent wallet transaction occurred. Please retry.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Unable to submit USDT withdrawal request." },
      { status: 500 }
    );
  }
}
