import { NextResponse } from "next/server";
import { PaymentStatus, UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTelegramAlert, telegramTimestamp } from "@/lib/telegram";

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

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const input = body as Record<string, unknown>;
  const paymentId =
    typeof input.paymentId === "string" ? input.paymentId.trim() : "";
  const action = input.action;
  const adminNote =
    typeof input.adminNote === "string" ? input.adminNote.trim() : "";

  if (!paymentId || (action !== "confirm" && action !== "reject")) {
    return NextResponse.json(
      { error: "Provide a payment ID and action of confirm or reject." },
      { status: 400 },
    );
  }

  if (adminNote.length > 1000) {
    return NextResponse.json(
      { error: "Admin note is too long." },
      { status: 400 },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        return { error: "Payment not found.", httpStatus: 404 } as const;
      }

      if (payment.status === PaymentStatus.CONFIRMED) {
        const entitlement = await tx.entitlement.findUnique({
          where: { paymentId: payment.id },
        });

        if (entitlement && !entitlement.revokedAt) {
          return {
            message: "This payment is already confirmed and access is active.",
            paymentId: payment.id,
            paymentStatus: payment.status,
          } as const;
        }

        return {
          error: "This confirmed payment needs administrator attention.",
          httpStatus: 409,
        } as const;
      }

      if (payment.status !== PaymentStatus.UNDER_REVIEW) {
        return {
          error: "Only payments under review can be processed.",
          httpStatus: 409,
        } as const;
      }

      if (
        action === "confirm" &&
        (!payment.amount.equals(190) || payment.currency !== "INR")
      ) {
        return {
          error: "Payment amount or currency does not match the 190 INR price.",
          httpStatus: 409,
        } as const;
      }

      if (action === "reject") {
        const rejectedCount = await tx.payment.updateMany({
          where: {
            id: payment.id,
            status: PaymentStatus.UNDER_REVIEW,
          },
          data: {
            status: PaymentStatus.REJECTED,
            adminNote: adminNote || null,
            verifiedBy: admin.id,
            verifiedAt: new Date(),
          },
        });

        if (rejectedCount.count !== 1) {
          return {
            error: "This payment was already processed. Refresh and review its current status.",
            httpStatus: 409,
          } as const;
        }

        const rejected = { id: payment.id, status: PaymentStatus.REJECTED };
        return { payment: rejected, message: "Payment rejected." } as const;
      }

      const existingEntitlement = await tx.entitlement.findUnique({
        where: { userId: payment.userId },
      });

      if (existingEntitlement && !existingEntitlement.revokedAt) {
        return {
          error: "This learner already has active lifetime access.",
          httpStatus: 409,
        } as const;
      }

      const confirmedCount = await tx.payment.updateMany({
        where: {
          id: payment.id,
          status: PaymentStatus.UNDER_REVIEW,
        },
        data: {
          status: PaymentStatus.CONFIRMED,
          adminNote: adminNote || null,
          verifiedBy: admin.id,
          verifiedAt: new Date(),
        },
      });

      if (confirmedCount.count !== 1) {
        return {
          error: "This payment was already processed. Refresh and review its current status.",
          httpStatus: 409,
        } as const;
      }

      const confirmed = {
        id: payment.id,
        userId: payment.userId,
        status: PaymentStatus.CONFIRMED,
      };

      if (existingEntitlement) {
        await tx.entitlement.update({
          where: { userId: payment.userId },
          data: {
            paymentId: payment.id,
            grantedAt: new Date(),
            revokedAt: null,
            reason: "Lifetime access granted after verified 190 INR payment.",
          },
        });
      } else {
        await tx.entitlement.create({
          data: {
            userId: payment.userId,
            paymentId: payment.id,
            reason: "Lifetime access granted after verified 190 INR payment.",
          },
        });
      }

      // Award up to three referral bonuses per referring learner.
      // Lock the referrer's row so concurrent confirmations cannot exceed the cap.
      const learner = await tx.user.findUnique({
        where: { id: payment.userId },
        select: { referredById: true },
      });

      let referralPointsAwarded = false;
      let referralLimitReached = false;

      if (learner?.referredById && learner.referredById !== payment.userId) {
        const existingReferralReward = await tx.rewardLedger.findUnique({
          where: { referredUserId: payment.userId },
          select: { id: true },
        });

        if (!existingReferralReward) {
          // PostgreSQL row lock serializes reward-cap checks for this referrer.
          await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${learner.referredById} FOR UPDATE`;

          const successfulReferralRewards = await tx.rewardLedger.count({
            where: {
              userId: learner.referredById,
              type: "REFERRAL_BONUS",
            },
          });

          if (successfulReferralRewards < 3) {
            await tx.rewardLedger.create({
              data: {
                userId: learner.referredById,
                points: 100,
                type: "REFERRAL_BONUS",
                description: "Reward for a referral's confirmed 190 INR payment.",
                referredUserId: payment.userId,
                paymentId: payment.id,
              },
            });

            referralPointsAwarded = true;
          } else {
            referralLimitReached = true;
          }
        }
      }


      return {
        payment: confirmed,
        message: "Payment confirmed and lifetime entitlement granted.",
        referralPointsAwarded,
        referralLimitReached,
      } as const;
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.httpStatus },
      );
    }

    if ("payment" in result && result.payment && "userId" in result.payment && result.payment.status === PaymentStatus.CONFIRMED) {
      try {
        const learner = await prisma.user.findUnique({
          where: { id: result.payment.userId },
          select: { name: true, email: true, phoneE164: true },
        });

        void sendTelegramAlert([
          "💳 DIGITAL WORLD — PAYMENT CONFIRMED",
          "",
          `Member: ${learner?.name || "Member"}`,
          `Mobile: ${learner?.phoneE164 || "Not available"}`,
          `Email: ${learner?.email || "Not provided"}`,
          "Amount: 190 INR",
          `Payment ID: ${result.payment.id}`,
          "Status: Confirmed",
          "Access: Lifetime access granted",
          `Time: ${telegramTimestamp()}`,
        ].join("\n"));

        if ("referralPointsAwarded" in result && result.referralPointsAwarded) {
          const reward = await prisma.rewardLedger.findUnique({
            where: { referredUserId: result.payment.userId },
            select: { points: true, userId: true },
          });

          if (reward) {
            const [sponsor, referredMember] = await Promise.all([
              prisma.user.findUnique({
                where: { id: reward.userId },
                select: { name: true },
              }),
              prisma.user.findUnique({
                where: { id: result.payment.userId },
                select: { name: true },
              }),
            ]);

            void sendTelegramAlert([
              "🎁 DIGITAL WORLD — REFERRAL REWARD AWARDED",
              "",
              `Sponsor: ${sponsor?.name || "Member"}`,
              `Referred member: ${referredMember?.name || "Member"}`,
              `Reward points: ${reward.points}`,
              "Status: Awarded",
              `Payment ID: ${result.payment.id}`,
              `Time: ${telegramTimestamp()}`,
            ].join("\n"));
          }
        }
      } catch {
        console.error("[Telegram] Could not prepare payment/reward alerts.");
      }
    }

    return NextResponse.json(result);
  } catch {
    console.error("Admin payment review failed.");

    return NextResponse.json(
      {
        error:
          "Unable to process payment. Check its current status and try again if appropriate.",
      },
      { status: 409 },
    );
  }
}

