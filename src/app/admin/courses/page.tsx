import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import CoursesManagement from "@/components/admin/CoursesManagement";

export const instant = false;

export default async function AdminCoursesPage() {
  await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  return (
    <div className="courses-admin-page mx-auto max-w-7xl space-y-6">
      <header className="courses-admin-hero rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-300">Learning platform</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">Course Management</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Manage the course catalogue, access models, pricing, publication and certificates.</p>
      </header>
      <CoursesManagement />
    </div>
  );
}
