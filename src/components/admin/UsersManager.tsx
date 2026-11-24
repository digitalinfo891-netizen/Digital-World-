"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search, Users, UserCheck, UserX, RefreshCw,
  ChevronLeft, ChevronRight, ShieldCheck, Mail,
  Phone, CalendarDays, Gift, CreditCard,
} from "lucide-react";

type UserItem = {
  id: string;
  name: string;
  email: string | null;
  countryCode: string | null;
  phoneE164: string | null;
  postalCode: string | null;
  role: "LEARNER" | "ADMIN" | "SUPER_ADMIN";
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
  entitlement: {
    id: string;
    grantedAt: string;
    revokedAt: string | null;
    reason: string | null;
  } | null;
  _count: {
    payments: number;
    referrals: number;
  };
};

type ApiResponse = {
  users: UserItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  counts: {
    total: number;
    active: number;
    inactive: number;
  };
};

export default function UsersManager() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        search,
        role,
        status,
        page: String(page),
      });

      const response = await fetch(
        `/api/admin/users?${params.toString()}`,
        { cache: "no-store" },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load users.");
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load users.",
      );
    } finally {
      setLoading(false);
    }
  }, [search, role, status, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  function changeFilter(
    setter: (value: string) => void,
    value: string,
  ) {
    setter(value);
    setPage(1);
  }

  const stats = [
    {
      label: "Total Users",
      value: data?.counts.total ?? 0,
      icon: Users,
    },
    {
      label: "Active Users",
      value: data?.counts.active ?? 0,
      icon: UserCheck,
    },
    {
      label: "Inactive Users",
      value: data?.counts.inactive ?? 0,
      icon: UserX,
    },
  ];

  return (
    <div className="users-management-page space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            ADMINISTRATION
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Users Management
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Search, review and monitor registered platform users.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadUsers()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.label}
              className="rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-700 to-blue-950 p-5 text-white shadow-lg shadow-blue-950/10"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-blue-100">
                  {item.label}
                </p>
                <Icon size={21} className="text-blue-200" />
              </div>
              <p className="mt-3 text-3xl font-extrabold">
                {item.value.toLocaleString()}
              </p>
            </article>
          );
        })}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_190px_190px]">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search name, email, mobile or referral code..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <select
            value={role}
            onChange={(event) => changeFilter(setRole, event.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="ALL">All Roles</option>
            <option value="LEARNER">Learner</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>

          <select
            value={status}
            onChange={(event) => changeFilter(setStatus, event.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="ALL">All Account Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <h2 className="font-bold text-slate-900 dark:text-white">
            Registered Users
          </h2>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {data?.pagination.total ?? 0} records
          </span>
        </div>

        {loading && !data ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Loading users...
          </div>
        ) : data?.users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto mb-3 text-slate-400" size={32} />
            <p className="font-bold text-slate-800 dark:text-white">
              No users found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-4">User</th>
                    <th className="px-5 py-4">Contact</th>
                    <th className="px-5 py-4">Role / Status</th>
                    <th className="px-5 py-4">Referral</th>
                    <th className="px-5 py-4">Payments</th>
                    <th className="px-5 py-4">Entitlement</th>
                    <th className="px-5 py-4">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data?.users.map((user) => (
                    <tr key={user.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/60">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {user.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          ID: {user.id}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <Mail size={14} />
                          {user.email || "No email"}
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          <Phone size={13} />
                          {user.phoneE164 || "No mobile"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                          {user.role.replaceAll("_", " ")}
                        </span>
                        <p className={`mt-2 text-xs font-bold ${user.isActive ? "text-emerald-600" : "text-red-500"}`}>
                          {user.isActive ? "● Active" : "● Inactive"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                          <Gift size={14} />
                          {user.referralCode || "—"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {user._count.referrals} referrals
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                          <CreditCard size={15} />
                          {user._count.payments}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`text-xs font-bold ${user.entitlement && !user.entitlement.revokedAt ? "text-emerald-600" : "text-slate-500"}`}>
                          {user.entitlement
                            ? user.entitlement.revokedAt
                              ? "Revoked"
                              : "Granted"
                            : "Not granted"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="flex items-center gap-2 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          <CalendarDays size={14} />
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {user.emailVerified ? "Email verified" : "Email not verified"}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Page {data?.pagination.page ?? 1} of {data?.pagination.totalPages ?? 1}
                {" · "}25 users per page
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  disabled={page >= (data?.pagination.totalPages ?? 1) || loading}
                  onClick={() => setPage((value) => value + 1)}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Next page"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}