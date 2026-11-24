
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import CourseAccessPanel from "./CourseAccessPanel";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  GraduationCap,
  LockKeyhole,
  PlayCircle,
  RefreshCw,
  ShieldCheck,
  Video,
} from "lucide-react";

type Lesson = {
  id: string;
  title: string;
  type: "VIDEO" | "PDF" | "TEXT" | "QUIZ" | "PROJECT";
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
  description: string;
  thumbnail: string | null;
  accessType: "FREE" | "MEMBERSHIP" | "PAID";
  price: string | null;
  certificateEnabled: boolean;
  modules: CourseModule[];
};

type LessonContent = {
  id: string;
  title: string;
  type: Lesson["type"];
  contentUrl: string | null;
  textContent: string | null;
  durationSec: number | null;
  module: {
    title: string;
    course: {
      title: string;
      slug: string;
      status: string;
    };
  };
};

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return "Lesson";

  const minutes = Math.ceil(seconds / 60);
  return `${minutes} min`;
}

function lessonIcon(type: Lesson["type"]) {
  if (type === "VIDEO") return Video;
  if (type === "PDF") return FileText;
  if (type === "QUIZ") return CheckCircle2;
  return BookOpen;
}

export default function CourseDetailsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedLesson, setSelectedLesson] =
    useState<LessonContent | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [lessonLoading, setLessonLoading] = useState(false);
  const [lessonError, setLessonError] = useState("");
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [savingProgress, setSavingProgress] = useState(false);
  const [expandedModuleIds, setExpandedModuleIds] = useState<string[]>([]);

  useEffect(() => {
    let active = true;

    async function loadCourse() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/courses/${encodeURIComponent(slug)}`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok || !data.success || !data.course) {
          throw new Error(data.error || "Unable to load this course.");
        }

        if (active) {
          setCourse(data.course);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load course."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    if (slug) void loadCourse();

    return () => {
      active = false;
    };
  }, [slug]);

  const allLessons = useMemo(
    () => course?.modules.flatMap((module) => module.lessons) ?? [],
    [course]
  );

  const totalLessons = allLessons.length;
  const completedCount = completedLessonIds.length;

  const progressPercent =
    totalLessons > 0
      ? Math.round((completedCount / totalLessons) * 100)
      : 0;

  async function openLesson(lesson: Lesson) {
    setSelectedLessonId(lesson.id);
    setSelectedLesson(null);
    setLessonError("");
    setLessonLoading(true);

    try {
      const response = await fetch(
        `/api/lessons/${encodeURIComponent(lesson.id)}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("LOGIN_REQUIRED");
        }

        if (response.status === 403) {
          throw new Error("ACCESS_REQUIRED");
        }

        throw new Error(data.error || "Unable to load this lesson.");
      }

      if (!data.success || !data.lesson) {
        throw new Error("Invalid lesson response.");
      }

      setSelectedLesson(data.lesson);

      if (data.progress?.completedAt) {
        setCompletedLessonIds((previous) =>
          previous.includes(lesson.id)
            ? previous
            : [...previous, lesson.id]
        );
      }
    } catch (err) {
      setLessonError(
        err instanceof Error ? err.message : "Unable to load lesson."
      );
    } finally {
      setLessonLoading(false);
    }
  }

  async function updateProgress(completed: boolean) {
    if (!selectedLessonId || savingProgress) return;

    try {
      setSavingProgress(true);

      const response = await fetch(
        `/api/lessons/${encodeURIComponent(selectedLessonId)}/progress`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to update progress.");
      }

      setCompletedLessonIds((previous) =>
        completed
          ? previous.includes(selectedLessonId)
            ? previous
            : [...previous, selectedLessonId]
          : previous.filter((id) => id !== selectedLessonId)
      );
    } catch (err) {
      setLessonError(
        err instanceof Error ? err.message : "Unable to update progress."
      );
    } finally {
      setSavingProgress(false);
    }
  }

  const selectedIndex = allLessons.findIndex(
    (lesson) => lesson.id === selectedLessonId
  );

  function openAdjacentLesson(direction: -1 | 1) {
    const nextLesson = allLessons[selectedIndex + direction];

    if (nextLesson) {
      void openLesson(nextLesson);
    }
  }

  return (
    <main className="course-details-page min-h-screen bg-slate-50 text-slate-900 dark:bg-[#080e1d] dark:text-white">
      {loading && (
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <RefreshCw
            className="mx-auto animate-spin text-blue-600"
            size={32}
          />
          <p className="mt-4 text-sm text-slate-500">
            Loading course...
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <BookOpen className="mx-auto text-slate-400" size={44} />
          <h1 className="mt-5 text-2xl font-black">
            Course unavailable
          </h1>
          <p className="mt-3 text-sm text-slate-500">{error}</p>
          <Link
            href="/courses"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-bold text-white"
          >
            Browse Courses
          </Link>
        </div>
      )}

      {!loading && course && (
        <>
          <section
            className="course-details-hero px-4 py-10 text-white"
            style={{
              background:
                "linear-gradient(115deg, #2446ad 0%, #3157d5 50%, #7047d3 100%)",
              color: "#ffffff",
            }}
          >
            <div className="mx-auto max-w-7xl">
              <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-100">
                <GraduationCap size={17} />
                Digital World Learning
              </div>

              <div className="grid items-center gap-8 lg:grid-cols-[1fr_280px]">
                <div>
                  <h1 className="max-w-3xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                    {course.title}
                  </h1>

                  <p className="mt-5 max-w-3xl text-sm leading-8 text-blue-100 sm:text-base">
                    {course.description}
                  </p>

                  <div className="mt-7 flex flex-wrap gap-5 text-sm font-semibold text-blue-100">
                    <span className="flex items-center gap-2">
                      <BookOpen size={17} />
                      {totalLessons} Lessons
                    </span>

                    <span className="flex items-center gap-2">
                      <GraduationCap size={17} />
                      {course.modules.length} Modules
                    </span>

                    <span className="flex items-center gap-2">
                      <ShieldCheck size={17} />
                      Structured Learning
                    </span>
                  </div>

                  <CourseAccessPanel
                    courseId={course.id}
                    accessType={course.accessType}
                    price={course.price}
                    certificateEnabled={course.certificateEnabled}
                  />
                </div>

                <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-100">
                    Your course progress
                  </p>

                  <p className="mt-3 text-4xl font-black">
                    {progressPercent}%
                  </p>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-white transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <p className="mt-3 text-xs text-blue-100">
                    {completedCount} of {totalLessons} lessons completed
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto grid max-w-7xl gap-7 px-4 py-10 sm:px-6 lg:grid-cols-[350px_1fr]">
            <aside className="h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 p-5 dark:border-slate-800">
                <h2 className="text-lg font-black">
                  Course Curriculum
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Select a lesson to begin learning.
                </p>
              </div>

              <div className="max-h-[700px] overflow-y-auto p-3">
                {course.modules.map((module, moduleIndex) => (
                  <div key={module.id} className="mb-4">
                    <button
                      type="button"
                      aria-expanded={expandedModuleIds.includes(module.id)}
                      onClick={() =>
                        setExpandedModuleIds((previous) =>
                          previous.includes(module.id)
                            ? previous.filter((id) => id !== module.id)
                            : [...previous, module.id]
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-xl bg-slate-100 px-4 py-3 text-left transition hover:brightness-95 dark:bg-slate-800"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="block text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-300">
                          Module {moduleIndex + 1}
                        </p>

                        <h3 className="mt-1 block break-words text-sm font-extrabold leading-5 text-slate-900 dark:text-slate-100">
                          {module.title}
                        </h3>

                        <p className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                          {module.lessons.length} lessons
                        </p>
                      </div>

                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-slate-500 transition-transform duration-200 ${
                          expandedModuleIds.includes(module.id)
                            ? "rotate-180"
                            : ""
                        }`}
                      />
                    </button>

                    {expandedModuleIds.includes(module.id) && (
                      <div className="mt-2 space-y-1">
                        {module.lessons.map((lesson) => {
                          const Icon = lessonIcon(lesson.type);
                          const completed = completedLessonIds.includes(
                            lesson.id
                          );
                          const active = selectedLessonId === lesson.id;

                          return (
                            <button
                              key={lesson.id}
                              type="button"
                              onClick={() => void openLesson(lesson)}
                              className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                                active
                                  ? "bg-blue-50 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:ring-blue-400/30"
                                  : "hover:bg-slate-50 dark:hover:bg-slate-800"
                              }`}
                            >
                              {completed ? (
                                <CheckCircle2
                                  size={19}
                                  className="shrink-0 text-emerald-500"
                                />
                              ) : (
                                <Icon
                                  size={19}
                                  className={`shrink-0 ${
                                    active
                                      ? "text-blue-600"
                                      : "text-slate-400"
                                  }`}
                                />
                              )}

                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold">
                                  {lesson.title}
                                </span>

                                <span className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                                  <Clock3 size={12} />
                                  {formatDuration(lesson.durationSec)}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {course.modules.length === 0 && (
                  <p className="p-5 text-sm text-slate-500">
                    No modules have been added to this course yet.
                  </p>
                )}
              </div>
            </aside>

            <div className="min-w-0">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                {!selectedLessonId && !lessonLoading && (
                  <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-14 text-center">
                    <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                      <PlayCircle size={42} />
                    </span>

                    <h2 className="mt-6 text-2xl font-black">
                      Start learning
                    </h2>

                    <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
                      Choose a lesson from the curriculum to open its
                      learning material.
                    </p>
                  </div>
                )}

                {lessonLoading && (
                  <div className="flex min-h-[420px] flex-col items-center justify-center">
                    <RefreshCw
                      size={32}
                      className="animate-spin text-blue-600"
                    />
                    <p className="mt-4 text-sm text-slate-500">
                      Checking access and loading lesson...
                    </p>
                  </div>
                )}

                {!lessonLoading && lessonError && (
                  <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-12 text-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10">
                      <LockKeyhole size={32} />
                    </span>

                    {lessonError === "LOGIN_REQUIRED" ? (
                      <>
                        <h2 className="mt-5 text-xl font-black">
                          Login required
                        </h2>

                        <p className="mt-2 max-w-md text-sm leading-7 text-slate-500">
                          Please sign in to access your course lessons.
                        </p>

                        <Link
                          href="/login"
                          className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white"
                        >
                          Login to Continue
                        </Link>
                      </>
                    ) : lessonError === "ACCESS_REQUIRED" ? (
                      <>
                        {course.accessType === "PAID" ? (
                          <>
                            <h2 className="mt-5 text-xl font-black">
                              Course purchase required
                            </h2>

                            <p className="mt-2 max-w-md text-sm leading-7 text-slate-500">
                              Purchase this course using the payment panel
                              above. Access will be activated after the
                              administrator verifies your payment.
                            </p>
                          </>
                        ) : course.accessType === "MEMBERSHIP" ? (
                          <>
                            <h2 className="mt-5 text-xl font-black">
                              Lifetime membership required
                            </h2>

                            <p className="mt-2 max-w-md text-sm leading-7 text-slate-500">
                              Activate lifetime membership to unlock this
                              course and other membership courses.
                            </p>

                            <Link
                              href="/payment"
                              className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white"
                            >
                              Get Lifetime Membership
                            </Link>
                          </>
                        ) : (
                          <>
                            <h2 className="mt-5 text-xl font-black">
                              Course access required
                            </h2>

                            <p className="mt-2 max-w-md text-sm leading-7 text-slate-500">
                              Please sign in and try accessing this free
                              course again.
                            </p>

                            <Link
                              href="/login"
                              className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white"
                            >
                              Login to Continue
                            </Link>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <h2 className="mt-5 text-xl font-black">
                          Unable to open lesson
                        </h2>

                        <p className="mt-2 max-w-md text-sm leading-7 text-slate-500">
                          {lessonError}
                        </p>

                        <button
                          type="button"
                          onClick={() => {
                            const lesson = allLessons.find(
                              (item) => item.id === selectedLessonId
                            );

                            if (lesson) {
                              void openLesson(lesson);
                            }
                          }}
                          className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white"
                        >
                          Try Again
                        </button>
                      </>
                    )}
                  </div>
                )}

                {!lessonLoading && selectedLesson && (
                  <>
                    <div className="border-b border-slate-200 p-5 sm:p-7 dark:border-slate-800">
                      <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-300">
                        {selectedLesson.module.title}
                      </p>

                      <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                        {selectedLesson.title}
                      </h2>

                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        {selectedLesson.type} ·{" "}
                        {formatDuration(selectedLesson.durationSec)}
                      </p>
                    </div>

                    <div className="min-h-[320px] p-5 sm:p-7">
                      {selectedLesson.type === "TEXT" && (
                        <article className="whitespace-pre-wrap text-sm leading-8 text-slate-700 dark:text-slate-200">
                          {selectedLesson.textContent ||
                            "No lesson text has been added yet."}
                        </article>
                      )}

                      {selectedLesson.type === "VIDEO" &&
                        selectedLesson.contentUrl && (
                          <div className="overflow-hidden rounded-xl bg-black">
                            {/\.(mp4|webm|ogg)(\?.*)?$/i.test(
                              selectedLesson.contentUrl
                            ) ? (
                              <video
                                className="aspect-video w-full"
                                src={selectedLesson.contentUrl}
                                controls
                                playsInline
                              />
                            ) : (
                              <iframe
                                className="aspect-video w-full"
                                src={selectedLesson.contentUrl}
                                title={selectedLesson.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            )}
                          </div>
                        )}

                      {selectedLesson.type === "PDF" &&
                        selectedLesson.contentUrl && (
                          <iframe
                            className="h-[650px] w-full rounded-xl border border-slate-200 dark:border-slate-700"
                            src={selectedLesson.contentUrl}
                            title={selectedLesson.title}
                          />
                        )}

                      {(selectedLesson.type === "VIDEO" ||
                        selectedLesson.type === "PDF") &&
                        !selectedLesson.contentUrl && (
                          <p className="rounded-xl bg-slate-50 p-6 text-sm text-slate-500 dark:bg-slate-800">
                            Learning material has not been uploaded yet.
                          </p>
                        )}

                      {selectedLesson.type === "QUIZ" && (
                        <div className="rounded-xl bg-blue-50 p-6 dark:bg-blue-500/10">
                          <h3 className="font-bold">Quiz lesson</h3>
                          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                            Quiz delivery and server-side answer evaluation
                            will be implemented in the next stage.
                          </p>
                        </div>
                      )}

                      {selectedLesson.type === "PROJECT" && (
                        <div className="rounded-xl bg-violet-50 p-6 dark:bg-violet-500/10">
                          <h3 className="font-bold">Practical project</h3>
                          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                            Project instructions and submission workflow
                            will be implemented in the next stage.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        type="button"
                        disabled={selectedIndex <= 0}
                        onClick={() => openAdjacentLesson(-1)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700"
                      >
                        <ArrowLeft size={16} />
                        Previous Lesson
                      </button>

                      <button
                        type="button"
                        disabled={savingProgress}
                        onClick={() =>
                          void updateProgress(
                            !completedLessonIds.includes(selectedLessonId)
                          )
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        <CheckCircle2 size={17} />

                        {savingProgress
                          ? "Saving..."
                          : completedLessonIds.includes(selectedLessonId)
                            ? "Mark Incomplete"
                            : "Mark as Completed"}
                      </button>

                      <button
                        type="button"
                        disabled={
                          selectedIndex < 0 ||
                          selectedIndex >= allLessons.length - 1
                        }
                        onClick={() => openAdjacentLesson(1)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700"
                      >
                        Next Lesson
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-400/20 dark:bg-blue-500/10">
                <ShieldCheck
                  size={20}
                  className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-300"
                />

                <p className="text-xs leading-6 text-slate-600 dark:text-slate-300">
                  Lesson materials are delivered through authenticated
                  access checks. Your completion records are saved against
                  your account.
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
