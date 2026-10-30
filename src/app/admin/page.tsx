import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import LogoutButton from "@/components/auth/LogoutButton";


export const instant = false;

export default async function AdminPage() {
  const user = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-5xl rounded-2xl border bg-white p-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">DIGITAL WORD Admin</h1>
          <LogoutButton />
        </div>
        <p className="mt-4 text-slate-600">Signed in as {user.name} ({user.role}).</p>
        <p className="mt-6">Course management and payment verification will be added here.</p>
      </div>
    </main>
  );
}


