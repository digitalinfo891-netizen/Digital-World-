import { PaymentStatus, UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/auth/LogoutButton";
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
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Payment Verification
            </h1>
            <p className="mt-2 text-slate-600">
              Review submitted payment references before granting lifetime access.
            </p>
          </div>
          <LogoutButton />
        </div>
        <PaymentReviewList initialPayments={items} />
      </div>
    </main>
  );
}
