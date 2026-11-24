export default function ProgressPage() {
  const metrics = [
    "Courses completed",
    "Lessons completed",
    "Overall progress",
  ];

  return (
    <main className="dw-progress-page min-h-screen w-full px-4 pb-10 pt-4 sm:px-6 lg:px-8">
      <section className="dw-progress-panel mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border p-6 sm:p-9 lg:p-10">

        <div className="mb-8">
          <span className="dw-progress-label inline-flex rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em]">
            Your Learning Journey
          </span>

          <h1 className="dw-progress-title mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Learning Progress
          </h1>

          <p className="dw-progress-description mt-3 max-w-3xl text-sm leading-7 sm:text-base">
            A dedicated space for tracking lessons, quizzes, projects,
            and course completion.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((label) => (
            <div
              key={label}
              className="dw-progress-metric rounded-2xl border p-6"
            >
              <p className="dw-progress-metric-label text-sm font-medium">
                {label}
              </p>

              <p className="dw-progress-metric-value mt-3 text-2xl font-extrabold">
                Not available
              </p>
            </div>
          ))}
        </div>

        <div className="dw-progress-notice mt-6 rounded-2xl border p-5">
          <p className="text-sm leading-7">
            Progress metrics will appear when course and lesson tracking
            is connected. No progress figures are being assumed.
          </p>
        </div>

      </section>
    </main>
  );
}