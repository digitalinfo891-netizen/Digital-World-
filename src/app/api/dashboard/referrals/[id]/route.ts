import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Please sign in to view referral details." },
        { status: 401 },
      );
    }

    const { id } = await context.params;

    if (!id || id === currentUser.id) {
      return NextResponse.json(
        { error: "Invalid referral member." },
        { status: 400 },
      );
    }

    // Only search members in the current user's downline, up to six levels.
    let frontier = [currentUser.id];
    const visited = new Set<string>(frontier);
    let member: {
      id: string;
      name: string;
      email: string | null;
      referralCode: string | null;
      isActive: boolean;
      createdAt: Date;
      referredById: string | null;
    } | null = null;
    let memberLevel = 0;

    for (let level = 1; level <= 6 && frontier.length > 0; level++) {
      const children = await prisma.user.findMany({
        where: {
          referredById: { in: frontier },
        },
        select: {
          id: true,
          name: true,
          email: true,
          referralCode: true,
          isActive: true,
          createdAt: true,
          referredById: true,
        },
      });

      const target = children.find((child) => child.id === id);

      if (target) {
        member = target;
        memberLevel = level;
        break;
      }

      const nextFrontier: string[] = [];

      for (const child of children) {
        if (!visited.has(child.id)) {
          visited.add(child.id);
          nextFrontier.push(child.id);
        }
      }

      frontier = nextFrontier;
    }

    if (!member) {
      return NextResponse.json(
        { error: "Member not found in your six-level referral network." },
        { status: 404 },
      );
    }

    const [sponsor, directReferrals] = await Promise.all([
      member.referredById
        ? prisma.user.findUnique({
            where: { id: member.referredById },
            select: { name: true },
          })
        : Promise.resolve(null),
      prisma.user.count({
        where: { referredById: member.id },
      }),
    ]);

    return NextResponse.json({
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        referralCode: member.referralCode,
        isActive: member.isActive,
        createdAt: member.createdAt.toISOString(),
        level: memberLevel,
        sponsorName: sponsor?.name ?? null,
        directReferrals,
      },
    });
  } catch (error) {
    console.error("Referral member details API error:", error);

    return NextResponse.json(
      { error: "Unable to load member details. Please try again." },
      { status: 500 },
    );
  }
}