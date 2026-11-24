import { UserRole, UsdtWithdrawalStatus } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UsdtWithdrawalManager from "@/components/admin/UsdtWithdrawalManager";

export const instant = false;


export default async function AdminUsdtPage() {
  await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

  const [withdrawals, pending, approved, rejected, completed] =
    await Promise.all([
      prisma.usdtWithdrawal.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          userId: true,
          walletAddress: true,
          network: true,
          amount: true,
          status: true,
          adminNote: true,
          transactionHash: true,
          completedAt: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
              phoneE164: true,
            },
          },
        },
      }),
      prisma.usdtWithdrawal.count({
        where: { status: UsdtWithdrawalStatus.PENDING },
      }),
      prisma.usdtWithdrawal.count({
        where: { status: UsdtWithdrawalStatus.APPROVED },
      }),
      prisma.usdtWithdrawal.count({
        where: { status: UsdtWithdrawalStatus.REJECTED },
      }),
      prisma.usdtWithdrawal.count({
        where: { status: UsdtWithdrawalStatus.COMPLETED },
      }),
    ]);

  const items = withdrawals.map((w) => ({
    ...w,
    amount: w.amount.toFixed(8),
    createdAt: w.createdAt.toISOString(),
    completedAt: w.completedAt?.toISOString() ?? null,
  }));

  return (
   <div className="usdt-withdrawal-page space-y-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
            Digital Rojgar Â· Admin
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            USDT Withdrawal Management
          </h1>

          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Review BEP20 requests and record manually completed transfers.
          </p>
        </div>

        <a
          href="/admin"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        >
          Admin Home
        </a>
      </header>

      <UsdtWithdrawalManager
        initialWithdrawals={items}
        counts={{ pending, approved, rejected, completed }}
      />
    </div>
  );
}
