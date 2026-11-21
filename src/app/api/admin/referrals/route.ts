import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


const PAGE_SIZE = 25;

type ReferralStatus = "PENDING" | "REWARDED" | "LIMIT_REACHED" | "REVIEW_NEEDED";

type ReferralRow = {
  learnerId: string;
  learnerName: string;
  learnerEmail: string | null;
  learnerPhone: string | null;
  learnerCreatedAt: Date;
  referrerId: string;
  referrerName: string;
  referrerEmail: string | null;
  referrerCode: string | null;
  confirmedPaymentAt: Date | null;
  rewardId: string | null;
  rewardPoints: number | null;
  rewardCreatedAt: Date | null;
  referrerRewardCount: number;
  status: ReferralStatus;
};

type CountRow = { total: number; pending: number; rewarded: number; limitReached: number; reviewNeeded: number };

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const search = (params.get("search") || "").trim().slice(0, 120);
    const requestedStatus = (params.get("status") || "ALL").toUpperCase();
    const allowedStatuses = ["ALL", "PENDING", "REWARDED", "LIMIT_REACHED", "REVIEW_NEEDED"];
    const status = allowedStatuses.includes(requestedStatus) ? requestedStatus : "ALL";
    const requestedPage = Number.parseInt(params.get("page") || "1", 10);
    const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const offset = (page - 1) * PAGE_SIZE;

    const referrals = await prisma.$queryRaw<ReferralRow[]>`
      WITH referral_base AS (
        SELECT
          learner."id" AS "learnerId",
          learner."name" AS "learnerName",
          learner."email" AS "learnerEmail",
          learner."phoneE164" AS "learnerPhone",
          learner."createdAt" AS "learnerCreatedAt",
          referrer."id" AS "referrerId",
          referrer."name" AS "referrerName",
          referrer."email" AS "referrerEmail",
          referrer."referralCode" AS "referrerCode",
          (SELECT MIN(payment."createdAt") FROM "Payment" payment WHERE payment."userId" = learner."id" AND payment."status" = 'CONFIRMED' AND EXISTS (SELECT 1 FROM "Entitlement" ent WHERE ent."paymentId" = payment."id")) AS "confirmedPaymentAt",
          reward."id" AS "rewardId",
          reward."points" AS "rewardPoints",
          reward."createdAt" AS "rewardCreatedAt",
          (SELECT COUNT(*)::int FROM "RewardLedger" ledger_count WHERE ledger_count."userId" = referrer."id" AND ledger_count."type" = 'REFERRAL_BONUS') AS "referrerRewardCount"
        FROM "User" learner
        INNER JOIN "User" referrer ON referrer."id" = learner."referredById"
        LEFT JOIN "RewardLedger" reward ON reward."referredUserId" = learner."id" AND reward."type" = 'REFERRAL_BONUS'
      ),
      classified AS (
        SELECT *, CASE
          WHEN "rewardId" IS NOT NULL THEN 'REWARDED'
          WHEN "confirmedPaymentAt" IS NULL THEN 'PENDING'
          WHEN "referrerRewardCount" >= 3 THEN 'LIMIT_REACHED'
          ELSE 'REVIEW_NEEDED'
        END AS "status"
        FROM referral_base
      )
      SELECT * FROM classified
      WHERE (${status} = 'ALL' OR "status" = ${status})
        AND (${search} = '' OR "learnerName" ILIKE '%' || ${search} || '%' OR COALESCE("learnerEmail", '') ILIKE '%' || ${search} || '%' OR COALESCE("learnerPhone", '') ILIKE '%' || ${search} || '%' OR "referrerName" ILIKE '%' || ${search} || '%' OR COALESCE("referrerEmail", '') ILIKE '%' || ${search} || '%' OR COALESCE("referrerCode", '') ILIKE '%' || ${search} || '%')
      ORDER BY "learnerCreatedAt" DESC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `;

    const countRows = await prisma.$queryRaw<CountRow[]>`
      WITH referral_base AS (
        SELECT
          learner."id" AS "learnerId",
          learner."name" AS "learnerName",
          learner."email" AS "learnerEmail",
          learner."phoneE164" AS "learnerPhone",
          referrer."name" AS "referrerName",
          referrer."email" AS "referrerEmail",
          referrer."referralCode" AS "referrerCode",
          (SELECT MIN(payment."createdAt") FROM "Payment" payment WHERE payment."userId" = learner."id" AND payment."status" = 'CONFIRMED' AND EXISTS (SELECT 1 FROM "Entitlement" ent WHERE ent."paymentId" = payment."id")) AS "confirmedPaymentAt",
          reward."id" AS "rewardId",
          (SELECT COUNT(*)::int FROM "RewardLedger" ledger_count WHERE ledger_count."userId" = referrer."id" AND ledger_count."type" = 'REFERRAL_BONUS') AS "referrerRewardCount"
        FROM "User" learner
        INNER JOIN "User" referrer ON referrer."id" = learner."referredById"
        LEFT JOIN "RewardLedger" reward ON reward."referredUserId" = learner."id" AND reward."type" = 'REFERRAL_BONUS'
      ),
      classified AS (
        SELECT *, CASE
          WHEN "rewardId" IS NOT NULL THEN 'REWARDED'
          WHEN "confirmedPaymentAt" IS NULL THEN 'PENDING'
          WHEN "referrerRewardCount" >= 3 THEN 'LIMIT_REACHED'
          ELSE 'REVIEW_NEEDED'
        END AS "status"
        FROM referral_base
      )
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE "status" = 'PENDING')::int AS pending,
        COUNT(*) FILTER (WHERE "status" = 'REWARDED')::int AS rewarded,
        COUNT(*) FILTER (WHERE "status" = 'LIMIT_REACHED')::int AS "limitReached",
        COUNT(*) FILTER (WHERE "status" = 'REVIEW_NEEDED')::int AS "reviewNeeded"
      FROM classified
      WHERE (${search} = '' OR "learnerName" ILIKE '%' || ${search} || '%' OR COALESCE("learnerEmail", '') ILIKE '%' || ${search} || '%' OR COALESCE("learnerPhone", '') ILIKE '%' || ${search} || '%' OR "referrerName" ILIKE '%' || ${search} || '%' OR COALESCE("referrerEmail", '') ILIKE '%' || ${search} || '%' OR COALESCE("referrerCode", '') ILIKE '%' || ${search} || '%')
    `;

    const total = countRows[0]?.total ?? 0;

    return NextResponse.json({
      referrals,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
      counts: {
        total,
        pending: countRows[0]?.pending ?? 0,
        rewarded: countRows[0]?.rewarded ?? 0,
        limitReached: countRows[0]?.limitReached ?? 0,
        reviewNeeded: countRows[0]?.reviewNeeded ?? 0,
      },
    });
  } catch (error) {
    console.error("Admin referrals GET error:", error);
    return NextResponse.json({ error: "Unable to load referrals." }, { status: 500 });
  }
}
