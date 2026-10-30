import DashboardClickableCard from "@/components/DashboardClickableCard";
import Link from "next/link";
import { randomBytes } from "node:crypto";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/auth/LogoutButton";
import ReferralLinkActions from "@/components/dashboard/ReferralLinkActions";
import ThemeToggle from "@/components/theme/ThemeToggle";
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
    ? "border-blue-200 bg-blue-50 text-blue-800"
    : latestPayment?.status === "UNDER_REVIEW"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : latestPayment?.status === "CONFIRMED"
        ? "border-blue-200 bg-blue-50 text-blue-800"
        : "border-slate-200 bg-slate-50 text-slate-700";

  const cardClass = "flex h-[110px] min-w-0 flex-col overflow-y-auto rounded-xl border border-slate-200 bg-gradient-to-br from-white via-blue-50/40 to-slate-50 p-3 text-slate-900 shadow-sm transition-all duration-200 hover:shadow-md [&_h3]:mt-0 [&_h3]:mb-3 [&_h3]:pl-0 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:leading-6 [&_p]:leading-4";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="text-lg font-extrabold tracking-tight text-blue-800 sm:text-xl">
            DIGITAL <span className="text-slate-900">WORLD</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            {isAdmin && (
              <Link href="/admin/payments" className="rounded-lg border border-blue-700 px-3 py-2 text-xs font-bold text-blue-800 transition hover:bg-blue-50 sm:px-4 sm:text-sm">
                Payment Verification
              </Link>
            )}
            <LogoutButton />
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <section
          className="welcome-banner relative w-full min-w-0 rounded-3xl p-5 text-white shadow-xl sm:p-8 lg:p-10"
          style={{
            background: "linear-gradient(120deg, #243b9b 0%, #4f46e5 55%, #7047d3 100%)",
          }}
        >
          <div className="grid min-w-0 grid-cols-1 items-start gap-6">
            <div className="welcome-banner-content min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-100 sm:text-sm">
                Your learning workspace
              </p>
              <h1 className="mt-3 break-words text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
                Welcome, {user.name}
              </h1>
              <p className="mt-4 max-w-xl break-words text-sm leading-6 text-blue-50 sm:text-base sm:leading-7">
                Learn new skills, track your journey, and keep your account
                and payment information in one place.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link href="/payment" className="inline-flex min-h-11 max-w-full items-center justify-center whitespace-normal rounded-xl bg-white px-5 py-3 text-sm font-bold !text-blue-900 shadow-md transition hover:bg-blue-50">
                  {hasAccess ? "View Access Status" : "Payment & Access"}
                </Link>
                <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/50 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                  Visit Website
                </Link>
              </div>
            </div>

            <div className="account-status-panel w-full min-w-0 self-start rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm md:p-5">
              <p className="text-sm text-blue-100">Account type</p>
              <p className="mt-2 text-xl font-bold">
                {isAdmin ? "Administrator" : "Learner"}
              </p>
              <div className="mt-3 border-t border-white/20 pt-3">
                <p className="text-sm text-blue-100">Access status</p>
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
              <p className="mt-1 text-sm text-white">
                Quick access to your learning and account tools.
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
              {user.role.replaceAll("_", " ")}
            </span>
          </div>

          <div 
