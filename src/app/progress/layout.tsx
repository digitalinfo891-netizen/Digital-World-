import type { ReactNode } from "react";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import DashboardShell from "@/components/dashboard/DashboardShell";

async function AuthenticatedProgressShell({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();

  const isAdmin =
    user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  return (
    <DashboardShell
      userName={user.name}
      userEmail={user.email ?? ""}
      role={user.role}
      isAdmin={isAdmin}
    >
      {children}
    </DashboardShell>
  );
}

export default function ProgressLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-700 dark:bg-[#080e1d] dark:text-slate-200">
          Loading learning workspace...
        </div>
      }
    >
      <AuthenticatedProgressShell>
        {children}
      </AuthenticatedProgressShell>
    </Suspense>
  );
}