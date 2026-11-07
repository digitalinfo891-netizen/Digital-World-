"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ChartNoAxesCombined,
  UserRound,
  Wallet,
  Gift,
  Users,
  Activity,
  ShieldCheck,
  ClipboardCheck,
  Menu,
  X,
  GraduationCap,
  Globe,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";
import LogoutButton from "@/components/auth/LogoutButton";

type DashboardShellProps = {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  role: string;
  isAdmin: boolean;
};

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const learnerItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Courses", href: "/courses", icon: BookOpen },
  { label: "Learning Progress", href: "/progress", icon: ChartNoAxesCombined },
  { label: "My Account", href: "/account", icon: UserRound },
  { label: "Payments", href: "/payment", icon: Wallet },
  { label: "My Rewards", href: "/dashboard/rewards", icon: Gift },
  { label: "Invite & Earn", href: "/dashboard/inviteandearn", icon: Users },
  { label: "Activity", href: "/dashboard/activity", icon: Activity },
];

const adminItems: NavItem[] = [
  { label: "Admin Panel", href: "/admin", icon: ShieldCheck },
  { label: "Payment Verification", href: "/admin/payments", icon: ClipboardCheck },
];

export default function DashboardShell({
  children,
  userName,
  userEmail,
  role,
  isAdmin,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function renderNavItem(item: NavItem) {
    const Icon = item.icon;
    const active = isActive(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
          active
            ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
            : "text-slate-600 hover:bg-slate-100 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        }`}
      >
        <Icon size={19} className="shrink-0" />
        <span>{item.label}</span>
      </Link>
    );
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
        <Link
          href="/dashboard"
          className="flex items-center gap-3"
          onClick={() => setMobileOpen(false)}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <GraduationCap size={23} />
          </span>
          <span>
            <span className="block text-base font-black tracking-tight text-slate-900 dark:text-white">
              DIGITAL WORLD
            </span>
            <span className="block text-[10px] font-bold tracking-[0.15em] text-slate-500">
              LEARN. SKILL. GROW.
            </span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Close navigation"
        >
          <X size={21} />
        </button>
      </div>

      <nav
        aria-label="Dashboard navigation"
        className="flex-1 space-y-1 overflow-y-auto px-3 py-5"
      >
        <p className="mb-3 px-3 text-[10px] font-extrabold tracking-[0.18em] text-slate-400">
          LEARNING
        </p>

        {learnerItems.map(renderNavItem)}

        {isAdmin && (
          <>
            <div className="my-5 border-t border-slate-200 dark:border-slate-800" />
            <p className="mb-3 px-3 text-[10px] font-extrabold tracking-[0.18em] text-slate-400">
              ADMINISTRATION
            </p>
            {adminItems.map(renderNavItem)}
          </>
        )}
      </nav>

      <div className="shrink-0 border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="mb-3 min-w-0 rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
            {userName}
          </p>
          <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
            {userEmail || "Digital World member"}
          </p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
            {role.replaceAll("_", " ")}
          </p>
        </div>

        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Globe size={18} />
          Visit Website
        </Link>
      </div>
    </div>
  );

  return (
    <div className="dw-dashboard-shell">
      {/* Desktop sidebar */}
      <aside className="dw-dashboard-sidebar fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r lg:block">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <>
          <button
            type="button"
            aria-label="Close navigation overlay"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          />
          <aside className="dw-dashboard-sidebar fixed inset-y-0 left-0 z-50 w-[285px] max-w-[85vw] border-r shadow-2xl lg:hidden">
            {sidebar}
          </aside>
        </>
      )}

      <div className="min-h-screen lg:pl-[260px]">
        <header className="dw-dashboard-header sticky top-0 z-30 flex min-h-[76px] items-center justify-between gap-3 border-b px-4 shadow-sm backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800 lg:hidden"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
            >
              <Menu size={21} />
            </button>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                Welcome, {userName}
              </p>
              <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
                Your Digital World learning workspace
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {isAdmin && (
              <Link
                href="/admin/payments"
                className="hidden rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950 sm:inline-flex"
              >
                Payment Verification
              </Link>
            )}
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>

        <div className="dw-dashboard-content">
          {children}
        </div>
      </div>
    </div>
  );
}