className="dashboard-cards grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardClickableCard href="/courses" className={`${cardClass}`} style={{ background: "linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)", height: "220px", minHeight: "220px", maxHeight: "220px", overflowY: "auto" }}>
              <h3 className="mt-5 text-lg font-bold">My Courses</h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
                Find your learning content as courses become available.
              </p>
              <span className="mt-4 inline-block text-xs font-semibold text-slate-400">Learning library</span>
            </DashboardClickableCard>

            <DashboardClickableCard href="/progress" className={`${cardClass}`} style={{ background: "linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%)", height: "220px", minHeight: "220px", maxHeight: "220px", overflowY: "auto" }}>
              <h3 className="mt-5 text-lg font-bold">Learning Progress</h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
                Your lesson, quiz, and project tracking workspace.
              </p>
              <span className="mt-4 inline-block text-xs font-semibold text-slate-400">Progress tracking</span>
            </DashboardClickableCard>

            <DashboardClickableCard href="/account" className={`${cardClass}`} style={{ background: "linear-gradient(135deg, #fce7f3 0%, #fdf2f8 100%)", height: "220px", minHeight: "220px", maxHeight: "220px", overflowY: "auto" }}>
              <h3 className="mt-5 text-lg font-bold">My Account</h3>
              <p className="mt-2 break-words text-sm leading-6 text-slate-600">{user.email}</p>
              <p className="mt-3 text-xs text-slate-500">Account role: {user.role}</p>
            </DashboardClickableCard>

            <DashboardClickableCard href="/dashboard/inviteandearn" className={`${cardClass} !border-amber-200`} style={{ background: "linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)", height: "220px", minHeight: "220px", maxHeight: "220px", overflowY: "auto" }}>
              <h3 className="mt-5 text-lg font-bold">My Rewards</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Earn reward points when someone you refer completes an eligible payment confirmed by an administrator.
              </p>
              <p className="mt-4 rounded-xl border border-amber-200 bg-white/70 p-3 text-sm text-slate-600">Your reward balance is updated when eligible referrals are confirmed.</p>
              <p className="mt-3 text-sm text-slate-600">Eligible referral rewards are shown in your reward history.</p>
              <Link href="/dashboard/inviteandearn" className="mt-4 inline-flex text-sm font-bold text-amber-800 hover:text-amber-950">
                View rewards history
              </Link>
            </DashboardClickableCard>
          <DashboardClickableCard href="/dashboard/inviteandearn" className={cardClass} style={{ background: "linear-gradient(135deg, #ccfbf1 0%, #f0fdfa 100%)", height: "220px", minHeight: "220px", maxHeight: "220px", overflowY: "auto" }}>
            <h3 className="mt-5 text-lg font-bold">Invite and earn</h3>
            
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Invite learners to Digital World. Your referral reward is credited only after the eligible payment is confirmed.
            </p>

            <div className="mt-5 rounded-xl bg-blue-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">Your referral code</p>
              <p className="mt-1 break-all text-lg font-extrabold tracking-wide text-blue-950">
                {referralCode ?? "Temporarily unavailable"}
              </p>
            </div>

            <p className="mt-4 text-sm text-slate-600">
              Learners invited: <strong>{totalReferrals}</strong>
              {" | "}
              Successful referrals: <strong>{Math.min(successfulReferrals, 3)} / 3</strong>
            </p>

            <div className="mt-4 break-all rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              {referralUrl}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={referralUrl}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
              >
                Open registration link
              </Link>
              <ReferralLinkActions referralUrl={referralUrl} />
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Your referral link automatically fills in your referral code during registration.
            </p>
          </DashboardClickableCard>

          <DashboardClickableCard href="/dashboard/activity" className={cardClass} style={{ background: "linear-gradient(135deg, #ffe4e6 0%, #fff1f2 100%)", height: "220px", minHeight: "220px", maxHeight: "220px", overflowY: "auto" }}>
            <h3 className="mt-5 text-lg font-bold">Activity</h3>
            

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
                    <span className={`shrink-0 text-sm font-bold ${reward.points >= 0 ? "text-blue-700" : "text-rose-700"}`}>
                      {reward.points > 0 ? "+" : ""}{reward.points} pts
                    </span>
                  </div>
                ))}

                {recentRedemptions.map((redemption) => (
                  <div key={redemption.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 p-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{redemption.benefit}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Redemption: {redemption.status.replaceAll("_", " ")} | {redemption.createdAt.toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-slate-700">{redemption.points} pts</span>
                  </div>
                ))}
              </div>
            )}
          </DashboardClickableCard>
          <DashboardClickableCard href="/payment" className={cardClass} style={{ background: "linear-gradient(135deg, #ffedd5 0%, #fff7ed 100%)", height: "220px", minHeight: "220px", maxHeight: "220px", overflowY: "auto" }}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="mt-5 text-lg font-bold text-slate-900">Payments</h3>
                
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Check your one-time payment and lifetime learning access.
                </p>
              </div>
              <span className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-800">
                One-time payment
              </span>
            </div>

            <div className={`mt-5 rounded-xl border p-4 ${statusColor}`}>
              <p className="text-xs font-semibold uppercase tracking-wide">Current status</p>
              <p className="mt-1 text-lg font-extrabold">{paymentStatus}</p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/payment" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800">
                Check Payment
              </Link>
              {isAdmin && (
                <Link href="/admin/payments" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                  Review Payments
                </Link>
              )}
            </div>
          </DashboardClickableCard>

          {isAdmin ? (
            <DashboardClickableCard href="/account" className={cardClass} style={{ background: "linear-gradient(135deg, #e0e7ff 0%, #eef2ff 100%)", height: "220px", minHeight: "220px", maxHeight: "220px", overflowY: "auto" }}>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Administration</p>
              <h2 className="mt-2 text-xl font-extrabold">Admin tools</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Open the administration area to manage payment reviews and available admin features.
              </p>
              <Link href="/admin" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-blue-700 px-5 py-3 text-sm font-bold text-blue-800 transition hover:bg-blue-50">
                Open Admin Panel
              </Link>
            </DashboardClickableCard>
          ) : (
            <article className={cardClass} style={{ background: "linear-gradient(135deg, #d1fae5 0%, #a7d9c5 42%, #e8f8f1 72%, #ffffff 100%)", height: "220px", minHeight: "220px", maxHeight: "220px", overflowY: "auto" }}>
              <h3 className="mt-5 text-lg font-bold">Your account</h3>
              
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
          DIGITAL WORLD | Your learning journey, in one place.
        </footer>
      </div>
            
</main>
  );
}




























