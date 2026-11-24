import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import SettingsForm from "./SettingsForm";

export const instant = false;

export default async function AdminSettingsPage() {
  await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-300">
          Platform configuration
        </p>

        <h1 className="mt-2 text-3xl font-black text-white">
          Platform Settings
        </h1>

        <p className="mt-2 text-sm text-slate-300">
          Configure membership pricing and platform availability.
        </p>
      </div>

      <SettingsForm />
    </div>
  );
}