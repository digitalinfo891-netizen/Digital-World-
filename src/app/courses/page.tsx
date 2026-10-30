import Link from "next/link";

export default function CoursesPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/dashboard" className="text-sm font-semibold text-emerald-700 hover:underline">← Dashboard</Link>
      <section className="mt-6 rounded-3xl bg-gradient-to-br from-blue-100 to-white p-8 shadow-lg">
        <p className="text-sm font-bold uppercase tracking-wider text-blue-700">Learning library</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">My Courses</h1>
        <p className="mt-3 max-w-2xl text-slate-600">Your learning content will appear here as courses become available to your account.</p>
        <div className="mt-8 rounded-2xl border border-blue-200 bg-white/80 p-6">
          <h2 className="text-lg font-bold text-slate-900">No courses to display yet</h2>
          <p className="mt-2 text-sm text-slate-600">This page is ready for your course catalogue. Course enrolment and lesson data have not been connected here yet.</p>
        </div>
        <Link href="/payment" className="mt-6 inline-flex rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800">View learning access</Link>
      </section>
    </main>
  );
}
