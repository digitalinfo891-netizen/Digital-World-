import { NextResponse } from "next/server";
import {
  Prisma,
  RewardLedgerType,
  RewardRedemptionStatus,
} from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


const POINTS_PER_USDT = 100;

const conversionSchema = z.object({
  points: z.number().int().min(100).max(1000000),
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

    const parsed = conversionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter a valid conversion amount of at least 100 points." },
        { status: 400 }
      );
    }

    const { points } = parsed.data;

    if (points % POINTS_PER_USDT !== 0) {
      return NextResponse.json(
        { error: "Points must be converted in multiples of 100." },
        { status: 400 }
      );
    }

    const usdtAmount = new Prisma.Decimal(points).div(POINTS_PER_USDT);

    const result = await prisma.$transaction(
      async (tx) => {
        // Serialize financial operations for this user.
        await tx.$queryRaw`
          SELECT "id" FROM "User" WHERE "id" = ${user.id} FOR UPDATE
        `;

        const [ledger, pendingRedemptions] = await Promise.all([
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

        const ledgerBalance = ledger._sum.points ?? 0;
        const reservedPoints = pendingRedemptions._sum.points ?? 0;
        const availablePoints = ledgerBalance - reservedPoints;

        if (points > availablePoints) {
          return {
            error: "Insufficient available reward points.",
            availablePoints: Math.max(0, availablePoints),
            httpStatus: 409,
          } as const;
        }

        // Record the conversion.
        const conversion = await tx.rewardConversion.create({
          data: {
            userId: user.id,
            points,
            pointsPerUsdt: POINTS_PER_USDT,
            usdtAmount,
            status: "COMPLETED",
          },
        });

        // Debit reward points exactly once.
        await tx.rewardLedger.create({
          data: {
            userId: user.id,
            points: -points,
            type: RewardLedgerType.POINTS_TO_USDT,
            description: `Converted ${points} reward points into ${usdtAmount.toFixed(8)} USDT.`,
            conversionId: conversion.id,
          },
        });

        // Credit the USDT ledger.
        await tx.usdtLedger.create({
          data: {
            userId: user.id,
            amount: usdtAmount,
            type: "CREDIT_CONVERSION",
            description: `USDT credited from ${points} reward points.`,
            conversionId: conversion.id,
          },
        });

        return {
          conversionId: conversion.id,
          pointsConverted: points,
          usdtCredited: usdtAmount.toFixed(8),
          availablePoints: availablePoints - points,
          message: "Reward points successfully converted into USDT.",
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
          availablePoints: result.availablePoints,
        },
        { status: result.httpStatus }
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("USDT points conversion failed:", error);

    return NextResponse.json(
      { error: "Unable to convert reward points into USDT." },
      { status: 500 }
    );
  }
}