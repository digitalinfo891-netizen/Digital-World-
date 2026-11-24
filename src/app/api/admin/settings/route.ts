
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PRICE_KEY = "LIFETIME_MEMBERSHIP_PRICE_INR";
const ENABLED_KEY = "LIFETIME_MEMBERSHIP_ENABLED";

async function getAdmin() {
  const user = await getCurrentUser();

  if (
    !user ||
    (user.role !== UserRole.ADMIN &&
      user.role !== UserRole.SUPER_ADMIN)
  ) {
    return null;
  }

  return user;
}

export async function GET() {
  try {
    const admin = await getAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const settings = await prisma.platformSetting.findMany({
      where: { key: { in: [PRICE_KEY, ENABLED_KEY] } },
    });

    const priceSetting = settings.find((s) => s.key === PRICE_KEY);
    const enabledSetting = settings.find((s) => s.key === ENABLED_KEY);

    const price = priceSetting?.value;
    const enabled = enabledSetting?.value;

    return NextResponse.json({
      membershipPriceInr: typeof price === "number" ? price : null,
      membershipEnabled: typeof enabled === "boolean" ? enabled : false,
      configured: typeof price === "number" && price > 0,
    });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json(
      { error: "Unable to load settings." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await getAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid settings data." },
        { status: 400 }
      );
    }

    const input = body as Record<string, unknown>;
    const price = input.membershipPriceInr;
    const enabled = input.membershipEnabled;

    if (
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price <= 0 ||
      price > 10000000 ||
      Math.round(price * 100) !== price * 100
    ) {
      return NextResponse.json(
        { error: "Enter a valid price with up to two decimal places." },
        { status: 400 }
      );
    }

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "Invalid membership enabled value." },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.platformSetting.upsert({
        where: { key: PRICE_KEY },
        create: { key: PRICE_KEY, value: price },
        update: { value: price },
      });

      await tx.platformSetting.upsert({
        where: { key: ENABLED_KEY },
        create: { key: ENABLED_KEY, value: enabled },
        update: { value: enabled },
      });

      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "PLATFORM_SETTINGS_UPDATED",
          entityType: "PlatformSetting",
          metadata: {
            membershipPriceInr: price,
            membershipEnabled: enabled,
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      membershipPriceInr: price,
      membershipEnabled: enabled,
      message: "Settings updated successfully.",
    });
  } catch (error) {
    console.error("Settings PATCH error:", error);
    return NextResponse.json(
      { error: "Unable to update settings." },
      { status: 500 }
    );
  }
}
