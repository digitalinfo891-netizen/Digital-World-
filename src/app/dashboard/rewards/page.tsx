import Link from "next/link";
import {
  RewardLedgerType,
  RewardRedemptionStatus,
} from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const instant = false;

function statusStyle(status: RewardRedemptionStatus) {
  switch (status) {
    case RewardRedemptionStatus.APPROVED:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200";
    case RewardRedemptionStatus.FULFILLED:
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200";
    case RewardRedemptionStatus.REJECTED:
      return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200";
    default:
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200";
  }
}

function formatPoints(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

export default async function RewardsPage() {
  const user = await requireUser();

  const [
    ledgerBalance,
    creditedPoints,
    referralBonus,
    redemptionDebits,
    pendingPoints,
    pendingCount,
    ledgerHistory,
    redemptions,
  ] = await Promise.all([
    prisma.rewardLedger.aggregate({
      where: { userId: user.id },
      _sum: { points: true },
    }),

    prisma.rewardLedger.aggregate({
      where: { userId: user.id, points: { gt: 0 } },
      _sum: { points: true },
    }),

    prisma.rewardLedger.aggregate({
      where: {
        userId: user.id,
        type: RewardLedgerType.REFERRAL_BONUS,
      },
      _sum: { points: true },
    }),

    prisma.rewardLedger.aggregate({
      where: {
        userId: user.id,
        type: RewardLedgerType.REDEMPTION,
      },
      _sum: { points: true },
    }),

    prisma.rewardRedemption.aggregate({
      where: {
        userId: user.id,
        status: RewardRedemptionStatus.PENDING,
      },
      _sum: { points: true },
    }),

    prisma.rewardRedemption.count({
      where: {
        userId: user.id,
        status: RewardRedemptionStatus.PENDING,
      },
    }),

    prisma.rewardLedger.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        points: true,
        type: true,
        description: true,
        createdAt: true,
      },
    }),

    prisma.rewardRedemption.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        points: true,
        benefit: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
        adminNote: true,
      },
    }),
  ]);

  const ledgerTotal = ledgerBalance._sum.points ?? 0;
  const reservedPoints = pendingPoints._sum.points ?? 0;
  const availablePoints = Math.max(0, ledgerTotal - reservedPoints);
  const totalCredited = creditedPoints._sum.points ?? 0;
  const referralPoints = referralBonus._sum.points ?? 0;
  const totalRedeemed = Math.abs(redemptionDebits._sum.points ?? 0);

  return (
    <main className="dw-rewards-wallet min-h-screen w-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-7">

        <header className="overflow-hidden rounded-3xl border border-violet-300/30 bg-gradient-to-br from-indigo-700 via-blue-700 to-violet-700 p-6 text-white shadow-xl sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
            Digital World Rewards Programme
          </p>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            My Rewards
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
            Track your reward points, review your transactions, and manage
            your redemption requests.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/rewards/redeem"
              className="inline-flex items-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-900 shadow transition hover:bg-blue-50"
            >
              Redeem My Points
            </Link>
          </div>
        </header>

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Rewards Overview
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Your actual points balance and reward account summary.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-950/60">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                Available points
              </p>
              <p className="mt-2 text-3xl font-extrabold text-blue-950 dark:text-white">
                {formatPoints(availablePoints)}
              </p>
              <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                After pending redemption reservations
              </p>
            </article>

            <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950/60">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                Total points credited
              </p>
              <p className="mt-2 text-3xl font-extrabold text-emerald-950 dark:text-white">
                {formatPoints(totalCredited)}
              </p>
              <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
                All positive ledger entries
              </p>
            </article>

            <article className="rounded-2xl border border-violet-200 bg-violet-50 p-5 dark:border-violet-800 dark:bg-violet-950/60">
              <p className="text-sm font-semibold text-violet-800 dark:text-violet-200">
                Referral bonus points
              </p>
              <p className="mt-2 text-3xl font-extrabold text-violet-950 dark:text-white">
                {formatPoints(referralPoints)}
              </p>
              <p className="mt-2 text-xs text-violet-700 dark:text-violet-300">
                Recorded referral bonuses
              </p>
            </article>

            <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/60">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                Points redeemed
              </p>
              <p className="mt-2 text-3xl font-extrabold text-amber-950 dark:text-white">
                {formatPoints(totalRedeemed)}
              </p>
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                Recorded redemption deductions
              </p>
            </article>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Pending redemption requests
            </p>
            <p className="mt-2 text-3xl font-extrabold text-slate-950 dark:text-white">
              {pendingCount}
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {formatPoints(reservedPoints)} points currently reserved
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Ledger balance before pending requests
            </p>
            <p className="mt-2 text-3xl font-extrabold text-slate-950 dark:text-white">
              {formatPoints(ledgerTotal)}
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Net balance from recorded reward transactions
            </p>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Reward Transaction History
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Credits, referral bonuses, redemptions, and adjustments.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Latest {ledgerHistory.length} transactions
            </span>
          </div>

          {ledgerHistory.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800">
              <p className="font-bold text-slate-800 dark:text-white">
                No reward transactions yet
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Your reward credits and deductions will appear here when
                transactions are recorded.
              </p>
            </div>
          ) : (
            <div className="mt-5 divide-y divide-slate-200 dark:divide-slate-700">
              {ledgerHistory.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {item.description}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {item.type.replaceAll("_", " ")} ·{" "}
                      {item.createdAt.toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <span className={`shrink-0 text-lg font-extrabold ${
                    item.points >= 0
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-red-700 dark:text-red-300"
                  }`}>
                    {item.points > 0 ? "+" : ""}
                    {formatPoints(item.points)} pts
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Redemption Requests
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Follow the status of your requested benefits.
              </p>
            </div>
            <Link
              href="/dashboard/rewards/redeem"
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
            >
              New Request
            </Link>
          </div>

          {redemptions.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800">
              <p className="font-bold text-slate-800 dark:text-white">
                No redemption requests yet
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Your submitted redemption requests will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {redemptions.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">
                        {item.benefit}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Requested: {item.createdAt.toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle(item.status)}`}>
                      {item.status.replaceAll("_", " ")}
                    </span>
                  </div>

                  <p className="mt-3 text-lg font-extrabold text-slate-800 dark:text-slate-100">
                    {formatPoints(item.points)} points
                  </p>

                  {item.adminNote && (
                    <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      Administrator note: {item.adminNote}
                    </p>
                  )}

                  {item.reviewedAt && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Reviewed: {item.reviewedAt.toLocaleDateString("en-IN")}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/inviteandearn"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
          >
            Go to Invite &amp; Earn
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
          >
            Back to Dashboard
          </Link>
        </div>

      </div>
    </main>
  );
}