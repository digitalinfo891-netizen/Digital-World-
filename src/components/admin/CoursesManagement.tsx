"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, BookOpen, CirclePlus, Edit3, ExternalLink, RefreshCw, Search, X } from "lucide-react";

type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
type AccessType = "FREE" | "MEMBERSHIP" | "PAID";
type Course = {
  id: string; title: string; slug: string; description: string; thumbnail: string | null;
  status: CourseStatus; accessType: AccessType; price: string | null; certificateEnabled: boolean;
  sortOrder: number; createdAt: string; updatedAt: string;
  _count?: { enrollments: number; payments: number; modules: number };
};
type FormState = {
  title: string; slug: string; description: string; thumbnail: string; accessType: AccessType;
  price: string; certificateEnabled: boolean; sortOrder: string; status: CourseStatus;
};
const blankForm: FormState = { title: "", slug: "", description: "", thumbnail: "", accessType: "MEMBERSHIP", price: "", certificateEnabled: false, sortOrder: "0", status: "DRAFT" };
const money = (value: string | null) => value == null ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value));

function StatusPill({ status }: { status: CourseStatus }) {
  const styles: Record<CourseStatus, string> = { DRAFT: "bg-amber-100 text-amber-800", PUBLISHED: "bg-emerald-100 text-emerald-800", ARCHIVED: "bg-slate-200 text-slate-700" };
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${styles[status]}`}>{status}</span>;
}

export default function CoursesManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);

  const loadCourses = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/courses", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load courses.");
      setCourses(data.courses ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load courses."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadCourses(); }, [loadCourses]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return courses.filter((c) => (!term || c.title.toLowerCase().includes(term) || c.slug.toLowerCase().includes(term)) &&
      (statusFilter === "ALL" || c.status === statusFilter));
  }, [courses, search, statusFilter]);
  const stats = useMemo(() => ({
    total: courses.length, published: courses.filter(c => c.status === "PUBLISHED").length,
    modules: courses.reduce((n, c) => n + (c._count?.modules ?? 0), 0),
  }), [courses]);

  function openCreate() { setEditing(null); setForm(blankForm); setMessage(""); setError(""); setFormOpen(true); }
  function openEdit(c: Course) {
    setEditing(c);
    setForm({ title: c.title, slug: c.slug, description: c.description, thumbnail: c.thumbnail ?? "", accessType: c.accessType, price: c.price ?? "", certificateEnabled: c.certificateEnabled, sortOrder: String(c.sortOrder), status: c.status });
    setMessage(""); setError(""); setFormOpen(true);
  }
  function update<K extends keyof FormState>(key: K, value: FormState[K]) { setForm(current => ({ ...current, [key]: value })); }

  async function saveCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    const payload = {
      title: form.title.trim(), slug: form.slug.trim(), description: form.description.trim(),
      thumbnail: form.thumbnail.trim() || null,
      sortOrder: Number(form.sortOrder), status: form.status,
    };
    try {
      const response = await fetch(editing ? `/api/admin/courses/${editing.id}` : "/api/admin/courses", {
        method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save course.");
      setFormOpen(false); setMessage(editing ? "Course updated successfully." : "Course created successfully.");
      await loadCourses();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save course."); }
    finally { setSaving(false); }
  }

  return <div className="space-y-6">
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {([["Total courses", stats.total], ["Published", stats.published], ["Total modules", stats.modules]] as const).map(([label, value]) =>
        <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-medium !text-slate-600 dark:!text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-black !text-slate-900 dark:!text-white">{value}</p>
        </div>)}
    </section>

    {(message || error) && <div role="status" className={`rounded-xl border p-4 text-sm ${error ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200" : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"}`}>{error || message}</div>}

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div><h2 className="text-xl font-bold !text-slate-900 dark:!text-white">Course catalogue</h2><p className="mt-1 text-sm !text-slate-600 dark:!text-slate-400">Create, edit, publish and manage course access.</p></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void loadCourses()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"><RefreshCw size={16} className={loading ? "animate-spin" : ""}/>Refresh</button>
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"><CirclePlus size={17}/>Add course</button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <label className="relative"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title or slug..." className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"/></label>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"><option value="ALL">All statuses</option><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select>
</div>
    </section>

    {formOpen && <section className="rounded-2xl border border-blue-200 bg-white p-5 shadow-lg dark:border-blue-900 dark:bg-slate-800 md:p-7">
      <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold !text-slate-900 dark:!text-white">{editing ? "Edit course" : "Create a course"}</h2><p className="mt-1 text-sm !text-slate-600 dark:!text-slate-400">Configure course details and access.</p></div><button type="button" onClick={() => setFormOpen(false)} aria-label="Close form" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"><X size={20}/></button></div>
      <form onSubmit={saveCourse} className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">Course title *<input required maxLength={200} value={form.title} onChange={e => update("title", e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white" placeholder="e.g. Web Development Basics"/></label>
        <label className="space-y-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">Slug (URL)<input value={form.slug} onChange={e => update("slug", e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white" placeholder="Auto-generated if empty"/></label>
        <label className="space-y-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 md:col-span-2">Description *<textarea required rows={4} value={form.description} onChange={e => update("description", e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white" placeholder="Describe what students will learn..."/></label>
        <label className="space-y-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 md:col-span-2">Thumbnail URL<input type="url" value={form.thumbnail} onChange={e => update("thumbnail", e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white" placeholder="https://..."/></label>
        {form.accessType === "PAID" && <label className="space-y-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">Course price (INR) *<input required type="number" min="0.01" max="10000000" step="0.01" value={form.price} onChange={e => update("price", e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" placeholder="Enter price"/></label>}
        <label className="space-y-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">Display order<input type="number" min="0" step="1" value={form.sortOrder} onChange={e => update("sortOrder", e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"/></label>
        <label className="space-y-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">Course status<select value={form.status} onChange={e => update("status", e.target.value as CourseStatus)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></label>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200 md:col-span-2">{error}</p>}
        <div className="flex flex-wrap gap-3 md:col-span-2"><button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : editing ? "Save changes" : "Create course"}</button><button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">Cancel</button></div>
      </form>
    </section>}

    <section className="space-y-4">
      {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800">Loading courses...</div> :
      filtered.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-800"><BookOpen className="mx-auto text-slate-400" size={34}/><h3 className="mt-3 font-bold !text-slate-900 dark:!text-white">{courses.length ? "No matching courses" : "No courses created yet"}</h3><p className="mt-1 text-sm !text-slate-600 dark:!text-slate-400">Create your first course to start building the catalogue.</p>{!courses.length && <button type="button" onClick={openCreate} className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white">Add first course</button>}</div> :
      filtered.map(c => <article key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row">
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-bold !text-slate-900 dark:!text-white">{c.title}</h3><StatusPill status={c.status}/></div>
            <p className="mt-1 break-all text-xs !text-slate-600 dark:!text-slate-400">/{c.slug}</p><p className="mt-3 line-clamp-2 text-sm leading-6 !text-slate-700 dark:!text-slate-300">{c.description}</p>
            <div className="mt-4 text-sm !text-slate-700 dark:!text-slate-300"><strong className="!text-slate-900 dark:!text-white">{c._count?.modules ?? 0}</strong> modules</div>
          </div>
          <div className="flex shrink-0 flex-wrap items-start gap-2 lg:justify-end"><a href={`/courses/${encodeURIComponent(c.slug)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"><ExternalLink size={15}/>View</a><button type="button" onClick={() => openEdit(c)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Edit3 size={15}/>Edit</button>
            {c.status !== "ARCHIVED" && <button type="button" disabled title="Archiving is temporarily disabled until Phase 2 enrollment checks are available." className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-500 opacity-50 dark:border-slate-600 dark:text-slate-400"><Archive size={15}/>Archive disabled</button>}
          </div>
        </div>
      </article>)}
    </section>
    <p className="text-xs !text-slate-600 dark:!text-slate-400">Showing {filtered.length} of {courses.length} courses. Archive is temporarily disabled pending the Phase 2 migration.</p>
  </div>;
}
