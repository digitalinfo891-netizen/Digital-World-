import { NextResponse } from "next/server";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const input = body as Record<string, unknown>;
  const paymentId =
    typeof input.paymentId === "string" ? input.paymentId.trim() : "";
  const transactionRef =
    typeof input.transactionRef === "string"
      ? input.transactionRef.trim()
      : "";
  const payerReference =
    typeof input.payerReference === "string"
      ? input.payerReference.trim()
      : "";

  if (
    !paymentId ||
    transactionRef.length < 4 ||
    transactionRef.length > 200
  ) {
    return NextResponse.json(
      { error: "Provide a valid payment ID and transaction reference." },
      { status: 400 },
    );
  }

  if (payerReference.length > 200) {
    return NextResponse.json(
      { error: "Payer reference is too long." },
      { status: 400 },
    );
  }

  try {
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId: user.id,
      },
      select: {
        id: true,
        method: true,
        status: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found." },
        { status: 404 },
      );
    }

    if (
      payment.method !== PaymentMethod.QR ||
      payment.status !== PaymentStatus.PENDING
    ) {
      return NextResponse.json(
        { error: "This payment is not awaiting a new submission." },
        { status: 409 },
      );
    }

    // Only one concurrent request can transition a pending payment.
    const transition = await prisma.payment.updateMany({
      where: {
        id: payment.id,
        userId: user.id,
        method: PaymentMethod.QR,
        status: PaymentStatus.PENDING,
      },
      data: {
        transactionRef,
        payerReference: payerReference || null,
        status: PaymentStatus.UNDER_REVIEW,
      },
    });

    if (transition.count !== 1) {
      return NextResponse.json(
        { error: "This payment is no longer awaiting submission." },
        { status: 409 },
      );
    }

    const updated = await prisma.payment.findUnique({
      where: { id: payment.id },
      select: {
        id: true,
        status: true,
        amount: true,
        currency: true,
        updatedAt: true,
      },
    });

    if (!updated) {
      console.error("Payment update succeeded but the payment could not be retrieved.");
      return NextResponse.json(
        { error: "Payment was updated, but its details could not be retrieved." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      payment: {
        ...updated,
        amount: updated.amount.toString(),
      },
      message:
        "Payment reference submitted. Access will be granted only after admin verification.",
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "That transaction reference has already been submitted." },
        { status: 409 },
      );
    }

    console.error("Payment submission failed.");
    return NextResponse.json(
      { error: "Unable to submit payment reference." },
      { status: 500 },
    );
  }
}