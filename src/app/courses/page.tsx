"use client";
import Image from "next/image";

import Link from "next/link";
import ThemeToggle from "@/components/theme/ThemeToggle";
import MobileNav from "@/components/MobileNav";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  LibraryBig,
  Search,
  Sparkles,
  Target,
} from "lucide-react";

export default function CoursesPage() {
  return (
    <main className="site-shell courses-page min-h-screen overflow-hidden bg-transparent text-slate-900 transition-colors dark:bg-transparent dark:text-white">
      <div className="top-strip">
        <div className="container top-strip-inner">
          <span>Knowledge is your power. Skills are your future.</span>
          <span className="top-strip-right">Learn. Practise. Grow.</span>
        </div>
      </div>

      <header className="site-header">
        <nav className="container navbar" aria-label="Main navigation">
          <Link href="/" className="brand" aria-label="Digital World home">
            <span className="brand-mark"><GraduationCap size={25} strokeWidth={2.2} /></span>
            <span className="brand-copy">
              <span className="brand-name">Digital <span>World</span></span>
              <span className="brand-caption">LEARN. SKILL. GROW. EARN.</span>
            </span>
          </Link>
          <MobileNav />
          <div className="nav-links">
            <Link href="/" className="nav-link">Home</Link>
            <Link href="/learn-skills" className="nav-link">Learn Skills</Link>
            <Link href="/courses" className="nav-link nav-active">Courses</Link>
            <Link href="/about" className="nav-link">About Us</Link>
          </div>
          <div className="nav-actions">
            <ThemeToggle />
            <Link href="/login" className="login-link">Login</Link>
            <Link href="/register" className="button button-primary nav-register">
              Get Started <ArrowRight size={16} />
            </Link>
          </div>
        </nav>
      </header>

      {/* Courses homepage-style hero banner */}
      <section className="hero-section hero-image-section">
        <div className="container hero-image-container">
          <Image
            src="/digital-world-hero.png"
            alt="Digital World - Explore courses and digital learning opportunities"
            width={2048}
            height={512}
            priority
            className="hero-single-image"
          />
        </div>
      </section>


      {/* Homepage-style hero banner */}
      


      <section className="relative overflow-hidden bg-gradient-to-br from-[#60a5fa] via-[#818cf8] to-[#8b5cf6] px-5 py-16 dark:from-[#0c1730] dark:via-[#171b46] dark:to-[#321b63] sm:py-20">
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-blue-400/15 blur-3xl dark:bg-violet-500/20" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="relative mx-auto max-w-[1120px]">
          <Link href="/dashboard" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-[#3157D5] dark:text-slate-300 dark:hover:text-blue-300">
            <ArrowRight className="rotate-180" size={16} /> Dashboard
          </Link>

          <div className="courses-library-panel mx-auto max-w-4xl rounded-[28px] border border-white/70 bg-white/80 p-7 shadow-[0_24px_80px_rgba(39,67,130,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80 dark:shadow-black/30 sm:p-10 lg:p-12">
            <div className="mb-7 flex flex-wrap items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-[#3157D5] dark:bg-blue-500/15 dark:text-blue-300">
                <LibraryBig size={24} />
              </span>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-extrabold tracking-[0.16em] text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200">
                LEARNING LIBRARY
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl lg:text-5xl">
              My Courses
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">
              Your learning content will appear here as courses become available to your account.
              Your learning journey starts with choosing a skill and building it step by step.
            </p>

            <div className="courses-empty-state mt-9 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-violet-50 p-6 dark:border-slate-700 dark:from-slate-800 dark:to-indigo-950/70 sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <span className="courses-empty-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-[#3157D5] shadow-sm dark:bg-slate-700 dark:text-blue-300">
                  <BookOpen size={27} />
                </span>
                <div className="flex-1">
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white sm:text-xl">
                    No courses to display yet
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    This page is ready for your course catalogue. Course enrolment and lesson data have not been connected here yet.
                  </p>
                </div>
                <span className="courses-coming-soon inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  <Sparkles size={14} /> Coming soon
                </span>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/learn-skills" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3157D5] px-6 py-4 text-sm font-extrabold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-[#263FAD]">
                Explore learning paths <ArrowRight size={17} />
              </Link>
              <Link href="/account" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-[#3157D5] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-400">
                View my account
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
            {[
              { icon: Target, title: "Choose a goal", detail: "Pick a skill you want to develop." },
              { icon: BookOpen, title: "Learn step by step", detail: "Build understanding at your pace." },
              { icon: GraduationCap, title: "Keep progressing", detail: "Return as your learning grows." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="courses-feature-card rounded-2xl border p-5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <Icon className="text-[#3157D5] dark:text-blue-300" size={22} />
                  <h3 className="mt-3 font-extrabold text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-main">
          <div className="footer-brand-column">
            <Link href="/" className="brand footer-brand">
              <span className="brand-mark"><GraduationCap size={24} /></span>
              <span className="brand-copy">
                <span className="brand-name">Digital <span>World</span></span>
                <span className="brand-caption">LEARN. SKILL. GROW. EARN.</span>
              </span>
            </Link>
            <p>Helping people learn digital knowledge, develop practical skills and explore new possibilities.</p>
          </div>
          <div className="footer-column">
            <h3>Explore</h3>
            <Link href="/learn-skills">Learn Skills</Link>
            <Link href="/courses">Courses</Link>
            <Link href="/about">About Us</Link>
          </div>
          <div className="footer-column">
            <h3>Digital World</h3>
            <Link href="/register">Create Account</Link>
            <Link href="/login">Login</Link>
            <Link href="/account">My Account</Link>
          </div>
          <div className="footer-column footer-help">
            <h3>Keep Growing</h3>
            <p>Take the next step towards learning something new.</p>
            <Link href="/learn-skills" className="footer-cta">Explore Skills <ArrowRight size={16} /></Link>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>Â© 2026 Digital World. All rights reserved.</span>
          <span>Learn. Practise. Grow.</span>
        </div>
      </footer>
    </main>
  );
}









