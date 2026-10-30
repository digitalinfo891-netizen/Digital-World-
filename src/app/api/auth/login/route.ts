import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";

const schema = z.object({
  username: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(128),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter your mobile number or email address and password." },
        { status: 400 },
      );
    }

    const username = parsed.data.username.trim();
    const password = parsed.data.password;
    let user = null;

    if (username.includes("@")) {
      user = await prisma.user.findUnique({
        where: { email: username.toLowerCase() },
      });
    } else {
      const digits = username.replace(/\D/g, "");
      let phoneE164: string | null = null;

      if (/^\+91[6-9]\d{9}$/.test(username.replace(/[^\d+]/g, ""))) {
        phoneE164 = username.replace(/[^\d+]/g, "");
      } else if (/^[6-9]\d{9}$/.test(digits)) {
        phoneE164 = `+91${digits}`;
      } else if (/^91[6-9]\d{9}$/.test(digits)) {
        phoneE164 = `+${digits}`;
      }

      if (!phoneE164) {
        return NextResponse.json(
          { error: "Enter a valid registered email or 10-digit Indian mobile number." },
          { status: 400 },
        );
      }

      user = await prisma.user.findUnique({
        where: { phoneE164 },
      });
    }

    if (
      !user ||
      !user.isActive ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      return NextResponse.json(
        { error: "Invalid user name or password." },
        { status: 401 },
      );
    }

    const token = await createSession(user.id, user.role);
    const response = NextResponse.json({
      ok: true,
      redirectTo: "/dashboard",
    });

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

    console.error("Login failed:", error);

    return NextResponse.json(
      { error: "Login could not be completed." },
      { status: 500 },
    );
  }
}