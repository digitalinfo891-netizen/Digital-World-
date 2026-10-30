import Link from "next/link";

export default function AccountPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/dashboard" className="text-sm font-semibold text-emerald-700 hover:underline">← Dashboard</Link>
      <section className="mt-6 rounded-3xl bg-gradient-to-br from-pink-100 to-white p-8 shadow-lg">
        <p className="text-sm font-bold uppercase tracking-wider text-pink-700">Profile and settings</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">My Account</h1>
        <p className="mt-3 text-slate-600">Manage your Digital World account and check your learning access.</p>
        <div className="mt-8 rounded-2xl border border-pink-200 bg-white/80 p-6">
          <h2 className="text-lg font-bold text-slate-900">Account overview</h2>
          <p className="mt-2 text-sm text-slate-600">Your current account information is available on the dashboard. Profile editing and account settings are not connected on this page yet.</p>
          <Link href="/dashboard" className="mt-5 inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">View dashboard</Link>
        </div>
        <Link href="/payment" className="mt-5 inline-flex rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800">Payment and access</Link>
      </section>
    </main>
  );
}

