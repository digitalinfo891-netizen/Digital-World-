import type { ReactNode } from "react";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import DashboardShell from "@/components/dashboard/DashboardShell";

async function AuthenticatedInviteAndEarnShell({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

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

export default function InviteAndEarnLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<div className="p-8">Loading referral workspace...</div>}>
      <AuthenticatedInviteAndEarnShell>{children}</AuthenticatedInviteAndEarnShell>
    </Suspense>
  );
}