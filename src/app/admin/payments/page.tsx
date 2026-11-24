import { PaymentStatus, UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PaymentReviewList from "@/components/admin/PaymentReviewList";

export const instant = false;

export default async function AdminPaymentsPage() {
  await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

  const payments = await prisma.payment.findMany({
    where: { status: PaymentStatus.UNDER_REVIEW },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      amount: true,
      currency: true,
      method: true,
      status: true,
      transactionRef: true,
      payerReference: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  const items = payments.map((payment) => ({
    ...payment,
    amount: payment.amount.toString(),
    createdAt: payment.createdAt.toISOString(),
  }));

  return (
    <div className="payment-verification-page mx-auto max-w-7xl space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Payment Verification
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Review submitted payment references before granting lifetime access.
        </p>
      </header>

      <PaymentReviewList initialPayments={items} />
    </div>
  );
}