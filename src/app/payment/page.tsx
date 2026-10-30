import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PaymentForm from "./PaymentForm";

export const instant = false;

export default async function PaymentPage() {
  const user = await requireUser();

  const [entitlement, latestPayment] = await Promise.all([
    prisma.entitlement.findUnique({
      where: { userId: user.id },
      select: { revokedAt: true },
    }),
    prisma.payment.findFirst({
      where: {
        userId: user.id,
        status: { in: ["PENDING", "UNDER_REVIEW"] },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
      },
    }),
  ]);

  return (
    <PaymentForm
      hasAccess={Boolean(entitlement && !entitlement.revokedAt)}
      initialPayment={
        latestPayment
          ? {
              id: latestPayment.id,
              amount: latestPayment.amount.toString(),
              currency: latestPayment.currency,
              status: latestPayment.status,
            }
          : null
      }
    />
  );
}
