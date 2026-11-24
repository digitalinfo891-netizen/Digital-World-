
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Verify logged-in administrator
    const admin = await getCurrentUser();

    if (!admin) {
      return NextResponse.json(
        { error: "Please sign in first." },
        { status: 401 },
      );
    }

    // Verify administrator permissions
    if (
      admin.role !== UserRole.ADMIN &&
      admin.role !== UserRole.SUPER_ADMIN
    ) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 },
      );
    }

    const { id } = await params;

    if (!id || id.length > 128) {
      return NextResponse.json(
        { error: "Invalid user ID." },
        { status: 400 },
      );
    }

    // Fetch user profile and related information
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        countryCode: true,
        phoneE164: true,
        postalCode: true,
        role: true,
        emailVerified: true,
        isActive: true,
        referralCode: true,
        referredById: true,
        createdAt: true,
        updatedAt: true,

        // Referrer information
        referrer: {
          select: {
            id: true,
            name: true,
            referralCode: true,
          },
        },

        // Referred users
        referrals: {
          orderBy: { createdAt: "desc" },
          take: 25,
          select: {
            id: true,
            name: true,
            email: true,
            referralCode: true,
            isActive: true,
            createdAt: true,
          },
        },

        // User entitlement
        entitlement: {
          select: {
            id: true,
            paymentId: true,
            grantedAt: true,
            revokedAt: true,
            reason: true,
          },
        },

        // Recent payment history
        payments: {
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            method: true,
            status: true,
            amount: true,
            currency: true,
            network: true,
            transactionRef: true,
            providerReference: true,
            proofUrl: true,
            createdAt: true,
            verifiedAt: true,
          },
        },

        // Related record counts
        _count: {
          select: {
            payments: true,
            referrals: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Admin user profile GET error:", error);

    return NextResponse.json(
      { error: "Unable to load user profile." },
      { status: 500 },
    );
  }
}
