import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "@/components/theme/ThemeToggle";
import MobileNav from "@/components/MobileNav";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Code2,
  GraduationCap,
  Lightbulb,
  MonitorPlay,
  Palette,
  Rocket,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

const categories = [
  { name: "Artificial Intelligence", description: "Explore AI tools and applications", icon: BrainCircuit, color: "blue" },
  { name: "Web Development", description: "Build websites and digital products", icon: Code2, color: "purple" },
  { name: "Digital Marketing", description: "Learn online marketing strategies", icon: TrendingUp, color: "green" },
  { name: "Business & Entrepreneurship", description: "Turn ideas into business value", icon: Lightbulb, color: "orange" },
  { name: "Creative Design", description: "Develop creative digital skills", icon: Palette, color: "pink" },
  { name: "Finance & Technology", description: "Understand the digital economy", icon: Wallet, color: "cyan" },
];

const learningPaths = [
  {
    title: "Web Development Fundamentals",
    category: "Technology",
    level: "Beginner",
    duration: "Self-paced learning",
    description: "Understand how websites work and start building your digital projects.",
    initials: "WD",
    color: "blue",
  },
  {
    title: "Digital Marketing Essentials",
    category: "Marketing",
    level: "Beginner",
    duration: "Self-paced learning",
    description: "Explore SEO, social media, content strategy and online promotion.",
    initials: "DM",
    color: "green",
  },
  {
    title: "AI Tools & Productivity",
    category: "Artificial Intelligence",
    level: "Beginner",
    duration: "Self-paced learning",
    description: "Discover practical ways to use AI tools for learning and productivity.",
    initials: "AI",
    color: "purple",
  },
];

const benefits = [
  {
    icon: BookOpen,
    title: "Learn digital knowledge",
    description: "Explore useful topics and build a strong foundation in digital skills.",
  },
  {
    icon: ShieldCheck,
    title: "Practise with purpose",
    description: "Apply what you learn through practical activities and personal projects.",
  },
  {
    icon: TrendingUp,
    title: "Create earning opportunities",
    description: "Use your knowledge and skills to explore freelancing, services and business ideas.",
  },
];

