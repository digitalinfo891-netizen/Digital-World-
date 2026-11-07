"use client";

import Image from "next/image";

import { useMemo, useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/theme/ThemeToggle";
import MobileNav from "@/components/MobileNav";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  Code2,
  GraduationCap,
  Lightbulb,
  Palette,
  Search,
  Sparkles,
  TrendingUp,
  Wallet,
  Clock3,
  Target,
  MonitorPlay,
  Layers3,
} from "lucide-react";

const categories = [
  {
    name: "All Skills",
    icon: Layers3,
    description: "Explore every learning area",
  },
  {
    name: "Artificial Intelligence",
    icon: BrainCircuit,
    description: "AI tools and applications",
  },
  {
    name: "Web Development",
    icon: Code2,
    description: "Websites and digital products",
  },
  {
    name: "Digital Marketing",
    icon: TrendingUp,
    description: "Marketing and online growth",
  },
  {
    name: "Business",
    icon: BriefcaseBusiness,
    description: "Business and entrepreneurship",
  },
  {
    name: "Creative Design",
    icon: Palette,
    description: "Design and creativity",
  },
  {
    name: "Finance & Technology",
    icon: Wallet,
    description: "Finance and digital technology",
  },
];

const learningPaths = [
  {
    title: "AI Tools & Productivity",
    category: "Artificial Intelligence",
    level: "Beginner",
    duration: "Self-paced",
    description:
      "Discover AI tools, prompt writing and practical ways to improve everyday productivity.",
    icon: BrainCircuit,
    initials: "AI",
    color: "blue",
    topics: ["AI fundamentals", "Prompt writing", "AI productivity"],
  },
  {
    title: "Web Development Fundamentals",
    category: "Web Development",
    level: "Beginner",
    duration: "Self-paced",
    description:
      "Understand how websites work and explore HTML, CSS, JavaScript and modern web development.",
    icon: Code2,
    initials: "WD",
    color: "purple",
    topics: ["HTML & CSS", "JavaScript", "Web fundamentals"],
  },
  {
    title: "Digital Marketing Essentials",
    category: "Digital Marketing",
    level: "Beginner",
    duration: "Self-paced",
    description:
      "Explore SEO, social media, content creation and digital marketing strategies.",
    icon: TrendingUp,
    initials: "DM",
    color: "green",
    topics: ["SEO basics", "Social media", "Content strategy"],
  },
  {
    title: "Business & Entrepreneurship",
    category: "Business",
    level: "Intermediate",
    duration: "Self-paced",
    description:
      "Learn about business ideas, customer needs, planning and digital business opportunities.",
    icon: BriefcaseBusiness,
    initials: "BE",
    color: "orange",
    topics: ["Business planning", "Customers", "Digital business"],
  },
  {
    title: "Creative Design Fundamentals",
    category: "Creative Design",
    level: "Beginner",
    duration: "Self-paced",
    description:
      "Explore visual communication, creative concepts, design principles and digital graphics.",
    icon: Palette,
    initials: "CD",
    color: "pink",
    topics: ["Design principles", "Visual design", "Creativity"],
  },
  {
    title: "Finance & Digital Technology",
    category: "Finance & Technology",
    level: "Intermediate",
    duration: "Self-paced",
    description:
      "Build an understanding of digital finance, technology trends and financial awareness.",
    icon: Wallet,
    initials: "FT",
    color: "cyan",
    topics: ["Digital finance", "Technology", "Financial awareness"],
  },
];

const benefits = [
  {
    icon: BookOpen,
    title: "Learn at your pace",
    description:
      "Explore learning topics and develop knowledge at a comfortable pace.",
  },
  {
    icon: Target,
    title: "Build practical skills",
    description:
      "Focus on useful concepts that can be applied to personal projects and work.",
  },
  {
    icon: TrendingUp,
    title: "Explore opportunities",
    description:
      "Use your knowledge to discover new career, freelance and business possibilities.",
  },
];

