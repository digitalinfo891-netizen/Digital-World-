"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";


type Member = {
  id: string;
  name: string;
  createdAt: string | Date;
  level: number;
};

type Details = {
  id: string;
  name: string;
  email: string;
  referralCode: string | null;
  isActive: boolean;
  createdAt: string;
  level: number;
  sponsorName: string | null;
  directReferrals: number;
};

export default function ReferralMemberCard({
  member,
}: {
  member: Member;
}) {
  const [open, setOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [details, setDetails] = useState<Details | null>(null);



  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  async function showDetails() {
    setOpen(true);
    setError("");

    if (details) return;

    setLoading(true);

    try {
      const response = await fetch(
        `/api/dashboard/referrals/${encodeURIComponent(member.id)}`,
        {
          method: "GET",
          cache: "no-store",
          headers: { Accept: "application/json" },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to load member details.",
        );
      }

      setDetails(result.member as Details);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load member details.",
      );
    } finally {
      setLoading(false);
    }
  }

  const joined = new Date(member.createdAt).toLocaleDateString("en-IN");

  return (
    <>
      <button
        type="button"
        onClick={() => { window.alert("View button click is working"); void showDetails(); }}
        aria-label={`View details for ${member.name}`}
        className="group w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 font-extrabold text-white">
            {member.name.trim().charAt(0).toUpperCase() || "M"}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block break-words font-bold text-slate-900">
              {member.name}
            </span>
            <span className="mt-1 block text-xs text-slate-500">
              Level {member.level} · Joined {joined}
            </span>
          </span>

          <span className="shrink-0 text-sm font-bold text-emerald-700">
            View →
          </span>
        </span>

        <span className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-xs text-slate-500">
            Referral network member
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            Level {member.level}
          </span>
        </span>
      </button>

      {open && typeof document !== "undefined" && createPortal((
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`member-title-${member.id}`}
            className="relative my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl"
          >
            <header className="flex shrink-0 items-start justify-between gap-4 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 p-5 text-white sm:p-7">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-100">
                  Referral network · Level {member.level}
                </p>
                <h2
                  id={`member-title-${member.id}`}
                  className="mt-2 break-words text-2xl font-extrabold"
                >
                  {member.name}
                </h2>
                <p className="mt-2 text-sm text-emerald-50">
                  Member profile and referral information
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close member details"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-2xl hover:bg-white/25"
              >
                ×
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-7">
              {loading && (
                <div className="py-10 text-center">
                  <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />
                  <p className="mt-4 text-sm text-slate-600">
                    Loading member details…
                  </p>
                </div>
              )}

              {error && (
                <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">
                  <p>{error}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setDetails(null);
                      void showDetails();
                    }}
                    className="mt-3 rounded-lg bg-red-700 px-4 py-2 font-semibold text-white"
                  >
                    Try again
                  </button>
                </div>
              )}

              {details && (
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    { label: "Email address", value: details.email },
                    {
                      label: "Account status",
                      value: details.isActive ? "Active" : "Inactive",
                    },
                    {
                      label: "Referral code",
                      value: details.referralCode || "Not assigned",
                    },
                    {
                      label: "Referral level",
                      value: `Level ${details.level} of 6`,
                    },
                    {
                      label: "Joined on",
                      value: new Date(details.createdAt).toLocaleDateString("en-IN"),
                    },
                    {
                      label: "Direct referrals",
                      value: String(details.directReferrals),
                    },
                    {
                      label: "Referred by",
                      value: details.sponsorName || "Original member",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {item.label}
                      </dt>
                      <dd className="mt-2 break-words text-sm font-bold text-slate-900">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>

            <footer className="flex shrink-0 justify-end border-t border-slate-100 bg-white p-4 sm:px-7">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white hover:bg-emerald-800"
              >
                Close
              </button>
            </footer>
          </section>
        </div>
        ),
        document.body,
      )}
    </>
  );
}









