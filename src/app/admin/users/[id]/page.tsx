
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  Users,
  CreditCard,
  Wallet,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
} from "lucide-react";

type Payment = {
  id: string;
  method: string;
  status: string;
  amount: string | number;
  currency: string;
  network: string | null;
  transactionRef: string | null;
  providerReference: string | null;
  proofUrl: string | null;
  createdAt: string;
  verifiedAt: string | null;
};

type Referral = {
  id: string;
  name: string;
  email: string | null;
  referralCode: string | null;
  isActive: boolean;
  createdAt: string;
};

type Profile = {
  id: string;
  name: string;
  email: string | null;
  countryCode: string | null;
  phoneE164: string | null;
  postalCode: string | null;
  role: string;
  emailVerified: string | null;
  isActive: boolean;
  referralCode: string | null;
  referredById: string | null;
  createdAt: string;
  updatedAt: string;
  referrer: {
    id: string;
    name: string;
    referralCode: string | null;
  } | null;
  referrals: Referral[];
  entitlement: {
    id: string;
    paymentId: string;
    grantedAt: string;
    revokedAt: string | null;
    reason: string | null;
  } | null;
  payments: Payment[];
  _count: {
    payments: number;
    referrals: number;
  };
};

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(amount: string | number, currency: string) {
  const value = Number(amount);
  return `${currency} ${Number.isFinite(value) ? value.toFixed(2) : amount}`;
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      }`}
    >
      {active ? <CheckCircle size={13} /> : <XCircle size={13} />}
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    VERIFIED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    FAILED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };

  const normalized = status.toUpperCase();

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        styles[normalized] ||
        "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
      }`}
    >
      {status}
    </span>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-gray-800 dark:text-gray-100">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(userId)}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load user profile.");
      }

      setProfile(data.user);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
          <RefreshCw className="animate-spin" size={22} />
          Loading user profile...
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
        <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
          <AlertCircle size={22} />
          <p>{error || "User not found."}</p>
        </div>
        <button
          onClick={loadProfile}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  const cards = [
    {
      label: "Total Payments",
      value: profile._count.payments,
      icon: CreditCard,
    },
    {
      label: "Total Referrals",
      value: profile._count.referrals,
      icon: Users,
    },
    {
      label: "Account Status",
      value: profile.isActive ? "Active" : "Inactive",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="users-management-page space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/users"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            <ArrowLeft size={16} />
            Back to Users
          </Link>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            User Profile
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Account information, referrals and payment history
          </p>
        </div>

        <button
          onClick={loadProfile}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-3xl font-bold text-white">
            {profile.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {profile.name}
              </h2>
              <StatusBadge active={profile.isActive} />
            </div>

            <p className="mt-1 break-all text-sm text-gray-500 dark:text-gray-400">
              {profile.email || "No email registered"}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {profile.role}
              </span>

              {profile.referralCode && (
                <span className="rounded-lg bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  Referral: {profile.referralCode}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {card.label}
                </p>
                <Icon className="text-blue-600 dark:text-blue-400" size={20} />
              </div>

              <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
                {card.value}
              </p>
            </article>
          );
        })}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
          <User size={19} />
          Personal Information
        </h3>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem icon={User} label="Full Name" value={profile.name} />
          <InfoItem icon={Mail} label="Email Address" value={profile.email || "Not provided"} />
          <InfoItem icon={Phone} label="Phone Number" value={profile.phoneE164 || "Not provided"} />
          <InfoItem icon={Wallet} label="Country Code" value={profile.countryCode || "—"} />
          <InfoItem icon={User} label="Postal Code" value={profile.postalCode || "—"} />
          <InfoItem icon={Calendar} label="Registered On" value={formatDate(profile.createdAt)} />
          <InfoItem icon={Calendar} label="Last Updated" value={formatDate(profile.updatedAt)} />
          <InfoItem
            icon={ShieldCheck}
            label="Email Verification"
            value={profile.emailVerified ? formatDate(profile.emailVerified) : "Not verified"}
          />
          <InfoItem icon={ShieldCheck} label="User Role" value={profile.role} />
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
          <Users size={19} />
          Referral Information
        </h3>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Referral Code
            </p>
            <p className="mt-2 font-bold text-gray-900 dark:text-white">
              {profile.referralCode || "Not assigned"}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Referred By
            </p>

            {profile.referrer ? (
              <Link
                href={`/admin/users/${profile.referrer.id}`}
                className="mt-2 inline-block font-bold text-blue-600 hover:underline dark:text-blue-400"
              >
                {profile.referrer.name}
              </Link>
            ) : (
              <p className="mt-2 font-bold text-gray-900 dark:text-white">
                Direct Registration
              </p>
            )}
          </div>
        </div>

        <h4 className="mb-3 font-semibold text-gray-800 dark:text-gray-100">
          Referred Users ({profile._count.referrals})
        </h4>

        {profile.referrals.length === 0 ? (
          <p className="rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            No referrals found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Referral Code</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Registered</th>
                </tr>
              </thead>

              <tbody>
                {profile.referrals.map((referral) => (
                  <tr
                    key={referral.id}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="px-3 py-3">
                      <Link
                        href={`/admin/users/${referral.id}`}
                        className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {referral.name}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-gray-600 dark:text-gray-300">
                      {referral.email || "—"}
                    </td>
                    <td className="px-3 py-3 text-gray-600 dark:text-gray-300">
                      {referral.referralCode || "—"}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge active={referral.isActive} />
                    </td>
                    <td className="px-3 py-3 text-gray-600 dark:text-gray-300">
                      {formatDate(referral.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
          <ShieldCheck size={19} />
          Access Entitlement
        </h3>

        {profile.entitlement ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <InfoItem
              icon={CheckCircle}
              label="Granted On"
              value={formatDate(profile.entitlement.grantedAt)}
            />
            <InfoItem
              icon={profile.entitlement.revokedAt ? XCircle : CheckCircle}
              label="Entitlement Status"
              value={profile.entitlement.revokedAt ? "Revoked" : "Active"}
            />
            <InfoItem
              icon={CreditCard}
              label="Payment ID"
              value={profile.entitlement.paymentId}
            />
            <InfoItem
              icon={Clock}
              label="Revoked On"
              value={formatDate(profile.entitlement.revokedAt)}
            />
            <InfoItem
              icon={AlertCircle}
              label="Reason"
              value={profile.entitlement.reason || "—"}
            />
          </div>
        ) : (
          <p className="rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            No entitlement has been assigned to this user.
          </p>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
          <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            <CreditCard size={19} />
            Payment History ({profile._count.payments})
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Latest payment records for this user
          </p>
        </div>

        {profile.payments.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No payment records found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Method</th>
                  <th className="px-5 py-4">Transaction Reference</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Proof</th>
                </tr>
              </thead>

              <tbody>
                {profile.payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-t border-gray-100 dark:border-gray-800"
                  >
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white">
                      {formatAmount(payment.amount, payment.currency)}
                    </td>
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                      {payment.method}
                      {payment.network ? ` (${payment.network})` : ""}
                    </td>
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                      <span
                        className="block max-w-[220px] truncate"
                        title={payment.transactionRef || payment.providerReference || ""}
                      >
                        {payment.transactionRef || payment.providerReference || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <PaymentBadge status={payment.status} />
                    </td>
                    <td className="px-5 py-4">
                      {payment.proofUrl ? (
                        <a
                          href={payment.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline dark:text-blue-400"
                        >
                          View <ExternalLink size={13} />
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
