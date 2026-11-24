
import { NextResponse } from "next/server";
import {
  CourseAccessType,
  CourseEnrollmentStatus,
  PaymentMethod,
  PaymentPurpose,
  PaymentStatus,
} from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
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

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const input = body as Record<string, unknown>;
    const courseId =
      typeof input.courseId === "string" ? input.courseId.trim() : "";

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required." },
        { status: 400 }
      );
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        status: true,
        accessType: true,
        price: true,
      },
    });

    if (!course || course.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Published course not found." },
        { status: 404 }
      );
    }

    if (course.accessType !== CourseAccessType.PAID) {
      return NextResponse.json(
        {
          error:
            "Individual payment is available only for paid courses.",
        },
        { status: 400 }
      );
    }

    if (
      !course.price ||
      !Number.isFinite(Number(course.price.toString())) ||
      Number(course.price.toString()) <= 0
    ) {
      return NextResponse.json(
        { error: "Course pricing is not configured." },
        { status: 503 }
      );
    }

    // Check whether the student already has active access.
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: {
        userId: user.id,
        courseId: course.id,
        status: CourseEnrollmentStatus.ACTIVE,
      },
      select: { id: true },
    });

    if (enrollment) {
      return NextResponse.json(
        { error: "You already have access to this course." },
        { status: 409 }
      );
    }

    // Reuse only a pending payment for this exact course.
    const existing = await prisma.payment.findFirst({
      where: {
        userId: user.id,
        courseId: course.id,
        purpose: PaymentPurpose.COURSE_PURCHASE,
        method: PaymentMethod.QR,
        currency: "INR",
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
          courseId: course.id,
          courseTitle: course.title,
        },
        message:
          "You already have a payment awaiting processing for this course.",
      });
    }

    // Create a course-specific payment using the course's current price.
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        courseId: course.id,
        purpose: PaymentPurpose.COURSE_PURCHASE,
        method: PaymentMethod.QR,
        currency: "INR",
        status: PaymentStatus.PENDING,
        amount: course.price.toFixed(2),
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
          courseId: course.id,
          courseTitle: course.title,
        },
        message:
          "Course payment request created. Complete payment using the platform's verified official payment details.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Course payment creation failed:", error);

    return NextResponse.json(
      { error: "Unable to create course payment request." },
      { status: 500 }
    );
  }
}