export default function HomePage() {
  return (
    <main className="site-shell">
      <div className="top-strip">
        <div className="container top-strip-inner">
          <span>Knowledge is your power. Skills are your future.</span>
          <span className="top-strip-right">
            <ShieldCheck size={15} />
            Learn. Practise. Grow.
          </span>
        </div>
      </div>

      <header className="site-header">
        <nav className="container navbar" aria-label="Main navigation">
          <Link href="/" className="brand" aria-label="Digital World home">
            <span className="brand-mark">
              <GraduationCap size={25} strokeWidth={2.2} />
            </span>
            <span className="brand-copy">
              <span className="brand-name">Digital <span>World</span></span>
              <span className="brand-caption">LEARN. SKILL. GROW. EARN.</span>
            </span>
          </Link>

          <MobileNav />

          <div className="nav-links">
            <Link className="nav-link nav-active" href="/">Home</Link>
            <Link className="nav-link" href="/learn-skills">Learn Skills</Link>
            <Link className="nav-link" href="/categories">Categories</Link>
            <Link className="nav-link" href="/about">About Us</Link>
          </div>

          <div className="nav-actions">
            <ThemeToggle />
            <Link className="login-link" href="/login">Login</Link>
            <Link className="button button-primary nav-register" href="/register">
              Get Started <ArrowRight size={16} />
            </Link>
          </div>
        </nav>
      </header>

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

      <section className="trust-section">
        <div className="container trust-inner">
          <div className="trust-copy">
            <strong>One platform. More possibilities.</strong>
            <span>Your journey from knowledge to practical skills.</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon trust-icon-blue"><BookOpen size={21} /></span>
            <span><strong>Learn</strong><small>Build knowledge</small></span>
          </div>
          <div className="trust-item">
            <span className="trust-icon trust-icon-green"><MonitorPlay size={21} /></span>
            <span><strong>Practise</strong><small>Apply your skills</small></span>
          </div>
          <div className="trust-item">
            <span className="trust-icon trust-icon-purple"><TrendingUp size={21} /></span>
            <span><strong>Grow</strong><small>Explore opportunities</small></span>
          </div>
        </div>
      </section>

      <section className="section category-section" id="categories">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="section-kicker">EXPLORE DIGITAL KNOWLEDGE</span>
              <h2>Discover skills that <span>move you forward.</span></h2>
              <p>Choose an area of interest and begin building your digital knowledge.</p>
            </div>
            <Link href="/categories" className="text-link">
              All categories <ArrowRight size={17} />
            </Link>
          </div>

          <div className="category-grid">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  href="/categories"
                  className="category-card"
                  key={category.name}
                >
                  <span className={`category-icon category-${category.color}`}>
                    <Icon size={25} strokeWidth={1.8} />
                  </span>
                  <span className="category-title">{category.name}</span>
                  <span className="category-description">{category.description}</span>
                  <span className="category-arrow"><ArrowRight size={17} /></span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section jobs-section" id="featured-learning">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="section-kicker">START YOUR LEARNING JOURNEY</span>
              <h2>Explore featured <span>learning paths.</span></h2>
              <p>Illustrative learning topics to help you discover where to begin.</p>
            </div>
            <Link href="/learn-skills" className="text-link">
              Explore learning <ArrowRight size={17} />
            </Link>
          </div>

          <div className="jobs-grid">
            {learningPaths.map((path) => (
              <article className="job-card" key={path.title}>
                <div className="job-card-header">
                  <span className={`company-logo company-${path.color}`}>{path.initials}</span>
                  <span className="job-type">{path.level}</span>
                </div>
                <span className="job-company">{path.category}</span>
                <h3>{path.title}</h3>
                <p>{path.description}</p>
                <div className="job-meta">
                  <span><GraduationCap size={15} /> {path.level}</span>
                  <span><BookOpen size={15} /> {path.duration}</span>
                </div>
                <div className="job-card-footer">
                  <span className="job-tag">Learning path</span>
                  <Link
                    href="/learn-skills"
                    className="job-apply-link"
                    aria-label={`Explore ${path.title}`}
                  >
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <p className="demo-note">
            These are illustrative learning paths, not a list of verified or currently available courses.
          </p>
        </div>
      </section>

      <section className="section why-section">
        <div className="container why-grid">
          <div className="why-intro">
            <span className="section-kicker">KNOWLEDGE INTO ACTION</span>
            <h2>Learn today. Build skills. <span>Create opportunities.</span></h2>
            <p>
              Digital World encourages continuous learning and practical
              digital knowledge to help you take confident steps toward your goals.
            </p>
            <Link href="/register" className="button button-primary">
              Start your journey <ArrowRight size={17} />
            </Link>
          </div>
          <div className="benefit-list">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div className="benefit-item" key={benefit.title}>
                  <span className="benefit-number">0{index + 1}</span>
                  <span className="benefit-icon"><Icon size={23} /></span>
                  <div>
                    <h3>{benefit.title}</h3>
                    <p>{benefit.description}</p>
                  </div>
                  <ChevronRight className="benefit-chevron" size={20} />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="employer-section">
        <div className="container">
          <div className="employer-banner">
            <div className="employer-art">
              <span className="employer-art-circle"><Lightbulb size={39} /></span>
              <span className="employer-art-spark spark-one"><Sparkles size={18} /></span>
              <span className="employer-art-spark spark-two"><Users size={21} /></span>
            </div>
            <div className="employer-copy">
              <span className="section-kicker">SHARE KNOWLEDGE</span>
              <h2>Have knowledge worth sharing?</h2>
              <p>Help others discover useful skills, learn new ideas and grow their digital knowledge.</p>
            </div>
            <Link href="/register" className="button employer-button">
              Join Digital World <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="container final-cta-inner">
          <div>
            <span className="section-kicker">YOUR LEARNING JOURNEY STARTS TODAY</span>
            <h2>Ready to learn and grow?</h2>
            <p>Create your account and begin exploring digital knowledge.</p>
          </div>
          <div className="final-cta-actions">
            <Link href="/register" className="button button-white">
              Start Learning <ArrowRight size={17} />
            </Link>
            <Link href="/login" className="final-login">Already registered? Log in</Link>
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
            <Link href="/categories">Learning Categories</Link>
            <Link href="/about">About Digital World</Link>
          </div>
          <div className="footer-column">
            <h3>Digital World</h3>
            <Link href="/about">About Us</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/register">Create Account</Link>
            <Link href="/login">Login</Link>
          </div>
          <div className="footer-column footer-help">
            <h3>Get started</h3>
            <p>Take the first step toward learning something new.</p>
            <Link href="/register" className="footer-cta">
              Join Digital World <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {2026} Digital World. All rights reserved.</span>
          <span className="footer-bottom-links">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Use</Link>
          </span>
        </div>
      </footer>
    </main>
  );
}



