"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Gift, Users, Clock, Award, AlertTriangle, RefreshCw, ChevronLeft, ChevronRight, Mail, Phone, CalendarDays } from "lucide-react";

type ReferralStatus = "PENDING" | "REWARDED" | "LIMIT_REACHED" | "REVIEW_NEEDED";

type ReferralItem = {
  learnerId: string;
  learnerName: string;
  learnerEmail: string | null;
  learnerPhone: string | null;
  learnerCreatedAt: string;
  referrerId: string;
  referrerName: string;
  referrerEmail: string | null;
  referrerCode: string | null;
  confirmedPaymentAt: string | null;
  rewardId: string | null;
  rewardPoints: number | null;
  rewardCreatedAt: string | null;
  referrerRewardCount: number;
  status: ReferralStatus;
};

type ApiResponse = {
  referrals: ReferralItem[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  counts: { total: number; pending: number; rewarded: number; limitReached: number; reviewNeeded: number };
};

export default function ReferralsManager() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReferrals = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ search, status, page: String(page) });
      const response = await fetch(`/api/admin/referrals?${params.toString()}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load referrals.");
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load referrals.");
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadReferrals(); }, 300);
    return () => window.clearTimeout(timer);
  }, [loadReferrals]);

  function changeStatus(value: string) {
    setStatus(value);
    setPage(1);
  }

  const stats = [
    { label: "Total Referrals", value: data?.counts.total ?? 0, icon: Users },
    { label: "Pending", value: data?.counts.pending ?? 0, icon: Clock },
    { label: "Rewarded", value: data?.counts.rewarded ?? 0, icon: Award },
    { label: "Limit Reached", value: data?.counts.limitReached ?? 0, icon: Gift },
    { label: "Review Needed", value: data?.counts.reviewNeeded ?? 0, icon: AlertTriangle },
  ];

  const statusStyle: Record<ReferralStatus, string> = {
    PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
    REWARDED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    LIMIT_REACHED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
    REVIEW_NEEDED: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
  };

  const statusLabel: Record<ReferralStatus, string> = {
    PENDING: "Pending", REWARDED: "Rewarded", LIMIT_REACHED: "Limit reached", REVIEW_NEEDED: "Review needed",
  };

  return (
    <div className="referrals-management-page space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-blue-600">ADMINISTRATION</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Referral Management</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Monitor referred learners, qualifying payments and referral rewards.</p>
        </div>
        <button type="button" onClick={() => void loadReferrals()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((item) => { const Icon = item.icon; return (
          <article key={item.label} className="rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-700 to-blue-950 p-5 text-white shadow-lg shadow-blue-950/10">
            <div className="flex items-center justify-between"><p className="text-sm font-semibold text-blue-100">{item.label}</p><Icon size={21} className="text-blue-200" /></div>
            <p className="mt-3 text-3xl font-extrabold">{item.value.toLocaleString()}</p>
          </article>
        ); })}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search learner, referrer, email, mobile or referral code..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          </div>
          <select value={status} onChange={(event) => changeStatus(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            <option value="ALL">All Referrals</option>
            <option value="PENDING">Pending</option>
            <option value="REWARDED">Rewarded</option>
            <option value="LIMIT_REACHED">Limit Reached</option>
            <option value="REVIEW_NEEDED">Review Needed</option>
          </select>
        </div>
      </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</div>}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <h2 className="font-bold text-slate-900 dark:text-white">Referral Records</h2>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{data?.pagination.total ?? 0} records</span>
        </div>
        {loading && !data ? <div className="p-12 text-center text-sm text-slate-500">Loading referrals...</div> : data?.referrals.length === 0 ? (
          <div className="p-12 text-center"><Gift className="mx-auto mb-3 text-slate-400" size={32} /><p className="font-bold text-slate-800 dark:text-white">No referrals found</p><p className="mt-1 text-sm text-slate-500">Try changing your search or status filter.</p></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400"><tr><th className="px-5 py-4">Referred Learner</th><th className="px-5 py-4">Referrer</th><th className="px-5 py-4">Referral Status</th><th className="px-5 py-4">Qualifying Payment</th><th className="px-5 py-4">Reward</th><th className="px-5 py-4">Joined</th></tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data?.referrals.map((item) => (
                    <tr key={item.learnerId} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/60">
                      <td className="px-5 py-4"><p className="font-bold text-slate-900 dark:text-white">{item.learnerName}</p><p className="mt-1 flex items-center gap-2 text-xs text-slate-500"><Mail size={13} />{item.learnerEmail || "No email"}</p><p className="mt-1 flex items-center gap-2 text-xs text-slate-500"><Phone size={13} />{item.learnerPhone || "No mobile"}</p></td>
                      <td className="px-5 py-4"><p className="font-semibold text-slate-800 dark:text-slate-200">{item.referrerName}</p><p className="mt-1 text-xs text-slate-500">{item.referrerEmail || "No email"}</p><p className="mt-1 text-xs font-semibold text-blue-600">Code: {item.referrerCode || "Not available"}</p><p className="mt-1 text-xs text-slate-500">{item.referrerRewardCount}/3 rewards used</p></td>
                      <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[item.status]}`}>{statusLabel[item.status]}</span></td>
                      <td className="px-5 py-4"><p className="text-slate-700 dark:text-slate-300">{item.confirmedPaymentAt ? new Date(item.confirmedPaymentAt).toLocaleDateString() : "Not confirmed"}</p></td>
                      <td className="px-5 py-4"><p className="font-bold text-slate-800 dark:text-slate-200">{item.rewardPoints !== null ? `${item.rewardPoints} points` : "—"}</p><p className="mt-1 text-xs text-slate-500">{item.rewardCreatedAt ? new Date(item.rewardCreatedAt).toLocaleDateString() : "No reward yet"}</p></td>
                      <td className="px-5 py-4"><p className="flex items-center gap-2 whitespace-nowrap text-slate-600 dark:text-slate-300"><CalendarDays size={14} />{new Date(item.learnerCreatedAt).toLocaleDateString()}</p></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">Page {data?.pagination.page ?? 1} of {Math.max(1, data?.pagination.totalPages ?? 1)} · {data?.pagination.pageSize ?? 25} records per page</p>
              <div className="flex items-center gap-2">
                <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Previous page"><ChevronLeft size={18} /></button>
                <button type="button" disabled={page >= (data?.pagination.totalPages ?? 1) || loading} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Next page"><ChevronRight size={18} /></button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
