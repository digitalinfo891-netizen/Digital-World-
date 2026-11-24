import type { ReactNode } from "react";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import DashboardShell from "@/components/dashboard/DashboardShell";

async function AuthenticatedAccountShell({
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

export default function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-blue-100 text-blue-900 dark:bg-[#080e1d] dark:text-slate-200">
          Loading account workspace...
        </div>
      }
    >
      <AuthenticatedAccountShell>
        {children}
      </AuthenticatedAccountShell>
    </Suspense>
  );
}