export default function LearnSkillsPage() {
  const [activeCategory, setActiveCategory] = useState("All Skills");
  const [search, setSearch] = useState("");
  const [activeLevel, setActiveLevel] = useState("All Levels");

  const filteredPaths = useMemo(() => {
    return learningPaths.filter((path) => {
      const matchesCategory =
        activeCategory === "All Skills" ||
        path.category === activeCategory;

      const matchesLevel =
        activeLevel === "All Levels" ||
        path.level === activeLevel;

      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        path.title.toLowerCase().includes(searchText) ||
        path.category.toLowerCase().includes(searchText) ||
        path.description.toLowerCase().includes(searchText) ||
        path.topics.some((topic) =>
          topic.toLowerCase().includes(searchText)
        );

      return matchesCategory && matchesLevel && matchesSearch;
    });
  }, [activeCategory, activeLevel, search]);

  return (
    <main className="learn-skills-page site-shell min-h-screen overflow-hidden transition-colors">
      {/* Homepage-style top information bar */}
      <div className="top-strip">
        <div className="container top-strip-inner">
          <span>Knowledge is your power. Skills are your future.</span>
          <span className="top-strip-right">Learn. Practise. Grow.</span>
        </div>
      </div>

      {/* Shared homepage navigation */}
      <header className="site-header">
        <nav className="container navbar" aria-label="Main navigation">

          <Link href="/" className="brand" aria-label="Digital World home">
            <span className="brand-mark">
              <GraduationCap size={25} strokeWidth={2.2} />
            </span>
            <span className="brand-copy">
              <span className="brand-name">
                Digital <span>World</span>
              </span>
              <span className="brand-caption">LEARN. SKILL. GROW. EARN.</span>
            </span>
          </Link>

          <MobileNav />

          <div className="nav-links">
            <Link href="/" className="nav-link">Home</Link>
            <Link href="/learn-skills" className="nav-link nav-active">Learn Skills</Link>
            <Link href="/courses" className="nav-link">Courses</Link>
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

      {/* Full-width homepage hero banner */}
      <section className="hero-section hero-image-section">
        <div className="container hero-image-container">
          <Image
            src="/digital-world-learn-skills-hero.png"
            alt="Explore digital skills and modern learning opportunities"
            width={2048}
            height={512}
            priority
            className="hero-single-image"
          />
        </div>
      </section>

      {/* Category explorer */}

      {/* Category explorer */}
      <section className="bg-slate-50 py-20 dark:bg-slate-900/60">
        <div className="mx-auto max-w-[1160px] px-5">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="text-xs font-extrabold tracking-[0.2em] text-[#3157D5]">
              EXPLORE YOUR INTERESTS
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Discover Your Learning Area
            </h2>
            <p className="mt-4 leading-7 text-slate-600 dark:text-slate-400">
              Choose a skill area that interests you and start exploring
              the knowledge you need to move forward.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.slice(1).map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.name}
                  onClick={() => {
                    setActiveCategory(category.name);
                    document.getElementById("learning-paths")?.scrollIntoView({
                      behavior: "smooth",
                    });
                  }}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#3157D5]/50 hover:shadow-xl dark:border-slate-800 dark:bg-slate-950"
                >
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#3157D5] transition group-hover:bg-[#3157D5] group-hover:text-white dark:bg-blue-950">
                    <Icon size={27} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-extrabold">{category.name}</span>
                    <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">
                      {category.description}
                    </span>
                  </span>
                  <ArrowRight size={18} className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#3157D5]" />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Learning paths */}
      <section id="learning-paths" className="scroll-mt-24 bg-white py-20 dark:bg-slate-950">
        <div className="mx-auto max-w-[1160px] px-5">

          <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <span className="text-xs font-extrabold tracking-[0.2em] text-[#3157D5]">
                FIND YOUR PATH
              </span>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Explore Learning Paths
              </h2>
              <p className="mt-3 max-w-xl leading-7 text-slate-600 dark:text-slate-400">
                Explore curated learning topics across different digital
                skill areas.
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-[#3157D5] dark:bg-blue-950 dark:text-blue-300">
              <BookOpen size={17} />
              {learningPaths.length} learning paths
            </span>
          </div>

          {/* Search and filters */}
          <div className="mb-9 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search skills, topics or learning paths..."
                  aria-label="Search learning paths"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#3157D5] focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
                />
              </div>

              <select
                value={activeLevel}
                onChange={(event) => setActiveLevel(event.target.value)}
                aria-label="Filter by learning level"
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#3157D5] dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option>All Levels</option>
                <option>Beginner</option>
                <option>Intermediate</option>
              </select>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => setActiveCategory(category.name)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                    activeCategory === category.name
                      ? "bg-[#3157D5] text-white shadow-md"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-[#3157D5] hover:text-[#3157D5] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Learning path cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPaths.map((path) => {
              const Icon = path.icon;
              return (
                <article
                  key={path.title}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className={`relative flex h-36 items-center justify-center overflow-hidden ${
                    path.color === "blue" ? "bg-blue-50 dark:bg-blue-950/60" :
                    path.color === "purple" ? "bg-violet-50 dark:bg-violet-950/60" :
                    path.color === "green" ? "bg-emerald-50 dark:bg-emerald-950/60" :
                    path.color === "orange" ? "bg-orange-50 dark:bg-orange-950/60" :
                    path.color === "pink" ? "bg-pink-50 dark:bg-pink-950/60" :
                    "bg-cyan-50 dark:bg-cyan-950/60"
                  }`}>
                    <span className="absolute -right-8 -top-12 h-48 w-48 rounded-full border-[25px] border-white/50 dark:border-white/5" />
                    <span className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-[#3157D5] shadow-xl dark:bg-slate-900">
                      <Icon size={39} strokeWidth={1.8} />
                    </span>
                    <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-extrabold tracking-wide text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                      {path.category.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-[#3157D5] dark:bg-blue-950 dark:text-blue-300">
                        {path.level}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <Clock3 size={12} /> {path.duration}
                      </span>
                    </div>

                    <h3 className="mt-5 text-xl font-extrabold leading-snug">
                      {path.title}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-7 text-slate-500 dark:text-slate-400">
                      {path.description}
                    </p>

                    <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                      <p className="mb-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                        Topics covered
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {path.topics.map((topic) => (
                          <span key={topic} className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>

                    <Link
                      href="/register"
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#3157D5] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#263FAD]"
                    >
                      Get Started <ArrowRight size={16} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          {filteredPaths.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
              <Search size={36} className="mx-auto text-slate-400" />
              <h3 className="mt-4 text-xl font-bold">No learning paths found</h3>
              <p className="mt-2 text-sm text-slate-500">
                Try a different search term or category.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setActiveCategory("All Skills");
                  setActiveLevel("All Levels");
                }}
                className="mt-5 rounded-xl bg-[#3157D5] px-5 py-3 text-sm font-bold text-white"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-slate-50 py-20 dark:bg-slate-900/60">
        <div className="mx-auto max-w-[1160px] px-5">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="text-xs font-extrabold tracking-[0.2em] text-[#3157D5]">
              THE DIGITAL WORLD APPROACH
            </span>
            <h2 className="mt-4 text-3xl font-black sm:text-4xl">
              Learn With Purpose
            </h2>
            <p className="mt-4 leading-7 text-slate-600 dark:text-slate-400">
              Make learning a part of your journey towards personal
              and professional growth.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="learn-benefit-card">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#3157D5] dark:bg-blue-950">
                    <Icon size={27} />
                  </span>
                  <span className="mt-6 block text-xs font-extrabold tracking-widest text-[#3157D5]">
                    0{index + 1}
                  </span>
                  <h3 className="mt-2 text-xl font-extrabold">{benefit.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#162B65] to-[#3157D5] px-5 py-20 text-white">
        <div className="mx-auto flex max-w-[1160px] flex-col items-center justify-between gap-8 text-center md:flex-row md:text-left">
          <div>
            <span className="text-xs font-extrabold tracking-[0.2em] text-blue-200">
              START YOUR JOURNEY
            </span>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Ready to learn and grow?
            </h2>
            <p className="mt-4 max-w-xl leading-7 text-blue-100">
              Join Digital World and start exploring new areas of digital knowledge.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap justify-center gap-3">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-4 text-sm font-extrabold text-[#2446AD] transition hover:-translate-y-1">
              Create Account <ArrowRight size={17} />
            </Link>
            <Link href="/login" className="rounded-xl border border-white/40 px-6 py-4 text-sm font-bold text-white hover:bg-white/10">
              Login
            </Link>
          </div>
        </div>
      </section>
      {/* Footer — shared homepage design */}
      <footer className="site-footer">
        <div className="container footer-main">
          <div className="footer-brand-column">
            <Link href="/" className="brand footer-brand">
              <span className="brand-mark">
                <GraduationCap size={24} />
              </span>
              <span className="brand-copy">
                <span className="brand-name">Digital <span>World</span></span>
                <span className="brand-caption">LEARN. SKILL. GROW. EARN.</span>
              </span>
            </Link>
            <p>
              Helping people learn digital knowledge, develop practical skills
              and explore new possibilities.
            </p>
          </div>

          <div className="footer-column">
            <h3>Explore</h3>
            <Link href="/learn-skills">Learn Skills</Link>
            <Link href="/courses">Courses</Link>
            <Link href="/account">My Account</Link>
          </div>

          <div className="footer-column">
            <h3>Digital World</h3>
            <Link href="/about">About Us</Link>
            <Link href="/register">Create Account</Link>
            <Link href="/login">Login</Link>
          </div>

          <div className="footer-column footer-help">
            <h3>Keep Growing</h3>
            <p>Take the first step towards learning something new.</p>
            <Link href="/register" className="footer-cta">
              Join Digital World <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="container footer-bottom">
          <span>© 2026 Digital World. All rights reserved.</span>
          <span className="footer-bottom-links">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Use</Link>
          </span>
        </div>
      </footer>

    </main>
  );
}










