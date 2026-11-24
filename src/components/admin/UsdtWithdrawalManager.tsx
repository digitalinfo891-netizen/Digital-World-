"use client";

import { useMemo, useState } from "react";

type Status = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
type Item = {
  id: string; userId: string; walletAddress: string; network: string; amount: string;
  status: Status; adminNote: string | null; transactionHash: string | null;
  completedAt: string | null; createdAt: string;
  user: { name: string; email: string | null; phoneE164: string | null };
};
type Counts = { pending: number; approved: number; rejected: number; completed: number };
const filters = ["ALL", "PENDING", "APPROVED", "REJECTED", "COMPLETED"] as const;

function stamp(value: string) { return new Date(value).toLocaleString(); }
function statusStyle(status: Status) {
  return status === "PENDING" ? "bg-amber-100 text-amber-800"
    : status === "APPROVED" ? "bg-blue-100 text-blue-800"
    : status === "REJECTED" ? "bg-red-100 text-red-800"
    : "bg-emerald-100 text-emerald-800";
}

export default function UsdtWithdrawalManager({
  initialWithdrawals, counts: initialCounts,
}: { initialWithdrawals: Item[]; counts: Counts }) {
  const [items, setItems] = useState(initialWithdrawals);
  const [counts, setCounts] = useState(initialCounts);
  const [filter, setFilter] = useState<(typeof filters)[number]>("ALL");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const visible = useMemo(() => filter === "ALL" ? items : items.filter((x) => x.status === filter), [items, filter]);

  async function act(item: Item, action: "approve" | "reject" | "complete") {
    const hash = (hashes[item.id] ?? "").trim();
    if (action === "complete" && !/^0x[a-fA-F0-9]{64}$/.test(hash)) {
      setError("Enter a valid BEP20 transaction hash (0x + 64 hexadecimal characters)."); setMessage(""); return;
    }
    const prompt = action === "approve"
      ? "Approve this request? This does not transfer USDT."
      : action === "reject" ? "Reject this request and release its reservation?"
      : "Confirm that you already sent USDT manually and verified the transfer. Record it as completed?";
    if (!window.confirm(prompt)) return;
    setBusy(item.id); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/rewards/usdt/withdrawals/review", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawalId: item.id, action, adminNote: notes[item.id] ?? "", ...(action === "complete" ? { transactionHash: hash } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error ?? "Withdrawal review failed."); return; }
      const status: Status = action === "approve" ? "APPROVED" : action === "reject" ? "REJECTED" : "COMPLETED";
      setItems((current) => current.map((x) => x.id === item.id ? {
        ...x, status, adminNote: notes[item.id]?.trim() || null,
        transactionHash: action === "complete" ? hash : x.transactionHash,
        completedAt: action === "complete" ? new Date().toISOString() : x.completedAt,
      } : x));
      setCounts((current) => ({
        ...current,
        ...(action === "approve" ? { pending: Math.max(0, current.pending - 1), approved: current.approved + 1 } : {}),
        ...(action === "reject" ? { [item.status.toLowerCase()]: Math.max(0, current[item.status.toLowerCase() as keyof Counts] - 1), rejected: current.rejected + 1 } : {}),
        ...(action === "complete" ? { approved: Math.max(0, current.approved - 1), completed: current.completed + 1 } : {}),
      }));
      setMessage(data.message ?? "Withdrawal updated.");
    } catch { setError("Could not contact the server. Please try again."); }
    finally { setBusy(null); }
  }

  const cards = [
    ["Pending", counts.pending, "text-amber-700"],
    ["Approved", counts.approved, "text-blue-700"],
    ["Rejected", counts.rejected, "text-red-700"],
    ["Completed", counts.completed, "text-emerald-700"],
  ] as const;

  return <div className="space-y-6 usdt-withdrawal-manager">
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(([label, value, tone]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">{label} requests</p><p className={`mt-2 text-3xl font-bold ${tone}`}>{value}</p>
      </article>)}
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-bold text-slate-900">Withdrawal requests</h2><p className="text-sm text-slate-500">Latest {items.length} requests; statistics include all records.</p></div>
        <div className="flex flex-wrap gap-2">{filters.map((f) => <button key={f} type="button" onClick={() => setFilter(f)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${filter === f ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{f === "ALL" ? "All" : f}</button>)}</div>
      </div>
      {message && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
      {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {visible.length === 0 ? <p className="mt-5 rounded-xl bg-slate-50 p-8 text-center text-slate-600">No requests in this filter.</p> :
        <div className="mt-5 space-y-4">{visible.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 p-4 md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h3 className="font-bold text-slate-900">{item.user.name}</h3><p className="text-sm text-slate-600">{item.user.email ?? "No email"} Â· {item.user.phoneE164 ?? "No phone"}</p><p className="mt-2 text-xs text-slate-500">ID: {item.id}</p><p className="text-xs text-slate-500">Submitted: {stamp(item.createdAt)}</p></div>
            <div className="sm:text-right"><p className="text-2xl font-bold text-slate-900">{item.amount} USDT</p><span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusStyle(item.status)}`}>{item.status}</span><p className="mt-1 text-xs text-slate-500">{item.network}</p></div>
          </div>
          <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-3 md:grid-cols-2">
            <div><p className="text-xs font-semibold uppercase text-slate-500">Destination wallet</p><p className="mt-1 break-all font-mono text-sm">{item.walletAddress}</p><button type="button" onClick={() => navigator.clipboard.writeText(item.walletAddress)} className="mt-2 text-xs font-semibold text-blue-700 hover:underline">Copy wallet address</button></div>
            <div><p className="text-xs font-semibold uppercase text-slate-500">Transaction hash</p><p className="mt-1 break-all font-mono text-sm">{item.transactionHash ?? "Not recorded"}</p>{item.completedAt && <p className="mt-1 text-xs text-slate-500">Completed: {stamp(item.completedAt)}</p>}</div>
          </div>
          {item.adminNote && <p className="mt-3 text-sm text-slate-600"><strong>Admin note:</strong> {item.adminNote}</p>}
          {(item.status === "PENDING" || item.status === "APPROVED") && <div className="mt-4 space-y-3">
            <div><label htmlFor={`note-${item.id}`} className="block text-sm font-medium text-slate-700">Admin note (optional)</label><textarea id={`note-${item.id}`} rows={2} maxLength={1000} value={notes[item.id] ?? ""} onChange={(e) => setNotes((v) => ({ ...v, [item.id]: e.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm" placeholder="Add an internal review note" /></div>
            <div className="flex flex-wrap gap-2">
              {item.status === "PENDING" && <><button type="button" disabled={busy !== null} onClick={() => act(item, "approve")} className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy === item.id ? "Processingâ€¦" : "Approve request"}</button><button type="button" disabled={busy !== null} onClick={() => act(item, "reject")} className="rounded-xl border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-50">Reject</button></>}
              {item.status === "APPROVED" && <div className="w-full space-y-2"><label htmlFor={`hash-${item.id}`} className="block text-sm font-medium text-slate-700">BEP20 transaction hash</label><input id={`hash-${item.id}`} value={hashes[item.id] ?? ""} onChange={(e) => setHashes((v) => ({ ...v, [item.id]: e.target.value }))} placeholder="0x + 64 hexadecimal characters" className="w-full rounded-xl border border-slate-300 p-3 font-mono text-sm" /><div className="flex flex-wrap gap-2"><button type="button" disabled={busy !== null} onClick={() => act(item, "complete")} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy === item.id ? "Processingâ€¦" : "Record manual transfer"}</button><button type="button" disabled={busy !== null} onClick={() => act(item, "reject")} className="rounded-xl border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-50">Reject request</button></div><p className="text-xs text-amber-700">Record completion only after independently verifying the manual transfer succeeded.</p></div>}
            </div>
          </div>}
        </article>)}</div>}
    </section>
  </div>;
}
