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
    name: string;
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
          ? "Payment confirmed. The item has been removed from this review queue."
          : "Payment rejected and removed from this review queue.",
      );
    } catch {
      setMessage("Could not contact the server. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  if (payments.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8">
        <h2 className="text-xl font-semibold text-slate-900">
          No payments awaiting review
        </h2>
        <p className="mt-2 text-slate-600">
          Submitted QR payment references will appear here.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      {message && (
        <p
          role="status"
          className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700"
        >
          {message}
        </p>
      )}

      {payments.map((payment) => (
        <article
          key={payment.id}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {payment.user.name}
              </h2>
              <p className="text-sm text-slate-600">{payment.user.email ?? "Mobile account"}</p>
              <p className="mt-2 text-sm text-slate-500">
                Submitted: {new Date(payment.createdAt).toISOString().replace("T", " ").slice(0, 19)} UTC
              </p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-2xl font-bold text-slate-900">
                {payment.currency} {payment.amount}
              </p>
              <p className="text-sm text-slate-500">
                {payment.method} · {payment.status}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 rounded-xl bg-slate-50 p-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">
                Transaction reference
              </p>
              <p className="mt-1 break-all font-mono text-sm text-slate-900">
                {payment.transactionRef || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">
                Payer reference
              </p>
              <p className="mt-1 break-all text-sm text-slate-900">
                {payment.payerReference || "Not provided"}
              </p>
            </div>
          </div>

          <label
            htmlFor={`note-${payment.id}`}
            className="mt-5 block text-sm font-medium text-slate-700"
          >
            Admin note (optional)
          </label>
          <textarea
            id={`note-${payment.id}`}
            value={notes[payment.id] ?? ""}
            onChange={(event) =>
              setNotes((current) => ({
                ...current,
                [payment.id]: event.target.value,
              }))
            }
            maxLength={1000}
            rows={2}
            className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-slate-500"
            placeholder="Record the verification result or rejection reason"
          />

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
              className="rounded-xl border border-red-300 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Reject payment
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
