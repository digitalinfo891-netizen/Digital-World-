"use client";

import { useState } from "react";

type PaymentItem = {
  id: string;
  amount: string;
  currency: string;
  method: string;
  status: string;
  transactionRef: string | null;
  payerReference: string | null;
  createdAt: string;
  user: {
    name: string | null;
    email: string | null;
  };
};

export default function PaymentReviewList({
  initialPayments,
}: {
  initialPayments: PaymentItem[];
}) {
  const [payments, setPayments] = useState(initialPayments);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function review(paymentId: string, action: "confirm" | "reject") {
    const prompt =
      action === "confirm"
        ? "Confirm only after independently verifying receipt of the payment. Continue?"
        : "Reject this payment submission? Continue?";

    if (!window.confirm(prompt)) return;

    setBusyId(paymentId);
    setMessage("");

    try {
      const response = await fetch("/api/admin/payments/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          action,
          adminNote: notes[paymentId] ?? "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "Payment review failed.");
        return;
      }

      setPayments((current) =>
        current.filter((payment) => payment.id !== paymentId),
      );

      setMessage(
        action === "confirm"
          ? "Payment confirmed and removed from the review queue."
          : "Payment rejected and removed from the review queue.",
      );
    } catch {
      setMessage("Could not contact the server. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  if (payments.length === 0) {
    return (
      <section className="payment-review-empty rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          No payments awaiting review
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Submitted QR payment references will appear here.
        </p>
      </section>
    );
  }

  return (
    <section className="payment-review-list space-y-5">
      {message && (
        <p
          role="status"
          className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200"
        >
          {message}
        </p>
      )}

      {payments.map((payment) => (
        <article
          key={payment.id}
          className="payment-review-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:p-7"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {payment.user.name || "Unknown user"}
              </h2>

              <p className="text-sm text-slate-600 dark:text-slate-300">
                {payment.user.email ?? "Mobile account"}
              </p>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Submitted:{" "}
                {new Date(payment.createdAt)
                  .toISOString()
                  .replace("T", " ")
                  .slice(0, 19)}{" "}
                UTC
              </p>
            </div>

            <div className="text-left md:text-right">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {payment.currency} {payment.amount}
              </p>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                {payment.method} · {payment.status}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-900 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Transaction reference
              </p>

              <p className="mt-1 break-all font-mono text-sm text-slate-900 dark:text-slate-100">
                {payment.transactionRef || "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Payer reference
              </p>

              <p className="mt-1 break-all text-sm text-slate-900 dark:text-slate-100">
                {payment.payerReference || "Not provided"}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <label
              htmlFor={`admin-note-${payment.id}`}
              className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
            >
              Admin note (optional)
            </label>

            <textarea
              id={`admin-note-${payment.id}`}
              value={notes[payment.id] ?? ""}
              onChange={(event) =>
                setNotes((current) => ({
                  ...current,
                  [payment.id]: event.target.value,
                }))
              }
              maxLength={1000}
              rows={2}
              placeholder="Enter your review note..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-900"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busyId !== null}
              onClick={() => review(payment.id, "confirm")}
              className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {busyId === payment.id ? "Processing..." : "Confirm payment"}
            </button>

            <button
              type="button"
              disabled={busyId !== null}
              onClick={() => review(payment.id, "reject")}
              className="rounded-xl border border-red-300 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
            >
              Reject payment
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}