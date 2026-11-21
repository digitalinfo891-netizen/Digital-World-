
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ClipboardCheck, Wallet, Users, BookOpen,
  Gift, Settings, Menu, X, GraduationCap, Globe, ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";
import LogoutButton from "@/components/auth/LogoutButton";

type Props = {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  role: string;
};

type Item = {
  label: string;
  href?: string;
  icon: LucideIcon;
  comingSoon?: boolean;
};

const items: Item[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Payment Verification", href: "/admin/payments", icon: ClipboardCheck },
  { label: "Rewards & USDT", href: "/admin/rewards/usdt", icon: Wallet },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Courses", href: "/admin/courses", icon: BookOpen },
  { label: "Referrals", href: "/admin/referrals", icon: Gift },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminShell({ children, userName, userEmail, role }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigation = (
    <div className="flex h-full flex-col">
      <div className="flex h-[76px] items-center gap-3 border-b border-slate-700 px-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
          <GraduationCap size={23} />
        </span>
        <span>
          <span className="block text-base font-black text-white">DIGITAL WORLD</span>
          <span className="block text-[10px] font-bold tracking-widest text-slate-300">ADMINISTRATION</span>
        </span>
        <button type="button" onClick={() => setMobileOpen(false)}
          className="ml-auto rounded-lg p-2 text-slate-300 hover:bg-slate-700 lg:hidden"
          aria-label="Close admin navigation">
          <X size={20} />
        </button>
      </div>

      <nav aria-label="Admin navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        <p className="mb-3 px-3 text-[10px] font-extrabold tracking-widest text-slate-400">ADMIN MENU</p>
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/admin"
            ? pathname === "/admin"
            : Boolean(item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`)));

          if (item.comingSoon || !item.href) {
            return (
              <div key={item.label} aria-disabled="true"
                className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-500">
                <Icon size={19} />
                <span className="flex-1">{item.label}</span>
                <span className="text-[9px] font-bold">SOON</span>
              </div>
            );
          }

          return (
            <Link key={item.href} href={item.href}
              onClick={() => setMobileOpen(false)}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                active ? "bg-blue-600 text-white shadow-md" : "text-slate-200 hover:bg-slate-700 hover:text-white"
              }`}>
              <Icon size={19} />
              <span>{item.label}</span>
              {active && <ChevronRight size={15} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-700 p-4">
        <div className="mb-3 rounded-xl bg-slate-700/70 p-3">
          <p className="truncate text-sm font-bold text-white">{userName}</p>
          <p className="mt-1 truncate text-xs text-slate-300">{userEmail || "Administrator account"}</p>
          <p className="mt-2 text-[10px] font-bold uppercase text-blue-300">{role.replaceAll("_", " ")}</p>
        </div>
        <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700 hover:text-white">
          <Globe size={18} /> Visit Website
        </Link>
      </div>
    </div>
  );

  return (
    <div className="digital-admin-shell min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r border-slate-700 admin-sidebar-bg lg:block">
        {navigation}
      </aside>

      {mobileOpen && (
        <>
          <button type="button" aria-label="Close admin navigation overlay"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden" />
          <aside className="fixed inset-y-0 left-0 z-50 w-[285px] max-w-[85vw] border-r border-slate-700 admin-sidebar-bg shadow-2xl lg:hidden">
            {navigation}
          </aside>
        </>
      )}

      <div className="min-h-screen lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex min-h-[76px] items-center justify-between gap-3 border-b border-slate-700 admin-topbar-bg px-4 shadow-sm backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-slate-600 p-2 text-white hover:bg-slate-700 lg:hidden"
              aria-label="Open admin navigation" aria-expanded={mobileOpen}>
              <Menu size={21} />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white sm:text-base">Welcome, {userName}</p>
              <p className="hidden text-xs text-slate-300 sm:block">Digital World administration workspace</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>

        <main className="digital-admin-content admin-workspace min-h-[calc(100vh-76px)] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
