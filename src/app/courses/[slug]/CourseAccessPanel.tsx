
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import {
  Award,
  CheckCircle2,
  CreditCard,
  LockKeyhole,
} from "lucide-react";

type Props = {
  courseId: string;
  accessType: "FREE" | "MEMBERSHIP" | "PAID";
  price: string | null;
  certificateEnabled: boolean;
};

type Payment = {
  id: string;
  amount: string;
  currency: string;
  status: string;
  method: string;
  courseId?: string;
  courseTitle?: string;
};

function formatPrice(price: string | null) {
  if (
    !price ||
    !Number.isFinite(Number(price)) ||
    Number(price) <= 0
  ) {
    return "Price unavailable";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(price));
}

export default function CourseAccessPanel({
  courseId,
  accessType,
  price,
  certificateEnabled,
}: Props) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [transactionRef, setTransactionRef] = useState("");
  const [payerReference, setPayerReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function createPayment() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/payments/course/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseId }),
      });

      const data = await response.json();

      if (!response.ok || !data.payment) {
        throw new Error(data.error || "Unable to create payment.");
      }

      setPayment(data.payment);
      setMessage(data.message || "Payment request created.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create payment."
      );
    } finally {
      setLoading(false);
    }
  }

  async function submitProof(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!payment) return;

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/payments/submit-proof", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId: payment.id,
          transactionRef: transactionRef.trim(),
          payerReference: payerReference.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to submit payment reference."
        );
      }

      setPayment((previous) =>
        previous
          ? {
              ...previous,
              status: "UNDER_REVIEW",
            }
          : previous
      );

      setMessage(
        data.message ||
          "Payment reference submitted. Waiting for administrator verification."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit payment reference."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-7 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        {accessType === "FREE" && (
          <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-extrabold text-emerald-100">
            FREE COURSE
          </span>
        )}

        {accessType === "MEMBERSHIP" && (
          <span className="rounded-full bg-blue-400/20 px-3 py-1 text-xs font-extrabold text-blue-100">
            LIFETIME MEMBERSHIP
          </span>
        )}

        {accessType === "PAID" && (
          <span className="rounded-full bg-violet-300/20 px-3 py-1 text-xs font-extrabold text-violet-100">
            INDIVIDUAL PURCHASE
          </span>
        )}

        {certificateEnabled && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/20 px-3 py-1 text-xs font-bold text-amber-100">
            <Award size={13} />
            Certificate available
          </span>
        )}
      </div>

      {accessType === "FREE" && (
        <div className="mt-4">
          <p className="text-xl font-black text-white">
            Free access
          </p>
          <p className="mt-1 text-sm text-blue-100">
            Sign in to start learning this course.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-blue-700 hover:bg-blue-50"
          >
            <LockKeyhole size={16} />
            Sign In to Learn
          </Link>
        </div>
      )}

      {accessType === "MEMBERSHIP" && (
        <div className="mt-4">
          <p className="text-xl font-black text-white">
            Included with lifetime membership
          </p>
          <p className="mt-1 text-sm text-blue-100">
            Activate lifetime membership to access this course.
          </p>
          <Link
            href="/payment"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-blue-700 hover:bg-blue-50"
          >
            <LockKeyhole size={16} />
            Get Lifetime Membership
          </Link>
        </div>
      )}

      {accessType === "PAID" && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-blue-100">
            One-time course price
          </p>

          <p className="mt-1 text-3xl font-black text-white">
            {formatPrice(price)}
          </p>

          {!payment && (
            <button
              type="button"
              onClick={createPayment}
              disabled={
                loading ||
                !price ||
                !Number.isFinite(Number(price)) ||
                Number(price) <= 0
              }
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-extrabold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CreditCard size={17} />
              {loading ? "Creating payment..." : "Buy This Course"}
            </button>
          )}

          {payment && (
            <div className="mt-5 rounded-xl border border-white/20 bg-slate-950/20 p-4">
              <p className="text-sm font-bold text-white">
                Payment reference: {payment.id}
              </p>

              <p className="mt-1 text-sm text-blue-100">
                Amount: {formatPrice(payment.amount)}
              </p>

              {payment.status === "UNDER_REVIEW" && (
                <div className="mt-4 rounded-lg bg-amber-400/15 p-4">
                  <p className="flex items-center gap-2 font-bold text-amber-100">
                    <CheckCircle2 size={18} />
                    Payment submitted for review
                  </p>

                  <p className="mt-2 text-sm leading-6 text-blue-100">
                    Your course access will be activated after administrator
                    verification.
                  </p>
                </div>
              )}

              {payment.status === "PENDING" && (
                <>
                  <div className="mt-4 rounded-xl bg-white p-4 text-center text-slate-900">
                    <p className="font-extrabold">
                      Scan UPI QR to pay
                    </p>

                    <Image
                      src="/images/upi-qr.png"
                      alt="UPI payment QR code"
                      width={210}
                      height={210}
                      className="mx-auto mt-3 h-auto w-[210px]"
                    />

                    <p className="mt-2 text-sm font-bold">
                      Payee: Gohil
                    </p>

                    <p className="text-sm">
                      UPI ID: Test@oksbi
                    </p>

                    <p className="mt-2 text-lg font-black">
                      {formatPrice(payment.amount)}
                    </p>
                  </div>

                  <form
                    onSubmit={submitProof}
                    className="mt-5 space-y-3"
                  >
                    <div>
                      <label
                        htmlFor="course-transaction-ref"
                        className="mb-1 block text-sm font-bold text-white"
                      >
                        UPI transaction reference *
                      </label>

                      <input
                        id="course-transaction-ref"
                        value={transactionRef}
                        onChange={(event) =>
                          setTransactionRef(event.target.value)
                        }
                        required
                        minLength={4}
                        maxLength={200}
                        placeholder="Enter UPI transaction ID"
                        className="w-full rounded-lg border border-white/20 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="course-payer-reference"
                        className="mb-1 block text-sm font-bold text-white"
                      >
                        Payer UPI ID or reference (optional)
                      </label>

                      <input
                        id="course-payer-reference"
                        value={payerReference}
                        onChange={(event) =>
                          setPayerReference(event.target.value)
                        }
                        maxLength={200}
                        placeholder="Your UPI ID"
                        className="w-full rounded-lg border border-white/20 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={
                        submitting ||
                        transactionRef.trim().length < 4
                      }
                      className="w-full rounded-xl bg-emerald-500 px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting
                        ? "Submitting..."
                        : "Submit Payment Reference"}
                    </button>
                  </form>
                </>
              )}

              {payment.status !== "PENDING" &&
                payment.status !== "UNDER_REVIEW" && (
                  <div className="mt-4 rounded-lg bg-white/10 p-4">
                    <p className="text-sm font-bold text-white">
                      Payment status: {payment.status}
                    </p>
                    <p className="mt-2 text-sm text-blue-100">
                      Refresh the course page to check your current access.
                      Contact support if you need help.
                    </p>
                  </div>
                )}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-500/15 p-3 text-sm font-semibold text-red-100">
          {error}
        </p>
      )}

      {message && (
        <p className="mt-4 rounded-lg bg-emerald-500/15 p-3 text-sm font-semibold text-emerald-100">
          {message}
        </p>
      )}
    </div>
  );
}
