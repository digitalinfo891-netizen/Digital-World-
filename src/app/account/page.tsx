import Link from "next/link";

export default function AccountPage() {
  return (
    <main className="dw-account-page mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <section className="dw-account-panel overflow-hidden rounded-3xl border border-blue-300/60 bg-gradient-to-br from-blue-600 via-blue-700 to-violet-600 dark:from-[#101b3b] dark:via-[#263f8e] dark:to-[#45216f] p-6 shadow-2xl shadow-blue-900/20 sm:p-10">

        <div className="max-w-4xl">
          <span className="inline-flex rounded-full border border-white/50 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] !text-white">
            Profile and settings
          </span>

          <h1 className="mt-5 text-3xl font-extrabold tracking-tight !text-white sm:text-4xl">
            My Account
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 !text-blue-50 sm:text-base">
            Manage your Digital World account and check your learning access.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-blue-200 bg-white p-6 shadow-lg shadow-blue-950/10 dark:border-blue-300/40">

          <h2 className="text-xl font-bold !text-slate-900">
            Account overview
          </h2>

          <p className="mt-2 text-sm leading-6 !text-slate-700">
            Your current account information is available on the dashboard.
            Profile editing and account settings are not connected on this page yet.
          </p>

          <Link
            href="/dashboard"
            className="mt-5 inline-flex items-center justify-center rounded-xl border border-blue-400 bg-blue-100 px-5 py-3 text-sm font-bold !text-blue-950 transition hover:bg-blue-200"
          >
            View dashboard
          </Link>
        </div>

        <div className="mt-6">
          <Link
            href="/payment"
            className="inline-flex items-center justify-center rounded-xl border border-white bg-white px-6 py-3 text-sm font-bold !text-blue-900 shadow-lg transition hover:bg-blue-100"
          >
            Payment and access
          </Link>
        </div>

      </section>
    </main>
  );
}