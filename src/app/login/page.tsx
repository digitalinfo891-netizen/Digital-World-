import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <Link href="/" className="font-semibold text-emerald-700">← DIGITAL WORD</Link>
        <h1 className="mt-7 text-3xl font-bold text-slate-900">Welcome back</h1>
        <p className="mb-8 mt-2 text-slate-600">Sign in to continue learning.</p>
        <AuthForm mode="login" />
      </section>
    </main>
  );
}
