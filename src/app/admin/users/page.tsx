import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import UsersManager from "@/components/admin/UsersManager";

export const instant = false;

export default async function AdminUsersPage() {
  await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

  return <UsersManager />;
}