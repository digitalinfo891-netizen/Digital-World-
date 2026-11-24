
import { NextResponse } from "next/server";
import { UserRole, Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 25;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;

    if (!id || id.length > 128) {
      return NextResponse.json(
        { error: "Invalid user ID." },
        { status: 400 },
      );
    }

    const url = new URL(request.url);
    const search = (url.searchParams.get("search") || "")
      .trim()
      .slice(0, 100);

    const requestedPage = Number(url.searchParams.get("page") || "1");
    const page = Number.isInteger(requestedPage)
      ? Math.max(1, requestedPage)
      : 1;

    const referrer = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { referrals: true },
        },
      },
    });

    if (!referrer) {
      return NextResponse.json(
        { error: "Referrer not found." },
        { status: 404 },
      );
    }

    const conditions: Prisma.UserWhereInput[] = [
      { referredById: id },
    ];

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

    const where: Prisma.UserWhereInput = { AND: conditions };

    const [referrals, total, active, inactive] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          name: true,
          email: true,
          phoneE164: true,
          role: true,
          isActive: true,
          referralCode: true,
          createdAt: true,
          _count: {
            select: { referrals: true, payments: true },
          },
        },
      }),
      prisma.user.count({ where }),
      prisma.user.count({
        where: { AND: [...conditions, { isActive: true }] },
      }),
      prisma.user.count({
        where: { AND: [...conditions, { isActive: false }] },
      }),
    ]);

    return NextResponse.json({
      referrer,
      referrals,
      counts: {
        total,
        active,
        inactive,
      },
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      },
    });
  } catch (error) {
    console.error("Admin user referrals GET error:", error);

    return NextResponse.json(
      { error: "Unable to load referral information." },
      { status: 500 },
    );
  }
}
