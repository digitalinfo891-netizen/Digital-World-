import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendTelegramAlert, telegramTimestamp } from "@/lib/telegram";
import {
  createSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  countryCode: z.string().regex(/^\+\d{1,4}$/),
  phoneE164: z.string().regex(/^\+[1-9]\d{6,14}$/),
  postalCode: z.string().trim().min(2).max(16),
  email: z.union([
    z.string().trim().email().max(254),
    z.literal(""),
    z.null(),
  ]).optional(),
  password: z.string().min(8).max(128),
  referralCode: z.string().trim().max(32).optional(),
});

async function generateReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = `DR${randomBytes(5).toString("hex").toUpperCase()}`;
    const existing = await prisma.user.findUnique({
      where: { referralCode: candidate },
      select: { id: true },
    });

    if (!existing) return candidate;
  }

  throw new Error("Could not generate a unique referral code.");
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter a valid name, country code, mobile number, and password of at least 8 characters." },
        { status: 400 },
      );
    }

    const {
      name,
      countryCode,
      phoneE164,
      postalCode,
      password,
    } = parsed.data;

    const emailValue = parsed.data.email?.trim().toLowerCase() || null;
    const suppliedReferralCode =
      parsed.data.referralCode?.trim().toUpperCase() || null;

    if (!phoneE164.startsWith(countryCode)) {
      return NextResponse.json(
        { error: "The mobile number does not match the selected country code." },
        { status: 400 },
      );
    }

    if (
      countryCode === "+91" &&
      !/^\+91[6-9]\d{9}$/.test(phoneE164)
    ) {
      return NextResponse.json(
        { error: "Enter a valid 10-digit Indian mobile number." },
        { status: 400 },
      );
    }

    const normalizedPostalCode = postalCode.trim().toUpperCase();

    if (
      countryCode === "+91" &&
      !/^\d{6}$/.test(normalizedPostalCode)
    ) {
      return NextResponse.json(
        { error: "Enter a valid 6-digit Indian PIN code." },
        { status: 400 },
      );
    }

    if (
      countryCode !== "+91" &&
      !/^[A-Z0-9][A-Z0-9 -]{0,10}[A-Z0-9]$/.test(normalizedPostalCode)
    ) {
      return NextResponse.json(
        { error: "Enter a valid postal or ZIP code for your country." },
        { status: 400 },
      );
    }
    if (countryCode !== "+91" && !emailValue) {
      return NextResponse.json(
        { error: "Email is required for international registration." },
        { status: 400 },
      );
    }

    const existingPhone = await prisma.user.findUnique({
      where: { phoneE164 },
      select: { id: true },
    });

    if (existingPhone) {
      return NextResponse.json(
        { error: "Unable to register with these details. Try logging in instead." },
        { status: 409 },
      );
    }

    if (emailValue) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: emailValue },
        select: { id: true },
      });

      if (existingEmail) {
        return NextResponse.json(
          { error: "Unable to register with these details. Try logging in instead." },
          { status: 409 },
        );
      }
    }

    let referrerId: string | null = null;

    if (suppliedReferralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: suppliedReferralCode },
        select: {
          id: true,
          email: true,
          phoneE164: true,
          isActive: true,
        },
      });

      if (!referrer || !referrer.isActive) {
        return NextResponse.json(
          { error: "This referral code is invalid or unavailable." },
          { status: 400 },
        );
      }

      if (
        referrer.phoneE164 === phoneE164 ||
        (emailValue !== null &&
          referrer.email?.toLowerCase() === emailValue)
      ) {
        return NextResponse.json(
          { error: "You cannot use your own referral code." },
          { status: 400 },
        );
      }

      referrerId = referrer.id;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const referralCode = await generateReferralCode();

    const user = await prisma.user.create({
      data: {
        name,
        email: emailValue,
        countryCode,
        phoneE164,
        postalCode: normalizedPostalCode,
        passwordHash,
        role: "LEARNER",
        referralCode,
        referredById: referrerId,
      },
      select: { id: true, role: true, name: true, email: true, phoneE164: true, postalCode: true, referralCode: true },
    });

    const alertLines = [
      "🟢 DIGITAL WORLD — NEW REGISTRATION",
      "",
      `Name: ${user.name}`,
      `Mobile: ${user.phoneE164}`,
      `PIN / Post Code: ${user.postalCode}`,
      `Email: ${user.email || "Not provided"}`,
      `Referral code: ${user.referralCode || "Not available"}`,
      `Status: Registered`,
      `Time: ${telegramTimestamp()}`,
    ];

    void sendTelegramAlert(alertLines.join("\n"));

    if (referrerId) {
      try {
        const referrer = await prisma.user.findUnique({
          where: { id: referrerId },
          select: { name: true, referralCode: true },
        });

        void sendTelegramAlert([
          "👥 DIGITAL WORLD — NEW REFERRAL REGISTRATION",
          "",
          `New member: ${user.name}`,
          `Sponsor: ${referrer?.name || "Existing referrer"}`,
          `Sponsor code: ${referrer?.referralCode || suppliedReferralCode || "Not available"}`,
          "Status: Registered",
          `Time: ${telegramTimestamp()}`,
        ].join("\n"));
      } catch {
        console.error("[Telegram] Could not prepare referral registration alert.");
      }
    }

    const token = await createSession(user.id, user.role);
    const response = NextResponse.json(
      { ok: true, redirectTo: "/dashboard" },
      { status: 201 },
    );

    response.cookies.set(
      SESSION_COOKIE,
      token,
      sessionCookieOptions,
    );

    return response;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    console.error("Registration failed:", error);

    return NextResponse.json(
      { error: "Registration could not be completed." },
      { status: 500 },
    );
  }
}
