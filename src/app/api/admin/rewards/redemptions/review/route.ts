import { NextResponse } from "next/server";
import {
  RewardLedgerType,
  RewardRedemptionStatus,
  UserRole,
} from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const reviewSchema = z.object({
  redemptionId: z.string().min(1),
  action: z.enum(["approve", "reject", "fulfill"]),
  adminNote: z.string().trim().max(1000).optional(),
});

export async function POST(request: Request) {
  const admin = await getCurrentUser();

  if (!admin) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  if (
    admin.role !== UserRole.ADMIN &&
    admin.role !== UserRole.SUPER_ADMIN
  ) {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const parsed = reviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Provide a valid redemption ID and review action." },
      { status: 400 },
    );
  }

  const { redemptionId, action, adminNote } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const redemption = await tx.rewardRedemption.findUnique({
        where: { id: redemptionId },
        select: {
          id: true,
          userId: true,
          points: true,
          benefit: true,
          status: true,
        },
      });

      if (!redemption) {
        return {
          error: "Redemption request not found.",
          httpStatus: 404,
        } as const;
      }

      // Lock the learner row to serialize reviews for this learner.
      await tx.$queryRaw`
        SELECT "id" FROM "User" WHERE "id" = ${redemption.userId} FOR UPDATE
      `;

      if (action === "approve") {
        if (redemption.status !== RewardRedemptionStatus.PENDING) {
          return {
            error: "Only pending requests can be approved.",
            httpStatus: 409,
          } as const;
        }

        // Recheck the ledger after accounting for other pending reservations.
        const [ledger, pending] = await Promise.all([
          tx.rewardLedger.aggregate({
            where: { userId: redemption.userId },
            _sum: { points: true },
          }),
          tx.rewardRedemption.aggregate({
            where: {
              userId: redemption.userId,
              status: RewardRedemptionStatus.PENDING,
            },
            _sum: { points: true },
          }),
        ]);

        const ledgerBalance = ledger._sum.points ?? 0;
        const pendingPoints = pending._sum.points ?? 0;
        const otherReservations = pendingPoints - redemption.points;
        const availableForApproval = ledgerBalance - otherReservations;

        if (availableForApproval < redemption.points) {
          return {
            error: "The learner no longer has sufficient points for this approval.",
            httpStatus: 409,
          } as const;
        }

        const changed = await tx.rewardRedemption.updateMany({
          where: {
            id: redemption.id,
            status: RewardRedemptionStatus.PENDING,
          },
          data: {
            status: RewardRedemptionStatus.APPROVED,
            adminNote: adminNote || null,
            reviewedBy: admin.id,
            reviewedAt: new Date(),
          },
        });

        if (changed.count !== 1) {
          return {
            error: "This request was already processed. Refresh and try again.",
            httpStatus: 409,
          } as const;
        }

        await tx.rewardLedger.create({
          data: {
            userId: redemption.userId,
            points: -redemption.points,
            type: RewardLedgerType.REDEMPTION,
            description: `Approved redemption: ${redemption.benefit}`,
            redemptionId: redemption.id,
          },
        });

        return {
          message: "Redemption approved and points deducted.",
          status: RewardRedemptionStatus.APPROVED,
          redemptionId: redemption.id,
        } as const;
      }

      if (action === "reject") {
        if (redemption.status !== RewardRedemptionStatus.PENDING) {
          return {
            error: "Only pending requests can be rejected.",
            httpStatus: 409,
          } as const;
        }

        const changed = await tx.rewardRedemption.updateMany({
          where: {
            id: redemption.id,
            status: RewardRedemptionStatus.PENDING,
          },
          data: {
            status: RewardRedemptionStatus.REJECTED,
            adminNote: adminNote || null,
            reviewedBy: admin.id,
            reviewedAt: new Date(),
          },
        });

        if (changed.count !== 1) {
          return {
            error: "This request was already processed. Refresh and try again.",
            httpStatus: 409,
          } as const;
        }

        return {
          message: "Redemption rejected. Reserved points are released.",
          status: RewardRedemptionStatus.REJECTED,
          redemptionId: redemption.id,
        } as const;
      }

      if (redemption.status !== RewardRedemptionStatus.APPROVED) {
        return {
          error: "Only approved requests can be marked fulfilled.",
          httpStatus: 409,
        } as const;
      }

      const fulfilled = await tx.rewardRedemption.updateMany({
        where: {
          id: redemption.id,
          status: RewardRedemptionStatus.APPROVED,
        },
        data: {
          status: RewardRedemptionStatus.FULFILLED,
          adminNote: adminNote || undefined,
          reviewedBy: admin.id,
          reviewedAt: new Date(),
        },
      });

      if (fulfilled.count !== 1) {
        return {
          error: "This request was already processed. Refresh and try again.",
          httpStatus: 409,
        } as const;
      }

      return {
        message: "Redemption marked as fulfilled.",
        status: RewardRedemptionStatus.FULFILLED,
        redemptionId: redemption.id,
      } as const;
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.httpStatus },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin redemption review failed:", error);

    return NextResponse.json(
      { error: "Unable to process this redemption request." },
      { status: 500 },
    );
  }
}