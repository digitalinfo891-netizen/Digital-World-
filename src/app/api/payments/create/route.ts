import { NextResponse } from "next/server";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  const entitlement = await prisma.entitlement.findUnique({
    where: { userId: user.id },
    select: { revokedAt: true },
  });

  if (entitlement && !entitlement.revokedAt) {
    return NextResponse.json(
      { error: "Your lifetime access is already active." },
      { status: 409 },
    );
  }

  const existing = await prisma.payment.findFirst({
    where: {
      userId: user.id,
      method: PaymentMethod.QR,
      currency: "INR",
      status: {
        in: [PaymentStatus.PENDING, PaymentStatus.UNDER_REVIEW],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return NextResponse.json({
      payment: {
        id: existing.id,
        amount: existing.amount.toString(),
        currency: existing.currency,
        status: existing.status,
        method: existing.method,
      },
      message: "You already have a payment awaiting processing.",
    });
  }

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      method: PaymentMethod.QR,
      currency: "INR",
      status: PaymentStatus.PENDING,
      amount: "190.00",
    },
    select: {
      id: true,
      amount: true,
      currency: true,
      status: true,
      method: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    {
      payment: {
        ...payment,
        amount: payment.amount.toString(),
      },
      message:
        "Payment request created. Complete payment only using the platform's verified official payment details.",
    },
    { status: 201 },
  );
}
