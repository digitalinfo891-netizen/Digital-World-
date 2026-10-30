"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("Logout failed");
      router.replace("/login");
      router.refresh();
    } catch {
      setBusy(false);
    }
  }

  return (
    <button onClick={logout} disabled={busy}
      className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-60">
      {busy ? "Signing out..." : "Sign out"}
    </button>
  );
}
