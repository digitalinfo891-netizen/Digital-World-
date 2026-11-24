
import { NextResponse } from "next/server";
import {
  PaymentMethod,
  PaymentPurpose,
  PaymentStatus,
} from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PRICE_KEY = "LIFETIME_MEMBERSHIP_PRICE_INR";
const ENABLED_KEY = "LIFETIME_MEMBERSHIP_ENABLED";

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in first." },
        { status: 401 }
      );
    }

    // Check confirmed lifetime membership access.
    const entitlement = await prisma.entitlement.findFirst({
      where: {
        userId: user.id,
        revokedAt: null,
        payment: {
          is: {
            status: PaymentStatus.CONFIRMED,
            purpose: PaymentPurpose.LIFETIME_MEMBERSHIP,
          },
        },
      },
      select: { id: true },
    });

    if (entitlement) {
      return NextResponse.json(
        { error: "Your lifetime access is already active." },
        { status: 409 }
      );
    }

    // Preserve an existing pending membership payment and its original amount.
    const existing = await prisma.payment.findFirst({
      where: {
        userId: user.id,
        method: PaymentMethod.QR,
        currency: "INR",
        purpose: PaymentPurpose.LIFETIME_MEMBERSHIP,
        status: {
          in: [
            PaymentStatus.PENDING,
            PaymentStatus.UNDER_REVIEW,
          ],
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
        message: "You already have a membership payment awaiting processing.",
      });
    }

    // Read administrator-configured membership settings.
    const [priceSetting, enabledSetting] = await Promise.all([
      prisma.platformSetting.findUnique({
        where: { key: PRICE_KEY },
        select: { value: true },
      }),
      prisma.platformSetting.findUnique({
        where: { key: ENABLED_KEY },
        select: { value: true },
      }),
    ]);

    const price = priceSetting?.value;
    const enabled = enabledSetting?.value;

    if (enabled !== true) {
      return NextResponse.json(
        { error: "New lifetime membership purchases are currently disabled." },
        { status: 403 }
      );
    }

    if (
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return NextResponse.json(
        { error: "Membership pricing is not configured. Please contact the administrator." },
        { status: 503 }
      );
    }

    // Create a new membership payment using the configured price.
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        purpose: PaymentPurpose.LIFETIME_MEMBERSHIP,
        method: PaymentMethod.QR,
        currency: "INR",
        status: PaymentStatus.PENDING,
        amount: price.toFixed(2),
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
          "Membership payment request created. Complete payment only using the platform's verified official payment details.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Membership payment creation failed:", error);

    return NextResponse.json(
      { error: "Unable to create payment request." },
      { status: 500 }
    );
  }
}
