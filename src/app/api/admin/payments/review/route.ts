
import { NextResponse } from "next/server";
import {
  CourseAccessType,
  CourseEnrollmentSource,
  CourseEnrollmentStatus,
  PaymentPurpose,
  PaymentStatus,
  UserRole,
} from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTelegramAlert, telegramTimestamp } from "@/lib/telegram";

export async function POST(request: Request) {
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

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
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
      { status: 400 }
    );
  }

  if (adminNote.length > 1000) {
    return NextResponse.json(
      { error: "Admin note is too long." },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        return {
          error: "Payment not found.",
          httpStatus: 404,
        } as const;
      }

      // Idempotency: already confirmed payments must not grant access twice.
      if (payment.status === PaymentStatus.CONFIRMED) {
        if (payment.purpose === PaymentPurpose.LIFETIME_MEMBERSHIP) {
          const entitlement = await tx.entitlement.findUnique({
            where: { paymentId: payment.id },
          });

          if (entitlement && !entitlement.revokedAt) {
            return {
              message: "This membership payment is already confirmed and access is active.",
              paymentId: payment.id,
              paymentStatus: payment.status,
            } as const;
          }
        }

        if (
          payment.purpose === PaymentPurpose.COURSE_PURCHASE &&
          payment.courseId
        ) {
          const enrollment = await tx.courseEnrollment.findUnique({
            where: { paymentId: payment.id },
          });

          if (
            enrollment &&
            enrollment.status !== CourseEnrollmentStatus.REVOKED
          ) {
            return {
              message: "This course payment is already confirmed and enrollment exists.",
              paymentId: payment.id,
              paymentStatus: payment.status,
            } as const;
          }
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

      // Rejection does not grant any access or rewards.
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

        return {
          payment: {
            id: payment.id,
            status: PaymentStatus.REJECTED,
          },
          message: "Payment rejected.",
        } as const;
      }

      // The amount is a snapshot stored when the payment was created.
      // Do not compare against today's configured membership/course price.
      if (
        payment.currency !== "INR" ||
        !payment.amount.gt(0)
      ) {
        return {
          error: "Payment amount or currency is invalid. Verify the payment details.",
          httpStatus: 409,
        } as const;
      }

      let courseTitle: string | null = null;

      // Validate individual course purchases before confirming.
      if (payment.purpose === PaymentPurpose.COURSE_PURCHASE) {
        if (!payment.courseId) {
          return {
            error: "Course purchase is missing its course reference.",
            httpStatus: 409,
          } as const;
        }

        const course = await tx.course.findUnique({
          where: { id: payment.courseId },
          select: {
            id: true,
            title: true,
            status: true,
            accessType: true,
          },
        });

        if (!course || course.status !== "PUBLISHED") {
          return {
            error: "The purchased course is unavailable or unpublished.",
            httpStatus: 409,
          } as const;
        }

        if (course.accessType !== CourseAccessType.PAID) {
          return {
            error: "This course is not configured for individual purchases.",
            httpStatus: 409,
          } as const;
        }

        courseTitle = course.title;

        const existingEnrollment = await tx.courseEnrollment.findUnique({
          where: {
            userId_courseId: {
              userId: payment.userId,
              courseId: course.id,
            },
          },
        });

        if (
          existingEnrollment &&
          existingEnrollment.status !== CourseEnrollmentStatus.REVOKED
        ) {
          return {
            error: "This learner already has an enrollment for this course.",
            httpStatus: 409,
          } as const;
        }
      } else if (payment.purpose === PaymentPurpose.LIFETIME_MEMBERSHIP) {
        const existingEntitlement = await tx.entitlement.findUnique({
          where: { userId: payment.userId },
        });

        if (existingEntitlement && !existingEntitlement.revokedAt) {
          return {
            error: "This learner already has active lifetime access.",
            httpStatus: 409,
          } as const;
        }
      } else {
        return {
          error: "Unsupported payment purpose.",
          httpStatus: 409,
        } as const;
      }

      // Atomically claim the payment for confirmation.
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

      const confirmedPayment = {
        id: payment.id,
        userId: payment.userId,
        status: PaymentStatus.CONFIRMED,
        purpose: payment.purpose,
        amount: payment.amount.toString(),
        currency: payment.currency,
      };

      // LIFETIME MEMBERSHIP: grant lifetime entitlement.
      if (payment.purpose === PaymentPurpose.LIFETIME_MEMBERSHIP) {
        const existingEntitlement = await tx.entitlement.findUnique({
          where: { userId: payment.userId },
        });

        if (existingEntitlement) {
          await tx.entitlement.update({
            where: { userId: payment.userId },
            data: {
              paymentId: payment.id,
              grantedAt: new Date(),
              revokedAt: null,
              reason: `Lifetime access granted after verified ${payment.amount.toString()} INR payment.`,
            },
          });
        } else {
          await tx.entitlement.create({
            data: {
              userId: payment.userId,
              paymentId: payment.id,
              reason: `Lifetime access granted after verified ${payment.amount.toString()} INR payment.`,
            },
          });
        }

        // Referral bonuses apply only to lifetime membership purchases.
        const learner = await tx.user.findUnique({
          where: { id: payment.userId },
          select: { referredById: true },
        });

        let referralPointsAwarded = false;
        let referralLimitReached = false;

        if (
          learner?.referredById &&
          learner.referredById !== payment.userId
        ) {
          const existingReferralReward = await tx.rewardLedger.findUnique({
            where: { referredUserId: payment.userId },
            select: { id: true },
          });

          if (!existingReferralReward) {
            await tx.$queryRaw`
              SELECT "id"
              FROM "User"
              WHERE "id" = ${learner.referredById}
              FOR UPDATE
            `;

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
                  description: `Reward for a referral's confirmed lifetime membership payment.`,
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
          payment: confirmedPayment,
          message: "Payment confirmed and lifetime entitlement granted.",
          referralPointsAwarded,
          referralLimitReached,
          notification: {
            userId: payment.userId,
            paymentId: payment.id,
            purpose: payment.purpose,
            amount: payment.amount.toString(),
            currency: payment.currency,
            courseTitle: null,
          },
        } as const;
      }

      // COURSE PURCHASE: create enrollment, never lifetime entitlement.
      if (payment.purpose === PaymentPurpose.COURSE_PURCHASE) {
        const existingEnrollment = await tx.courseEnrollment.findUnique({
          where: {
            userId_courseId: {
              userId: payment.userId,
              courseId: payment.courseId!,
            },
          },
        });

        if (existingEnrollment) {
          await tx.courseEnrollment.update({
            where: { id: existingEnrollment.id },
            data: {
              paymentId: payment.id,
              source: CourseEnrollmentSource.PURCHASE,
              status: CourseEnrollmentStatus.ACTIVE,
              enrolledAt: new Date(),
              completedAt: null,
              revokedAt: null,
            },
          });
        } else {
          await tx.courseEnrollment.create({
            data: {
              userId: payment.userId,
              courseId: payment.courseId!,
              paymentId: payment.id,
              source: CourseEnrollmentSource.PURCHASE,
              status: CourseEnrollmentStatus.ACTIVE,
            },
          });
        }

        return {
          payment: confirmedPayment,
          message: "Course payment confirmed and course enrollment activated.",
          notification: {
            userId: payment.userId,
            paymentId: payment.id,
            purpose: payment.purpose,
            amount: payment.amount.toString(),
            currency: payment.currency,
            courseTitle,
          },
        } as const;
      }

      return {
        error: "Unsupported payment purpose.",
        httpStatus: 409,
      } as const;
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.httpStatus }
      );
    }

    // Send notifications only after the database transaction succeeds.
    if ("notification" in result && result.notification) {
      const notification = result.notification;

      try {
        const learner = await prisma.user.findUnique({
          where: { id: notification.userId },
          select: {
            name: true,
            email: true,
            phoneE164: true,
          },
        });

        const isMembership =
          notification.purpose === PaymentPurpose.LIFETIME_MEMBERSHIP;

        void sendTelegramAlert([
          "ðŸ’³ DIGITAL WORLD â€” PAYMENT CONFIRMED",
          "",
          `Member: ${learner?.name || "Member"}`,
          `Mobile: ${learner?.phoneE164 || "Not available"}`,
          `Email: ${learner?.email || "Not provided"}`,
          `Amount: ${notification.amount} ${notification.currency}`,
          `Payment ID: ${notification.paymentId}`,
          `Purpose: ${isMembership ? "Lifetime Membership" : "Course Purchase"}`,
          ...(notification.courseTitle
            ? [`Course: ${notification.courseTitle}`]
            : []),
          `Access: ${isMembership ? "Lifetime access granted" : "Course enrollment activated"}`,
          `Time: ${telegramTimestamp()}`,
        ].join("\n"));

        if (
          "referralPointsAwarded" in result &&
          result.referralPointsAwarded
        ) {
          const reward = await prisma.rewardLedger.findUnique({
            where: { referredUserId: notification.userId },
            select: { points: true, userId: true },
          });

          if (reward) {
            const [sponsor, referredMember] = await Promise.all([
              prisma.user.findUnique({
                where: { id: reward.userId },
                select: { name: true },
              }),
              prisma.user.findUnique({
                where: { id: notification.userId },
                select: { name: true },
              }),
            ]);

            void sendTelegramAlert([
              "ðŸŽ DIGITAL WORLD â€” REFERRAL REWARD AWARDED",
              "",
              `Sponsor: ${sponsor?.name || "Member"}`,
              `Referred member: ${referredMember?.name || "Member"}`,
              `Reward points: ${reward.points}`,
              "Status: Awarded",
              `Payment ID: ${notification.paymentId}`,
              `Time: ${telegramTimestamp()}`,
            ].join("\n"));
          }
        }
      } catch {
        console.error("[Telegram] Could not prepare payment/reward alerts.");
      }

      const { notification: _notification, ...response } = result;
      return NextResponse.json(response);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin payment review failed:", error);

    return NextResponse.json(
      {
        error:
          "Unable to process payment. Check its current status and try again if appropriate.",
      },
      { status: 409 }
    );
  }
}

