import { PaymentStatus, UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getLearningAccess() {
  const user = await getCurrentUser();

  if (!user) {
    return { user: null, allowed: false };
  }

  if (
    user.role === UserRole.ADMIN ||
    user.role === UserRole.SUPER_ADMIN
  ) {
    return { user, allowed: true };
  }

  const entitlement = await prisma.entitlement.findFirst({
    where: {
      userId: user.id,
      revokedAt: null,
      payment: {
        is: {
          status: PaymentStatus.CONFIRMED,
        },
      },
    },
    select: { id: true },
  });

  return {
    user,
    allowed: Boolean(entitlement),
  };
}