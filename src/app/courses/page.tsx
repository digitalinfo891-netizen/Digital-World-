
"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  LibraryBig,
  Search,
  Target,
  Layers3,
  RefreshCw,
  Award,
} from "lucide-react";

type Lesson = {
  id: string;
  title: string;
  type: string;
  durationSec: number | null;
  sortOrder: number;
};

type CourseModule = {
  id: string;
  title: string;
  sortOrder: number;
  lessons: Lesson[];
};

type Course = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  accessType: "FREE" | "MEMBERSHIP" | "PAID";
  price: string | null;
  certificateEnabled: boolean;
  modules: CourseModule[];
};

function formatCoursePrice(price: string | null) {
  if (!price || !Number.isFinite(Number(price)) || Number(price) <= 0) {
    return "Price to be announced";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(price));
}

function getAccessDetails(course: Course) {
  switch (course.accessType) {
    case "FREE":
      return {
        label: "FREE COURSE",
        description: "Free access",
        badgeClass:
          "border-green-200 bg-green-50 text-green-700 dark:border-green-400/20 dark:bg-green-400/10 dark:text-green-300",
      };

    case "MEMBERSHIP":
      return {
        label: "LIFETIME MEMBERSHIP",
        description: "Included with lifetime membership",
        badgeClass:
          "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300",
      };

    case "PAID":
      return {
        label: "INDIVIDUAL PURCHASE",
        description: formatCoursePrice(course.price),
        badgeClass:
          "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300",
      };

    default:
      return {
        label: "COURSE",
        description: "Access details unavailable",
        badgeClass:
          "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200",
      };
  }
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function loadCourses() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/courses", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load courses. Please try again.");
      }

      const data = await response.json();

      if (!data.success || !Array.isArray(data.courses)) {
        throw new Error("Invalid course catalogue response.");
      }

      setCourses(data.courses);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading courses."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return courses;

    return courses.filter(
      (course) =>
        course.title.toLowerCase().includes(term) ||
        (course.description || "").toLowerCase().includes(term) ||
        course.modules.some((module) =>
          module.title.toLowerCase().includes(term)
        )
    );
  }, [courses, search]);

  const totalLessons = (course: Course) =>
    course.modules.reduce(
      (total, module) => total + module.lessons.length,
      0
    );

  return (
    <main className="site-shell courses-page min-h-screen overflow-hidden bg-transparent text-slate-900 transition-colors dark:bg-transparent dark:text-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#60a5fa] via-[#818cf8] to-[#8b5cf6] px-5 pt-2 pb-8 dark:from-[#0c1730] dark:via-[#171b46] dark:to-[#321b63] sm:pt-3 sm:pb-10">
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-blue-400/15 blur-3xl dark:bg-violet-500/20" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl" />

        <div className="relative mx-auto max-w-[1120px]">
          <div className="courses-library-panel mx-auto max-w-5xl rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_rgba(39,67,130,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80 dark:shadow-black/30 sm:p-10 lg:p-12">
            <div className="mb-7 flex flex-wrap items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-[#3157D5] dark:bg-blue-500/15 dark:text-blue-300">
                <LibraryBig size={24} />
              </span>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-extrabold tracking-[0.16em] text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200">
                LEARNING LIBRARY
              </span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl lg:text-5xl">
                  Explore Courses
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">
                  Discover practical courses, develop new skills and move
                  forward in your digital learning journey.
                </p>
              </div>

              <div className="courses-availability-card rounded-xl border px-4 py-3">
                <p className="courses-availability-label text-xs font-bold uppercase tracking-wider">
                  Available courses
                </p>
                <p className="courses-availability-count mt-1 text-2xl font-black">
                  {loading ? "..." : courses.length}
                </p>
              </div>
            </div>

            <div className="relative mt-8">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search courses, skills or modules..."
                className="w-full rounded-xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:ring-blue-900/30"
                aria-label="Search courses"
              />
            </div>

            {loading && (
              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                {[1, 2].map((item) => (
                  <div
                    key={item}
                    className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="h-40 rounded-xl bg-slate-200 dark:bg-slate-700" />
                    <div className="mt-5 h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="mt-3 h-4 w-full rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="mt-2 h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
                  </div>
                ))}
              </div>
            )}

            {!loading && error && (
              <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-7 text-center dark:border-red-400/20 dark:bg-red-950/30">
                <p className="font-bold text-red-700 dark:text-red-300">
                  {error}
                </p>
                <button
                  onClick={loadCourses}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700"
                >
                  <RefreshCw size={16} /> Try Again
                </button>
              </div>
            )}

            {!loading && !error && courses.length === 0 && (
              <div className="mt-10 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-violet-50 p-8 text-center dark:border-slate-700 dark:from-slate-800 dark:to-indigo-950/70">
                <BookOpen
                  size={42}
                  className="mx-auto text-[#3157D5] dark:text-blue-300"
                />
                <h2 className="mt-5 text-xl font-extrabold text-slate-900 dark:text-white">
                  No published courses yet
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  New courses will appear here when they are published.
                  Please check back soon.
                </p>
              </div>
            )}

            {!loading &&
              !error &&
              courses.length > 0 &&
              filteredCourses.length === 0 && (
                <div className="mt-10 rounded-2xl border border-slate-200 p-8 text-center dark:border-slate-700">
                  <Search size={34} className="mx-auto text-slate-400" />
                  <h2 className="mt-4 font-bold text-slate-900 dark:text-white">
                    No matching courses
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Try searching with another keyword.
                  </p>
                </div>
              )}

            {!loading && !error && filteredCourses.length > 0 && (
              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                {filteredCourses.map((course) => {
                  const access = getAccessDetails(course);

                  return (
                    <article
                      key={course.id}
                      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800"
                    >
                      <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600">
                        {course.thumbnail ? (
                          <Image
                            src={course.thumbnail}
                            alt={course.title}
                            fill
                            sizes="(max-width: 640px) 100vw, 50vw"
                            className="object-cover"
                          />
                        ) : (
                          <>
                            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                            <GraduationCap
                              size={72}
                              className="relative text-white/90 transition duration-300 group-hover:scale-110"
                            />
                          </>
                        )}

                        <span className="absolute left-4 top-4 rounded-full border border-white/30 bg-white/20 px-3 py-1.5 text-[10px] font-extrabold tracking-widest text-white backdrop-blur">
                          PUBLISHED COURSE
                        </span>
                      </div>

                      <div className="p-6">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1.5 text-[10px] font-extrabold tracking-wide ${access.badgeClass}`}
                          >
                            {access.label}
                          </span>

                          {course.certificateEnabled && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-extrabold text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
                              <Award size={13} />
                              CERTIFICATE AVAILABLE
                            </span>
                          )}
                        </div>

                        <h2 className="mt-4 text-xl font-black text-slate-900 dark:text-white">
                          {course.title}
                        </h2>

                        <p className="mt-3 min-h-[60px] text-sm leading-7 text-slate-600 dark:text-slate-300">
                          {course.description ||
                            "Explore this course and build practical skills."}
                        </p>

                        <div className="mt-5 flex flex-wrap items-center gap-4 border-y border-slate-100 py-4 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-300">
                          <span className="inline-flex items-center gap-1.5">
                            <Layers3 size={16} className="text-blue-500" />
                            {course.modules.length} Modules
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <BookOpen size={16} className="text-violet-500" />
                            {totalLessons(course)} Lessons
                          </span>
                        </div>

                        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900/60">
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Course access
                          </p>
                          <p className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">
                            {access.description}
                          </p>
                        </div>

                        <Link
                          href={`/courses/${course.slug}`}
                          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3157D5] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#263FAD]"
                        >
                          View Course <ArrowRight size={17} />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-7 dark:border-slate-700 sm:flex-row">
              <Link
                href="/learn-skills"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3157D5] px-6 py-4 text-sm font-extrabold text-white transition hover:bg-[#263FAD]"
              >
                Explore Learning Paths <ArrowRight size={17} />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-700 transition hover:border-blue-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                My Dashboard
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-8 grid max-w-5xl gap-4 sm:grid-cols-3">
            {[
              {
                icon: Target,
                title: "Choose a goal",
                detail: "Pick a skill you want to develop.",
              },
              {
                icon: BookOpen,
                title: "Learn step by step",
                detail: "Build understanding at your pace.",
              },
              {
                icon: GraduationCap,
                title: "Keep progressing",
                detail: "Return as your learning grows.",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="courses-feature-card rounded-2xl border p-5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <Icon
                    className="text-[#3157D5] dark:text-blue-300"
                    size={22}
                  />
                  <h3 className="mt-3 font-extrabold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {item.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}