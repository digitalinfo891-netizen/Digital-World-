

export default function ActivityPage() {
  return (
    <main className="dw-activity-page mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6">

      <section className="dw-activity-panel mt-2 rounded-3xl bg-gradient-to-br from-rose-100 to-white p-8 shadow-lg">
        <p className="text-sm font-bold uppercase tracking-wider text-rose-700">Recent updates</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Activity</h1>
        <p className="mt-3 text-slate-600">A dedicated place for recent referral rewards and redemption activity.</p>
        <div className="dw-activity-card mt-8 rounded-2xl border border-rose-200 bg-white/80 p-6">
          <h2 className="text-lg font-bold text-slate-900">Recent activity</h2>
          <p className="mt-2 text-sm text-slate-600">Your existing dashboard shows recent reward and redemption records. Connecting this page to the same data source is the next step; this starter page does not invent activity entries.</p>
        </div>
      </section>
    </main>
  );
}
