"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RewardRedemptionForm({
  availablePoints,
}: {
  availablePoints: number;
}) {
  const router = useRouter();

  const [points, setPoints] = useState("");
  const [benefit, setBenefit] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const requestedPoints = Number(points);

    if (!Number.isInteger(requestedPoints) || requestedPoints <= 0) {
      setError("Please enter a valid positive points amount.");
      return;
    }

    if (requestedPoints > availablePoints) {
      setError("You do not have enough available points.");
      return;
    }

    if (benefit.trim().length < 3) {
      setError("Please describe the benefit you want to redeem.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/dashboard/rewards/redemptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          points: requestedPoints,
          benefit: benefit.trim(),
          note: note.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to submit your request.");
        return;
      }

      setSuccess("Your redemption request has been submitted successfully.");
      setPoints("");
      setBenefit("");
      setNote("");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            Redeem your rewards
          </p>
          <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
            Request a Redemption
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Describe the benefit you would like to receive.
          </p>
        </div>

        <div className="rounded-xl bg-emerald-50 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
            Available points
          </p>
          <p className="mt-1 text-3xl font-extrabold text-emerald-900">
            {availablePoints}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label htmlFor="redemption-points" className="mb-2 block text-sm font-semibold text-slate-700">
            Points to redeem
          </label>
          <input
            id="redemption-points"
            type="number"
            min="1"
            max={availablePoints}
            step="1"
            required
            value={points}
            onChange={(event) => setPoints(event.target.value)}
            placeholder="Enter points"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div>
          <label htmlFor="redemption-benefit" className="mb-2 block text-sm font-semibold text-slate-700">
            What would you like to redeem?
          </label>
          <input
            id="redemption-benefit"
            type="text"
            minLength={3}
            maxLength={120}
            required
            value={benefit}
            onChange={(event) => setBenefit(event.target.value)}
            placeholder="Example: Course discount, learning voucher, reward..."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div>
          <label htmlFor="redemption-note" className="mb-2 block text-sm font-semibold text-slate-700">
            Additional note (optional)
          </label>
          <textarea
            id="redemption-note"
            rows={3}
            maxLength={1000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Add any details about your request..."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || availablePoints <= 0}
          className="w-full rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {loading ? "Submitting..." : "Submit Redemption Request"}
        </button>

        <p className="text-xs leading-5 text-slate-500">
          Requested points remain reserved while your request is pending.
          Points are deducted only after administrator approval.
        </p>
      </form>
    </section>
  );
}
