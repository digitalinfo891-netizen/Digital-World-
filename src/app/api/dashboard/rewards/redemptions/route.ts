import { NextResponse } from "next/server";
import { RewardRedemptionStatus } from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const requestSchema = z.object({
  points: z.number().int().positive().max(100000),
  benefit: z.string().trim().min(3).max(120),
  note: z.string().trim().max(1000).optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
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

  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid points amount and benefit description." },
      { status: 400 },
    );
  }

  const { points, benefit, note } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Serialize redemption submissions and administrative adjustments
      // for this learner.
      await tx.$queryRaw`
        SELECT "id" FROM "User" WHERE "id" = ${user.id} FOR UPDATE
      `;

      const [ledger, pending] = await Promise.all([
        tx.rewardLedger.aggregate({
          where: { userId: user.id },
          _sum: { points: true },
        }),
        tx.rewardRedemption.aggregate({
          where: {
            userId: user.id,
            status: RewardRedemptionStatus.PENDING,
          },
          _sum: { points: true },
        }),
      ]);

      const earnedAndAdjusted = ledger._sum.points ?? 0;
      const reserved = pending._sum.points ?? 0;
      const available = earnedAndAdjusted - reserved;

      if (points > available) {
        return {
          error: "Insufficient available points.",
          availablePoints: available,
          httpStatus: 409,
        } as const;
      }

      const redemption = await tx.rewardRedemption.create({
        data: {
          userId: user.id,
          points,
          benefit,
          note: note || null,
          status: RewardRedemptionStatus.PENDING,
        },
        select: {
          id: true,
          points: true,
          benefit: true,
          note: true,
          status: true,
          createdAt: true,
        },
      });

      return {
        redemption,
        availablePoints: available - points,
        message: "Redemption request submitted successfully.",
      } as const;
    });

    if ("error" in result) {
      return NextResponse.json(
        {
          error: result.error,
          availablePoints: result.availablePoints,
        },
        { status: result.httpStatus },
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Reward redemption submission failed:", error);

    return NextResponse.json(
      { error: "Unable to submit your redemption request." },
      { status: 500 },
    );
  }
}