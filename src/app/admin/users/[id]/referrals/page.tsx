
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Users,
  UserCheck,
  UserX,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Gift,
  Mail,
  Phone,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";

type ReferralUser = {
  id: string;
  name: string;
  email: string | null;
  phoneE164: string | null;
  role: string;
  isActive: boolean;
  referralCode: string | null;
  createdAt: string;
  _count: {
    referrals: number;
    payments: number;
  };
};

type Referrer = {
  id: string;
  name: string;
  email: string | null;
  referralCode: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    referrals: number;
  };
};

type ReferralResponse = {
  referrer: Referrer;
  referrals: ReferralUser[];
  counts: {
    total: number;
    active: number;
    inactive: number;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export default function UserReferralsPage() {
  const params = useParams();
  const userId = params.id as string;

  const [data, setData] = useState<ReferralResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const loadReferrals = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams({
        page: String(page),
        search,
      });

      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(userId)}/referrals?${query}`,
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load referrals.");
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, [userId, page, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadReferrals();
    }, 300);

    return () => clearTimeout(timer);
  }, [loadReferrals]);

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const totalPages = data?.pagination.totalPages ?? 1;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <Link
          href={`/admin/users/${encodeURIComponent(userId)}`}
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          <ArrowLeft size={16} />
          Back to User Profile
        </Link>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Referral Management
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              View and manage members referred by this user.
            </p>
          </div>

          <button
            onClick={() => void loadReferrals()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <p>{error}</p>
          <button
            onClick={() => void loadReferrals()}
            className="mt-2 font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      {data && (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Referral owner
                </p>
                <Link
                  href={`/admin/users/${encodeURIComponent(data.referrer.id)}`}
                  className="mt-1 inline-block text-xl font-bold text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                >
                  {data.referrer.name}
                </Link>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {data.referrer.email || "No email registered"}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 px-4 py-3 dark:bg-blue-950/40">
                <p className="text-xs text-blue-600 dark:text-blue-300">
                  Referral Code
                </p>
                <p className="mt-1 flex items-center gap-2 font-bold text-blue-800 dark:text-blue-200">
                  <Gift size={17} />
                  {data.referrer.referralCode || "Not assigned"}
                </p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              title="Total Referrals"
              value={data.counts.total}
              icon={<Users size={21} />}
              color="blue"
            />
            <StatCard
              title="Active Members"
              value={data.counts.active}
              icon={<UserCheck size={21} />}
              color="green"
            />
            <StatCard
              title="Inactive Members"
              value={data.counts.inactive}
              icon={<UserX size={21} />}
              color="red"
            />
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-800 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">
                  Referred Members
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {data.pagination.total} members found
                </p>
              </div>

              <div className="relative w-full sm:max-w-xs">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search name, email or phone..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
                <RefreshCw size={18} className="animate-spin" />
                Loading referral members...
              </div>
            ) : data.referrals.length === 0 ? (
              <div className="p-12 text-center">
                <Users size={36} className="mx-auto text-slate-300" />
                <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">
                  No referral members found
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Referred members will appear here.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                      <tr>
                        <th className="px-5 py-4">Member</th>
                        <th className="px-5 py-4">Contact</th>
                        <th className="px-5 py-4">Role</th>
                        <th className="px-5 py-4">Joined</th>
                        <th className="px-5 py-4">Referrals</th>
                        <th className="px-5 py-4">Payments</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {data.referrals.map((member) => (
                        <tr
                          key={member.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-5 py-4">
                            <Link
                              href={`/admin/users/${encodeURIComponent(member.id)}`}
                              className="font-bold text-slate-900 hover:text-blue-600 hover:underline dark:text-white dark:hover:text-blue-400"
                            >
                              {member.name}
                            </Link>
                            <p className="mt-1 text-xs text-slate-400">
                              ID: {member.id}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                              {member.email && (
                                <p className="flex items-center gap-2">
                                  <Mail size={13} />
                                  {member.email}
                                </p>
                              )}
                              {member.phoneE164 && (
                                <p className="flex items-center gap-2">
                                  <Phone size={13} />
                                  {member.phoneE164}
                                </p>
                              )}
                              {!member.email && !member.phoneE164 && "—"}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                              <ShieldCheck size={14} />
                              {member.role.replaceAll("_", " ")}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-2">
                              <CalendarDays size={14} />
                              {formatDate(member.createdAt)}
                            </span>
                          </td>

                          <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200">
                            {member._count.referrals}
                          </td>

                          <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200">
                            {member._count.payments}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                member.isActive
                                  ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                                  : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                              }`}
                            >
                              {member.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <Link
                              href={`/admin/users/${encodeURIComponent(member.id)}`}
                              className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
                            >
                              View Profile
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col justify-between gap-3 border-t border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Page {data.pagination.page} of {totalPages}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={page <= 1 || loading}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40 dark:border-slate-700"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>

                    <button
                      onClick={() =>
                        setPage((current) => Math.min(totalPages, current + 1))
                      }
                      disabled={page >= totalPages || loading}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40 dark:border-slate-700"
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: "blue" | "green" | "red";
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300",
    green: "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-300",
    red: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </p>
        <div className={`rounded-xl p-2.5 ${styles[color]}`}>{icon}</div>
      </div>
      <p className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">
        {value.toLocaleString("en-IN")}
      </p>
    </article>
  );
}
