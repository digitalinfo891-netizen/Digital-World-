"use client";

import Image from "next/image";
import { useState } from "react";

type PaymentInfo = {
  id: string;
  amount: string;
  currency: string;
  status: string;
};

export default function PaymentForm({
  initialPayment,
  hasAccess,
}: {
  initialPayment: PaymentInfo | null;
  hasAccess: boolean;
}) {
  const [payment, setPayment] = useState<PaymentInfo | null>(initialPayment);
  const [transactionRef, setTransactionRef] = useState("");
  const [payerReference, setPayerReference] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function createPayment() {
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Unable to create payment.");

      setPayment(data.payment);
      setMessage(data.message || "Payment request created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  async function submitReference(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!payment) return;

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/payments/submit-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: payment.id,
          transactionRef: transactionRef.trim(),
          payerReference: payerReference.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Submission failed.");

      setPayment(data.payment);
      setMessage(data.message || "Reference submitted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900" style={{ width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
      <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" style={{ width: "100%", maxWidth: "672px", boxSizing: "border-box" }}>
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
          DIGITAL WORD
        </p>
        <h1 className="mt-3 text-3xl font-bold">Lifetime learning access</h1>
        <p className="mt-3 text-slate-600">
          One payment of 190 INR for lifetime access to the included courses.
        </p>

        <div className="mt-6 rounded-xl bg-slate-50 p-5">
          <p className="text-sm text-slate-500">One-time price</p>
          <p className="mt-1 text-4xl font-bold">190 INR</p>
          <p className="mt-2 text-sm text-slate-600">
            No recurring subscription.
          </p>
        </div>

        {hasAccess ? (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
            Your lifetime access is active.
          </div>
        ) : (
          <>
            {!payment ? (
              <button
                type="button"
                onClick={createPayment}
                disabled={busy}
                className="mt-6 w-full rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "auto", minWidth: "220px", minHeight: "44px", backgroundColor: "#4f46e5", color: "#ffffff", padding: "10px 18px", borderRadius: "8px", border: "none", cursor: busy ? "wait" : "pointer" }}
              >
                {busy ? "Please wait..." : "Create 190 payment request"}
              </button>
            ) : (
              <div className="mt-6 rounded-xl border border-slate-200 p-5" style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}>
                <p className="text-sm text-slate-500">Payment request ID</p>
                <p className="break-all font-mono text-sm">{payment.id}</p>

                <p className="mt-4 text-sm text-slate-500">Current status</p>
                <p className="mt-1 font-semibold">{payment.status.replaceAll("_", " ")}</p>

                {payment.status === "PENDING" && (
                  <>
                    <div className="mt-5 grid gap-6 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 sm:items-center" style={{ width: "100%", minWidth: 0, boxSizing: "border-box", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))" }}>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-slate-900">
                          Scan to pay 190
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          One-time payment for lifetime access
                        </p>
                        <Image
                          src="/images/upi-qr.png"
                          alt="UPI payment QR code for DIGITAL WORD"
                          width={260}
                          height={260}
                          priority
                          className="mx-auto mt-4 rounded-lg border border-slate-200" style={{ display: "block", width: "260px", maxWidth: "100%", height: "auto", objectFit: "contain" }}
                        />
                      </div>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-slate-500">Payee name</p>
                          <p className="font-semibold text-slate-900">Gohil</p>
                        </div>
                        <div>
                          <p className="text-slate-500">UPI ID</p>
                          <p className="break-all font-semibold text-slate-900">Test@oksbi</p>
                        </div>
                        <p className="rounded-lg bg-amber-50 p-3 text-amber-900">
                          Before paying, verify that your UPI app displays the
                          correct recipient and 190 amount. Do not pay if the
                          details do not match.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={submitReference} className="mt-8 flex w-full flex-col gap-5 pb-4" style={{ display: "flex", flexDirection: "column", width: "100%", minWidth: 0, gap: "20px", paddingBottom: "16px" }}>
                      <div>
                        <label htmlFor="transactionRef" className="mb-1 block text-sm font-medium">
                          Transaction / UTR reference
                        </label>
                        <input
                          id="transactionRef"
                          value={transactionRef}
                          onChange={(event) => setTransactionRef(event.target.value)}
                          minLength={4}
                          maxLength={200}
                          required
                          className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          placeholder="Enter the payment reference"
                        />
                      </div>

                      <div>
                        <label htmlFor="payerReference" className="mb-1 block text-sm font-medium">
                          Payer reference (optional)
                        </label>
                        <input
                          id="payerReference"
                          value={payerReference}
                          onChange={(event) => setPayerReference(event.target.value)}
                          maxLength={200}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          placeholder="Your payer name or reference"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={busy}
                        style={{ display: "block", width: "100%", minHeight: "48px", padding: "12px 20px", backgroundColor: "#0f172a", color: "#ffffff", borderRadius: "8px", fontWeight: 600, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1 }}
                      >
                        {busy ? "Submitting..." : "Submit for verification"}
                      </button>
                    </form>
                  </>
                )}

                {payment.status === "UNDER_REVIEW" && (
                  <p className="mt-4 text-sm text-amber-700">
                    Your reference is awaiting administrator verification.
                    Course access remains locked until payment is confirmed.
                  </p>
                )}

                {payment.status === "REJECTED" && (
                  <p className="mt-4 text-sm text-red-700">
                    This payment was rejected. Contact the administrator for
                    assistance before creating another payment request.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {message && (
          <p role="status" className="mt-4 rounded-lg bg-slate-100 p-3 text-sm">
            {message}
          </p>
        )}

        <a href="/dashboard" className="mt-6 inline-block text-sm font-medium text-indigo-700 hover:underline">
          Back to dashboard
        </a>
      </section>
    </main>
  );
}


