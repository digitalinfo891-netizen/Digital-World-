import Link from "next/link";
import { randomBytes } from "node:crypto";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/auth/LogoutButton";
import ReferralLinkActions from "@/components/dashboard/ReferralLinkActions";
import ReferralMemberCard from "@/components/dashboard/ReferralMemberCard";
export const instant = false;

export default async function DashboardPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  const [entitlement, latestPayment] = await Promise.all([
    prisma.entitlement.findUnique({
      where: { userId: user.id },
      select: { revokedAt: true },
    }),
    prisma.payment.findFirst({
      where: { userId: user.id, currency: "INR" },
      orderBy: { createdAt: "desc" },
      select: { status: true, amount: true, currency: true },
    }),
  ]);

  // Ensure existing accounts also have a unique referral code.
  let referralCode: string | null = null;

  for (let attempt = 0; attempt < 5 && !referralCode; attempt++) {
    const current = await prisma.user.findUnique({
      where: { id: user.id },
      select: { referralCode: true },
    });

    if (current?.referralCode) {
      referralCode = current.referralCode;
      break;
    }

    const candidate = `DR${randomBytes(5).toString("hex").toUpperCase()}`;

    try {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { referralCode: candidate },
        select: { referralCode: true },
      });
      referralCode = updated.referralCode;
    } catch {
      // A unique-code collision can be retried.
    }
  }

  // Build the signed-in user's referral downline, up to six levels.
  // Track visited IDs to prevent duplicate members or accidental cycles.
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
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
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

  const [
    totalReferrals,
    successfulReferrals,
    rewardBalance,
    recentRewards,
    recentRedemptions,
  ] = await Promise.all([
    prisma.user.count({
      where: { referredById: user.id },
    }),
    prisma.rewardLedger.count({
      where: { userId: user.id, type: "REFERRAL_BONUS" },
    }),
    prisma.rewardLedger.aggregate({
      where: { userId: user.id },
      _sum: { points: true },
    }),
    prisma.rewardLedger.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
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
      take: 5,
      select: {
        id: true,
        points: true,
        benefit: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  const availablePoints = rewardBalance._sum.points ?? 0;
  const referralUrl = referralCode
    ? `/register?ref=${encodeURIComponent(referralCode)}`
    : "/register";

  const hasAccess = Boolean(entitlement && !entitlement.revokedAt);
  const paymentStatus = hasAccess
    ? "Lifetime access active"
    : latestPayment
      ? latestPayment.status.replaceAll("_", " ")
      : "No payment started";

  const statusColor = hasAccess
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : latestPayment?.status === "UNDER_REVIEW"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : latestPayment?.status === "CONFIRMED"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-slate-200 bg-slate-50 text-slate-700";

  const cardClass = "flex h-[260px] min-w-0 flex-col overflow-y-auto rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-emerald-50/40 to-slate-50 p-5 text-slate-900 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl [&_h3]:text-base [&_h3]:font-bold [&_p]:leading-5";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="text-lg font-extrabold tracking-tight text-emerald-800 sm:text-xl">
            DIGITAL <span className="text-slate-900">ROJGAR</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            {isAdmin && (
              <Link href="/admin/payments" className="rounded-lg border border-emerald-700 px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-50 sm:px-4 sm:text-sm">
                Payment Verification
              </Link>
            )}
            <LogoutButton />
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <section
          className="overflow-hidden rounded-3xl p-6 text-white shadow-xl sm:p-10 lg:p-12"
          style={{
            background: "linear-gradient(120deg, #064e3b 0%, #047857 55%, #0f766e 100%)",
          }}
        >
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-100 sm:text-sm">
                Your learning workspace
              </p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                Welcome, {user.name}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-emerald-50 sm:text-base">
                Learn new skills, track your journey, and keep your account
                and payment information in one place.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/payment" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-emerald-900 shadow-md transition hover:bg-emerald-50">
                  {hasAccess ? "View Access Status" : "Payment & Access"}
                </Link>
                <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/50 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                  Visit Website
                </Link>
              </div>
            </div>

            <div className="min-w-48 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm text-emerald-100">Account type</p>
              <p className="mt-2 text-xl font-bold">
                {isAdmin ? "Administrator" : "Learner"}
              </p>
              <div className="mt-4 border-t border-white/20 pt-4">
                <p className="text-sm text-emerald-100">Access status</p>
                <p className="mt-1 font-semibold">
                  {hasAccess ? "Active" : "Awaiting access"}
                </p>
              </div>
            </div>
          </div>
        

        <section className="mt-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                Your workspace
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Quick access to your learning and account tools.
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
              {user.role.replaceAll("_", " ")}
            </span>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article className={`${cardClass} !bg-gradient-to-br !from-emerald-50 !to-white`} style={{ background: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)" }}>
              <h3 className="mt-5 text-lg font-bold">My Courses</h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
                Find your learning content as courses become available.
              </p>
              <span className="mt-4 inline-block text-xs font-semibold text-slate-400">Learning library</span>
            </article>

            <article className={`${cardClass} !bg-gradient-to-br !from-sky-50 !to-white`} style={{ background: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)" }}>
              <h3 className="mt-5 text-lg font-bold">Learning Progress</h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
                Your lesson, quiz, and project tracking workspace.
              </p>
              <span className="mt-4 inline-block text-xs font-semibold text-slate-400">Progress tracking</span>
            </article>

            <article className={`${cardClass} !bg-gradient-to-br !from-violet-50 !to-white`} style={{ background: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)" }}>
              <h3 className="mt-5 text-lg font-bold">My Account</h3>
              <p className="mt-2 break-words text-sm leading-6 text-slate-600">{user.email}</p>
              <p className="mt-3 text-xs text-slate-500">Account role: {user.role}</p>
            </article>

            <article className={`${cardClass} !border-amber-200 !bg-gradient-to-br !from-amber-50 !to-white`} style={{ background: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)" }}>
              <h3 className="mt-5 text-lg font-bold">My Rewards</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Earn reward points when someone you refer completes an eligible payment confirmed by an administrator.
              </p>
              <p className="mt-4 rounded-xl border border-amber-200 bg-white/70 p-3 text-sm text-slate-600">Your reward balance is updated when eligible referrals are confirmed.</p>
              <p className="mt-3 text-sm text-slate-600">Eligible referral rewards are shown in your reward history.</p>
              <Link href="/dashboard/rewards" className="mt-4 inline-flex text-sm font-bold text-amber-800 hover:text-amber-950">
                View rewards history â†’
              </Link>
            </article>
          <article className={cardClass} style={{ background: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)" }}>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Invite and earn</p>
            <h2 className="mt-2 text-xl font-extrabold">Your referral details</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Invite learners to Digital Rojgar. Your referral reward is credited only after the eligible payment is confirmed.
            </p>

            <div className="mt-5 rounded-xl bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Your referral code</p>
              <p className="mt-1 break-all text-2xl font-extrabold tracking-wide text-emerald-950">
                {referralCode ?? "Temporarily unavailable"}
              </p>
            </div>

            <p className="mt-4 text-sm text-slate-600">
              Learners invited: <strong>{totalReferrals}</strong>
              {" Â· "}
              Successful referrals: <strong>{Math.min(successfulReferrals, 3)} / 3</strong>
            </p>

            <div className="mt-4 break-all rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              {referralUrl}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={referralUrl}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
              >
                Open registration link
              </Link>
              <ReferralLinkActions referralUrl={referralUrl} />
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Your referral link automatically fills in your referral code during registration.
            </p>
          </article>

          <article className={cardClass} style={{ background: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)" }}>
            <p className="text-xs font-bold uppercase tracking-widest text-violet-700">Activity</p>
            <h2 className="mt-2 text-xl font-extrabold">Recent reward history</h2>

            {recentRewards.length === 0 && recentRedemptions.length === 0 ? (
              <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                No reward activity yet. Your confirmed referral rewards will appear here.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {recentRewards.map((reward) => (
                  <div key={reward.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 p-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{reward.description}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {reward.createdAt.toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <span className={`shrink-0 text-sm font-bold ${reward.points >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {reward.points > 0 ? "+" : ""}{reward.points} pts
                    </span>
                  </div>
                ))}

                {recentRedemptions.map((redemption) => (
                  <div key={redemption.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 p-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{redemption.benefit}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Redemption Â· {redemption.status.replaceAll("_", " ")} Â· {redemption.createdAt.toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-slate-700">{redemption.points} pts</span>
                  </div>
                ))}
              </div>
            )}
          </article>
          <article className={cardClass} style={{ background: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)" }}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                  Payments
                </p>
                <h2 className="mt-2 text-xl font-extrabold">Payment & Access Status</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Check your one-time payment and lifetime learning access.
                </p>
              </div>
              <span className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                One-time payment
              </span>
            </div>

            <div className={`mt-5 rounded-xl border p-4 ${statusColor}`}>
              <p className="text-xs font-semibold uppercase tracking-wide">Current status</p>
              <p className="mt-1 text-lg font-extrabold">{paymentStatus}</p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/payment" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800">
                Check Payment
              </Link>
              {isAdmin && (
                <Link href="/admin/payments" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                  Review Payments
                </Link>
              )}
            </div>
          </article>

          {isAdmin ? (
            <article className={cardClass} style={{ background: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)" }}>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Administration</p>
              <h2 className="mt-2 text-xl font-extrabold">Admin tools</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Open the administration area to manage payment reviews and available admin features.
              </p>
              <Link href="/admin" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-700 px-5 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50">
                Open Admin Panel
              </Link>
            </article>
          ) : (
            <article className={cardClass} style={{ background: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)" }}>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Your account</p>
              <h2 className="mt-2 text-xl font-extrabold">Need help?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                If you have completed a payment, keep your UTR reference handy while the administrator verifies it.
              </p>
              <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                Access is enabled only after payment verification. Never submit a payment reference for a transaction that did not occur.
              </p>
            </article>
          )}
        </div>
        </section>
        </section>

        <footer className="py-8 text-center text-xs text-slate-400">
          DIGITAL ROJGAR Â· Your learning journey, in one place.
        </footer>
      </div>
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
                  You â€” Root Account
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
                  <div key={level}>
                    <div className="mb-3 flex items-center gap-3">
                      <div className="h-px flex-1 bg-slate-200" />
                      <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-600">
                        Level {level}
                      </h3>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                        {membersAtLevel.length} members
                      </span>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {membersAtLevel.map((member) => (
                        <ReferralMemberCard key={member.id} member={member} />
                      ))}
                    </div>
                  </div>
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













