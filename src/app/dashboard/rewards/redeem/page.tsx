import PageThemeToggle from "@/components/theme/PageThemeToggle";
import Link from "next/link";
import {
  RewardRedemptionStatus,
} from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import RewardRedemptionForm from "@/components/dashboard/RewardRedemptionForm";

export const instant = false;

function statusStyle(status: RewardRedemptionStatus) {
  switch (status) {
    case RewardRedemptionStatus.APPROVED:
      return "bg-blue-100 text-blue-800";
    case RewardRedemptionStatus.FULFILLED:
      return "bg-emerald-100 text-emerald-800";
    case RewardRedemptionStatus.REJECTED:
      return "bg-red-100 text-red-800";
    default:
      return "bg-amber-100 text-amber-800";
  }
}

export default async function RedeemRewardsPage() {
  const user = await requireUser();

  const [ledger, pending, redemptions] = await Promise.all([
    prisma.rewardLedger.aggregate({
      where: { userId: user.id },
      _sum: { points: true },
    }),
    prisma.rewardRedemption.aggregate({
      where: {
        userId: user.id,
        status: RewardRedemptionStatus.PENDING,
      },
      _sum: { points: true },
    }),
    prisma.rewardRedemption.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        points: true,
        benefit: true,
        note: true,
        status: true,
        adminNote: true,
        createdAt: true,
        reviewedAt: true,
      },
    }),
  ]);

  const availablePoints = Math.max(
    0,
    (ledger._sum.points ?? 0) - (pending._sum.points ?? 0),
  );

  return (
    <main className="dw-redeem-page min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <PageThemeToggle />

      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-emerald-700 hover:underline"
        >← Back to Dashboard</Link>

        <header className="mt-6 rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-700 to-teal-700 p-6 text-white shadow-lg sm:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-100">
            Digital World Rewards Programme
          </p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
            Redeem Your Rewards
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50">
            Use your earned reward points to request benefits. Your requests
            will be reviewed by an administrator.
          </p>
        </header>

        <div className="mt-8">
          <RewardRedemptionForm availablePoints={availablePoints} />
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                Account activity
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
                My Redemption History
              </h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
              {redemptions.length} requests
            </span>
          </div>

          {redemptions.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="font-bold text-slate-800">
                No redemption requests yet
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Your submitted requests will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {redemptions.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {item.benefit}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Requested: {item.createdAt.toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle(item.status)}`}>
                      {item.status.replaceAll("_", " ")}
                    </span>
                  </div>

                  <p className="mt-3 text-lg font-extrabold text-slate-800">
                    {item.points} points
                  </p>

                  {item.note && (
                    <p className="mt-2 text-sm text-slate-600">
                      Your note: {item.note}
                    </p>
                  )}

                  {item.adminNote && (
                    <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                      Administrator note: {item.adminNote}
                    </p>
                  )}

                  {item.reviewedAt && (
                    <p className="mt-2 text-xs text-slate-500">
                      Reviewed: {item.reviewedAt.toLocaleDateString("en-IN")}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}