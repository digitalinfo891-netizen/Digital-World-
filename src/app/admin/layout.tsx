import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";

export const instant = false;

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

  return (
    <AdminShell
      userName={user.name || "Administrator"}
      userEmail={user.email || ""}
      role={user.role}
    >
      {children}
    </AdminShell>
  );
}
