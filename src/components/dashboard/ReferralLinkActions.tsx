"use client";

import { useState } from "react";

type ReferralLinkActionsProps = {
  referralUrl: string;
};

export default function ReferralLinkActions({
  referralUrl,
}: ReferralLinkActionsProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function copyReferralLink() {
    setCopied(false);
    setError("");

    try {
      const absoluteUrl = new URL(
        referralUrl,
        window.location.origin
      ).toString();

      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
    } catch {
      setError("Unable to copy automatically. Please copy the link manually.");
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={copyReferralLink}
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-700 px-5 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"
      >
        {copied ? "Referral link copied!" : "Copy referral link"}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      {copied && (
        <p role="status" className="mt-2 text-sm text-emerald-700">
          Share this link with the learner you invite.
        </p>
      )}
    </div>
  );
}
