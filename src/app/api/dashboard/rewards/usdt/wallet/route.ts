import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


const walletSchema = z.object({
  address: z
    .string()
    .trim()
    .regex(
      /^0x[a-fA-F0-9]{40}$/,
      "Enter a valid BEP20 wallet address."
    ),
});

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in first." },
        { status: 401 }
      );
    }

    const wallet = await prisma.usdtWallet.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        network: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      wallet,
      network: "BEP20",
    });
  } catch (error) {
    console.error("USDT wallet retrieval failed:", error);

    return NextResponse.json(
      { error: "Unable to retrieve your USDT wallet." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in first." },
        { status: 401 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const parsed = walletSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid wallet address." },
        { status: 400 }
      );
    }

    const address = parsed.data.address;

    const wallet = await prisma.usdtWallet.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        network: "BEP20",
        address,
        isActive: true,
      },
      update: {
        network: "BEP20",
        address,
        isActive: true,
      },
      select: {
        id: true,
        network: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "BEP20 wallet saved successfully.",
      wallet,
    });
  } catch (error) {
    console.error("USDT wallet update failed:", error);

    return NextResponse.json(
      { error: "Unable to save your USDT wallet." },
      { status: 500 }
    );
  }
}