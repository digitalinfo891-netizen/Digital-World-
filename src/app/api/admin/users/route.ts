import { NextResponse } from "next/server";
import { UserRole, Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


const PAGE_SIZE = 25;

export async function GET(request: Request) {
  try {
    const admin = await getCurrentUser();

    if (!admin) {
      return NextResponse.json(
        { error: "Please sign in first." },
        { status: 401 },
      );
    }

    if (
      admin.role !== UserRole.ADMIN &&
      admin.role !== UserRole.SUPER_ADMIN
    ) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 },
      );
    }

    const url = new URL(request.url);
    const search = (url.searchParams.get("search") || "").trim().slice(0, 100);
    const roleParam = url.searchParams.get("role") || "ALL";
    const statusParam = url.searchParams.get("status") || "ALL";

    const requestedPage = Number(url.searchParams.get("page") || "1");
    const page = Number.isInteger(requestedPage)
      ? Math.max(1, requestedPage)
      : 1;

    if (
      roleParam !== "ALL" &&
      !Object.values(UserRole).includes(roleParam as UserRole)
    ) {
      return NextResponse.json(
        { error: "Invalid role filter." },
        { status: 400 },
      );
    }

    if (!["ALL", "ACTIVE", "INACTIVE"].includes(statusParam)) {
      return NextResponse.json(
        { error: "Invalid account status filter." },
        { status: 400 },
      );
    }

    const conditions: Prisma.UserWhereInput[] = [];

    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phoneE164: { contains: search, mode: "insensitive" } },
          { referralCode: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if (roleParam !== "ALL") {
      conditions.push({ role: roleParam as UserRole });
    }

    if (statusParam === "ACTIVE") {
      conditions.push({ isActive: true });
    } else if (statusParam === "INACTIVE") {
      conditions.push({ isActive: false });
    }

    const where: Prisma.UserWhereInput =
      conditions.length > 0 ? { AND: conditions } : {};

    const [users, total, active, inactive] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
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
          referrer: {
            select: {
              id: true,
              name: true,
              referralCode: true,
            },
          },
          entitlement: {
            select: {
              id: true,
              grantedAt: true,
              revokedAt: true,
              reason: true,
            },
          },
          _count: {
            select: {
              payments: true,
              referrals: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      },
      counts: {
        total: active + inactive,
        active,
        inactive,
      },
    });
  } catch (error) {
    console.error("Admin users GET error:", error);

    return NextResponse.json(
      { error: "Unable to load users." },
      { status: 500 },
    );
  }
}