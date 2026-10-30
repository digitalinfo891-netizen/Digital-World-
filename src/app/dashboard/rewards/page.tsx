import Link from "next/link";
import ReferralMemberCard from "@/components/dashboard/ReferralMemberCard";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function RewardsPage() {
  const user = await requireUser();

  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { referralCode: true },
  });

  const referralCode = currentUser?.referralCode ?? null;

  const downlineMembers: Array<{
    id: string;
    name: string;
    createdAt: Date;
    level: number;
  }> = [];

  const visitedDownlineIds = new Set<string>([user.id]);
  let frontierIds: string[] = [user.id];

  for (let level = 1; level <= 6 && frontierIds.length > 0; level++) {
    const children = await prisma.user.findMany({
      where: { referredById: { in: frontierIds } },
      select: { id: true, name: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const nextFrontier: string[] = [];

    for (const child of children) {
      if (visitedDownlineIds.has(child.id)) continue;

      visitedDownlineIds.add(child.id);
      nextFrontier.push(child.id);
      downlineMembers.push({ ...child, level });
    }

    frontierIds = nextFrontier;
  }

  const downlineLevels = Array.from(
    new Set(downlineMembers.map((member) => member.level)),
  ).sort((a, b) => a - b);

  const [totalReferrals, successfulReferrals] = await Promise.all([
    prisma.user.count({
      where: { referredById: user.id },
    }),
    prisma.rewardLedger.count({
      where: { userId: user.id, type: "REFERRAL_BONUS" },
    }),
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/dashboard"
        className="text-sm font-semibold text-emerald-700 hover:underline"
      >
        â† Back to Dashboard
      </Link>

      <header className="mt-6 rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-700 to-teal-700 p-6 text-white shadow-lg sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-100">
          Digital World Referral Programme
        </p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
          Invite &amp; Earn
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50 sm:text-base">
          View your referral network, downline levels, and referral progress.
        </p>
      </header>
<section className="mt-8 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                Referral network
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
                My Downline Pyramid
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                View the learners connected to your referral network. The pyramid
                shows up to six levels beneath your account.
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                Total downline
              </p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-900">
                {downlineMembers.length}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Direct referrals</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">
                {totalReferrals}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Downline levels</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">
                {downlineLevels.length} / 6
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-800">Successful rewarded referrals</p>
              <p className="mt-1 text-2xl font-extrabold text-amber-900">
                {Math.min(successfulReferrals, 3)} / 3
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div className="flex justify-center">
              <div className="w-full max-w-xs rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 text-center shadow-sm">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-lg font-bold text-white">
                  Y
                </div>
                <p className="mt-2 font-extrabold text-emerald-950">
                  Your referral network root account
                </p>
                <p className="mt-1 break-all text-xs text-emerald-800">
                  {referralCode ?? "Referral code unavailable"}
                </p>
              </div>
            </div>

            {downlineLevels.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="font-bold text-slate-800">Your downline starts here</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Share your referral link to bring in your first learner.
                  New members will appear here after registration.
                </p>
              </div>
            ) : (
              downlineLevels.map((level) => {
                const membersAtLevel = downlineMembers.filter(
                  (member) => member.level === level,
                );

                return (
                  <details
                    key={level}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-300"
                  >
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 transition hover:bg-emerald-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 sm:px-5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-sm font-extrabold text-emerald-800">
                        {level}
                      </span>

                      <span className="flex-1 text-sm font-extrabold uppercase tracking-wide text-slate-700">
                        Level {level}
                      </span>

                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                        {membersAtLevel.length} members
                      </span>

                      <span
                        aria-hidden="true"
                        className="text-lg font-bold text-emerald-700 transition-transform group-open:rotate-180"
                      >
                        ⌄
                      </span>
                    </summary>

                    <div className="border-t border-slate-100 bg-slate-50/60 p-3 sm:p-4">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {membersAtLevel.map((member) => (
                          <ReferralMemberCard key={member.id} member={member} />
                        ))}
                      </div>
                    </div>
                  </details>
                );
              })
            )}
          </div>

          <p className="mt-5 text-xs leading-5 text-slate-500">
            Registration and reward eligibility are separate. Only eligible 190 INR
            payments confirmed by an administrator qualify for referral rewards.
            The reward limit applies to your own successful referrals, not the total
            number of members in your downline.
          </p>
        </section>
    </main>
  );
}