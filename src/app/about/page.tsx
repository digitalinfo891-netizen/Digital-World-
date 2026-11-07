"use client";
import Image from "next/image";

import Link from "next/link";
import ThemeToggle from "@/components/theme/ThemeToggle";
import MobileNav from "@/components/MobileNav";
import {
  ArrowRight,
  Award,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  Compass,
  GraduationCap,
  Lightbulb,
  Rocket,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

const values = [
  {
    icon: BookOpen,
    title: "Learning for everyone",
    description: "Make useful digital knowledge easier to discover and understand.",
  },
  {
    icon: Target,
    title: "Practical by design",
    description: "Focus on skills and ideas that learners can apply in real situations.",
  },
  {
    icon: Rocket,
    title: "Progress with purpose",
    description: "Encourage steady improvement, curiosity and lifelong learning.",
  },
];

const highlights = [
  { icon: Compass, title: "Explore", detail: "Discover areas that match your interests." },
  { icon: Lightbulb, title: "Understand", detail: "Build knowledge one concept at a time." },
  { icon: Award, title: "Grow", detail: "Turn learning into new possibilities." },
];

export default function AboutPage() {
  return (
    <main className="site-shell about-page min-h-screen overflow-hidden bg-transparent text-slate-900 transition-colors dark:bg-slate-950 dark:text-white">
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
            <Link href="/courses" className="nav-link">Courses</Link>
            <Link href="/about" className="nav-link nav-active">About Us</Link>
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

      {/* Homepage-style hero banner */}
      <section className="hero-section hero-image-section">
        <div className="container hero-image-container">
          <Image
            src="/digital-world-hero.png"
            alt="Digital World - Learn digital skills and grow with digital knowledge"
            width={2048}
            height={512}
            priority
            className="hero-single-image"
          />
        </div>
      </section>


      <section className="about-hero-section relative overflow-hidden bg-gradient-to-r from-[#60a5fa] via-[#7185f5] to-[#8b5cf6] px-5 py-20 dark:from-[#0b1730] dark:via-[#171b46] dark:to-[#351b68] sm:py-28">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-[1160px] items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-4 py-2 text-xs font-extrabold tracking-[0.18em] text-[#3157D5] dark:border-blue-300/20 dark:bg-white/5 dark:text-blue-200">
              <Sparkles size={14} /> ABOUT DIGITAL WORLD
            </span>
            <h1 className="mt-6 max-w-2xl text-4xl font-black leading-[1.08] tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
              Learn today. Build skills. <span className="text-[#3157D5] dark:text-cyan-300">Shape tomorrow.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
              Digital World is a place to explore digital knowledge, discover practical skill areas and take confident steps towards personal and professional growth.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/learn-skills" className="inline-flex items-center gap-2 rounded-xl bg-[#3157D5] px-6 py-4 text-sm font-extrabold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-[#263FAD]">
                Explore Skills <ArrowRight size={17} />
              </Link>
              <Link href="/courses" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/70 px-6 py-4 text-sm font-bold text-slate-700 transition hover:border-blue-400 hover:text-[#3157D5] dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-200 dark:hover:text-blue-300">
                View Courses <BookOpen size={17} />
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[490px]">
            <div className="absolute inset-5 rounded-[36px] bg-gradient-to-br from-blue-500/30 to-violet-500/40 blur-2xl" />
            <div className="relative about-journey-card rounded-[32px] border border-white/70 bg-white/75 p-6 shadow-[0_30px_90px_rgba(40,55,120,0.16)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 sm:p-8">
              <div className="flex items-center justify-between">
                <span className="about-journey-label rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-extrabold tracking-widest text-blue-700 dark:bg-blue-400/10 dark:text-blue-200">OUR LEARNING JOURNEY</span>
                <GraduationCap className="text-[#3157D5] dark:text-cyan-300" size={27} />
              </div>
              <div className="mt-8 rounded-2xl bg-gradient-to-br from-[#1d3d91] via-[#3157D5] to-[#7438c9] p-7 text-white">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/15">
                  <GraduationCap size={34} />
                </div>
                <h2 className="mt-6 text-2xl font-black">Learn. Practise. Grow. Earn.</h2>
                <p className="mt-3 text-sm leading-7 text-blue-100">
                  Discover knowledge, strengthen your skills and keep moving forward.
                </p>
                <div className="mt-7 flex flex-wrap gap-2">
                  {["AI & Technology", "Creative Skills", "Business"].map((label) => (
                    <span key={label} className="rounded-full border border-white/25 bg-white/10 px-3 py-2 text-xs font-semibold text-white">{label}</span>
                  ))}
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {highlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="about-journey-highlight rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800">
                      <Icon className="about-journey-icon mx-auto text-[#3157D5] dark:text-blue-300" size={21} />
                      <p className="about-journey-highlight-text mt-2 text-xs font-extrabold text-slate-800 dark:text-white">{item.title}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-story-section bg-transparent px-5 py-20 dark:bg-slate-950 sm:py-24">
        <div className="mx-auto grid max-w-[1160px] gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <div>
            <span className="text-xs font-extrabold tracking-[0.2em] text-[#3157D5] dark:text-blue-300">WHO WE ARE</span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">A learning space for a digital future</h2>
          </div>
          <div className="space-y-5 text-base leading-8 text-slate-600 dark:text-slate-300">
            <p>
              Digital World is designed to help people explore the fast-changing world of digital skills. Whether you are beginning your learning journey or looking to expand what you already know, the platform brings different learning areas together in one place.
            </p>
            <p>
              From artificial intelligence and web development to digital marketing, business, creative design and finance technology, our aim is to make exploration simple and encourage practical, continuous learning.
            </p>
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              Our focus is simple: make learning approachable, useful and connected to real-world opportunities.
            </p>
          </div>
        </div>
      </section>

      <section className="about-values-section bg-transparent px-5 py-20 dark:bg-slate-900/60 sm:py-24">
        <div className="mx-auto max-w-[1160px]">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="text-xs font-extrabold tracking-[0.2em] text-[#3157D5] dark:text-blue-300">WHAT GUIDES US</span>
            <h2 className="mt-4 text-3xl font-black text-slate-950 dark:text-white sm:text-4xl">Our approach to learning</h2>
            <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">A clear, encouraging path from curiosity to capability.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <article key={value.title} className={`about-value-card rounded-2xl border p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${index === 0 ? "about-value-blue" : index === 1 ? "about-value-purple" : "about-value-green"}`}>
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#3157D5] dark:bg-blue-950 dark:text-blue-300">
                    <Icon size={27} />
                  </span>
                  <h3 className="mt-6 text-xl font-extrabold text-slate-900 dark:text-white">{value.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{value.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="about-cta-section bg-gradient-to-r from-[#162B65] to-[#3157D5] px-5 py-16 text-white sm:py-20">
        <div className="mx-auto flex max-w-[1160px] flex-col items-center justify-between gap-8 text-center md:flex-row md:text-left">
          <div>
            <span className="text-xs font-extrabold tracking-[0.2em] text-blue-200">YOUR NEXT STEP STARTS HERE</span>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Ready to explore what you can learn?</h2>
            <p className="mt-4 max-w-xl leading-7 text-blue-100">Choose an area that interests you and start building your digital knowledge.</p>
          </div>
          <Link href="/learn-skills" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-4 text-sm font-extrabold text-[#2446AD] transition hover:-translate-y-1">
            Explore Learning Areas <ArrowRight size={17} />
          </Link>
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










