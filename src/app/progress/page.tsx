import Link from "next/link";

export default function ProgressPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/dashboard" className="text-sm font-semibold text-emerald-700 hover:underline">← Dashboard</Link>
      <section className="mt-6 rounded-3xl bg-gradient-to-br from-violet-100 to-white p-8 shadow-lg">
        <p className="text-sm font-bold uppercase tracking-wider text-violet-700">Your learning journey</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Learning Progress</h1>
        <p className="mt-3 text-slate-600">A dedicated space for tracking lessons, quizzes, projects, and course completion.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {["Courses completed", "Lessons completed", "Overall progress"].map((label) => (
            <div key={label} className="rounded-2xl border border-violet-200 bg-white/80 p-5">
              <p className="text-sm text-slate-600">{label}</p>
              <p className="mt-2 text-xl font-bold text-slate-900">Not available</p>
            </div>
          ))}
        </div>
        <p className="mt-6 rounded-xl bg-white/80 p-4 text-sm text-slate-600">Progress metrics will appear when course and lesson tracking is connected. No progress figures are being assumed.</p>
      </section>
    </main>
  );
}
