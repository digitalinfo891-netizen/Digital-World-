import { NextResponse } from "next/server";
import {
  Prisma,
  UserRole,
  UsdtWithdrawalStatus,
} from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


const schema = z.object({
  withdrawalId: z.string().trim().min(1).max(191),
  action: z.enum(["approve", "reject", "complete"]),
  adminNote: z.string().trim().max(1000).optional().default(""),
  transactionHash: z.string().trim().optional(),
});

const txHashPattern = /^0x[a-fA-F0-9]{64}$/;

export async function POST(request: Request) {
  try {
    const admin = await getCurrentUser();

    if (!admin) {
      return NextResponse.json(
        { error: "Please sign in first." },
        { status: 401 }
      );
    }

    if (
      admin.role !== UserRole.ADMIN &&
      admin.role !== UserRole.SUPER_ADMIN
    ) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
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

    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }

    const {
      withdrawalId,
      action,
      adminNote,
      transactionHash,
    } = parsed.data;

    if (
      action === "complete" &&
      (!transactionHash || !txHashPattern.test(transactionHash))
    ) {
      return NextResponse.json(
        { error: "A valid BEP20 transaction hash is required." },
        { status: 400 }
      );
    }

    if (action !== "complete" && transactionHash) {
      return NextResponse.json(
        { error: "Transaction hash is only accepted for completion." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`
          SELECT "id"
          FROM "UsdtWithdrawal"
          WHERE "id" = ${withdrawalId}
          FOR UPDATE
        `;

        const withdrawal = await tx.usdtWithdrawal.findUnique({
          where: { id: withdrawalId },
        });

        if (!withdrawal) {
          return {
            error: "Withdrawal request not found.",
            httpStatus: 404,
          } as const;
        }

        await tx.$queryRaw`
          SELECT "id"
          FROM "User"
          WHERE "id" = ${withdrawal.userId}
          FOR UPDATE
        `;

        const now = new Date();

        if (action === "approve") {
          if (withdrawal.status !== UsdtWithdrawalStatus.PENDING) {
            return {
              error: "Only pending withdrawals can be approved.",
              httpStatus: 409,
            } as const;
          }

          const updated = await tx.usdtWithdrawal.updateMany({
            where: {
              id: withdrawal.id,
              status: UsdtWithdrawalStatus.PENDING,
            },
            data: {
              status: UsdtWithdrawalStatus.APPROVED,
              adminNote: adminNote || null,
              reviewedBy: admin.id,
              reviewedAt: now,
            },
          });

          if (updated.count !== 1) {
            return {
              error: "Withdrawal was already processed.",
              httpStatus: 409,
            } as const;
          }

          await tx.auditLog.create({
            data: {
              actorId: admin.id,
              action: "USDT_WITHDRAWAL_APPROVED",
              entityType: "UsdtWithdrawal",
              entityId: withdrawal.id,
              metadata: {
                amount: withdrawal.amount.toFixed(8),
                network: withdrawal.network,
                walletAddress: withdrawal.walletAddress,
                adminNote: adminNote || null,
              },
            },
          });

          return {
            message: "Withdrawal approved. Manual transfer is pending.",
            withdrawalId: withdrawal.id,
            status: UsdtWithdrawalStatus.APPROVED,
          } as const;
        }

        if (action === "reject") {
          if (
            withdrawal.status !== UsdtWithdrawalStatus.PENDING &&
            withdrawal.status !== UsdtWithdrawalStatus.APPROVED
          ) {
            return {
              error: "Only pending or approved withdrawals can be rejected.",
              httpStatus: 409,
            } as const;
          }

          const updated = await tx.usdtWithdrawal.updateMany({
            where: {
              id: withdrawal.id,
              status: withdrawal.status,
            },
            data: {
              status: UsdtWithdrawalStatus.REJECTED,
              adminNote: adminNote || null,
              reviewedBy: admin.id,
              reviewedAt: now,
            },
          });

          if (updated.count !== 1) {
            return {
              error: "Withdrawal was already processed.",
              httpStatus: 409,
            } as const;
          }

          await tx.auditLog.create({
            data: {
              actorId: admin.id,
              action: "USDT_WITHDRAWAL_REJECTED",
              entityType: "UsdtWithdrawal",
              entityId: withdrawal.id,
              metadata: {
                amount: withdrawal.amount.toFixed(8),
                adminNote: adminNote || null,
              },
            },
          });

          return {
            message: "Withdrawal rejected. Reserved balance released.",
            withdrawalId: withdrawal.id,
            status: UsdtWithdrawalStatus.REJECTED,
          } as const;
        }

        if (withdrawal.status !== UsdtWithdrawalStatus.APPROVED) {
          return {
            error: "Only approved withdrawals can be completed.",
            httpStatus: 409,
          } as const;
        }

        if (withdrawal.network !== "BEP20") {
          return {
            error: "Withdrawal network must be BEP20.",
            httpStatus: 409,
          } as const;
        }

        const updated = await tx.usdtWithdrawal.updateMany({
          where: {
            id: withdrawal.id,
            status: UsdtWithdrawalStatus.APPROVED,
          },
          data: {
            status: UsdtWithdrawalStatus.COMPLETED,
            transactionHash: transactionHash!,
            completedAt: now,
            adminNote: adminNote || null,
            reviewedBy: admin.id,
            reviewedAt: now,
          },
        });

        if (updated.count !== 1) {
          return {
            error: "Withdrawal was already processed.",
            httpStatus: 409,
          } as const;
        }

        const ledgerEntry = await tx.usdtLedger.create({
          data: {
            userId: withdrawal.userId,
            amount: withdrawal.amount.negated(),
            type: "DEBIT_WITHDRAWAL",
            description: "USDT withdrawal completed through manual BEP20 transfer.",
            withdrawalId: withdrawal.id,
          },
        });

        await tx.auditLog.create({
          data: {
            actorId: admin.id,
            action: "USDT_WITHDRAWAL_COMPLETED",
            entityType: "UsdtWithdrawal",
            entityId: withdrawal.id,
            metadata: {
              amount: withdrawal.amount.toFixed(8),
              network: withdrawal.network,
              walletAddress: withdrawal.walletAddress,
              transactionHash: transactionHash!,
              ledgerEntryId: ledgerEntry.id,
              adminNote: adminNote || null,
            },
          },
        });

        return {
          message: "Withdrawal completed and ledger debit recorded.",
          withdrawalId: withdrawal.id,
          status: UsdtWithdrawalStatus.COMPLETED,
          transactionHash: transactionHash!,
          amount: withdrawal.amount.toFixed(8),
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
        { error: result.error },
        { status: result.httpStatus }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin USDT withdrawal review failed:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2034" || error.code === "P2002")
    ) {
      return NextResponse.json(
        { error: "Concurrent transaction or duplicate transaction hash. Please refresh." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Unable to process USDT withdrawal review." },
      { status: 500 }
    );
  }
}
