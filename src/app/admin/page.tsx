import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { ClipboardCheck, Wallet, ArrowUpRight, ShieldCheck } from "lucide-react";

export const instant = false;

export default async function AdminPage() {
  const user = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

  const cards = [
    {
      title: "Payment Verification",
      description: "Review submitted payment references and confirm eligible payments.",
      href: "/admin/payments",
      icon: ClipboardCheck,
      action: "Open payment reviews",
    },
    {
      title: "Rewards & USDT",
      description: "Review BEP20 withdrawal requests and record manually completed transfers.",
      href: "/admin/rewards/usdt",
      icon: Wallet,
      action: "Manage USDT withdrawals",
    },
  ];

  return (
    <div className="admin-dashboard mx-auto max-w-7xl space-y-6">
      <section className="rounded-3xl border border-white/15 bg-white/10 p-6 text-white shadow-xl backdrop-blur md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-200">
              Administration workspace
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              Welcome, {user.name || "Administrator"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              Manage Digital World operations, payment verification and reward withdrawals from one place.
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
            <ShieldCheck className="mb-3 text-blue-200" size={28} />
            <p className="text-xs text-slate-200">Account role</p>
            <p className="mt-1 font-bold text-white">{user.role.replaceAll("_", " ")}</p>
            <p className="mt-3 max-w-[220px] truncate text-xs text-slate-300">{user.email}</p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white">Administration modules</h2>
          <p className="mt-1 text-sm text-slate-200">Choose an available module to continue.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <Icon size={24} />
                  </span>
                  <ArrowUpRight className="text-slate-400 transition group-hover:text-blue-700" size={20} />
                </div>
                <h3 className="mt-5 text-xl font-bold text-slate-900">{card.title}</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{card.description}</p>
                <p className="mt-5 text-sm font-bold text-blue-700">{card.action} â†’</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

