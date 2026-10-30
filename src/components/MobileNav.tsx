"use client";

import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";

const links = [
  { label: "Home", href: "/" },
  { label: "Learn Skills", href: "/learn-skills" },
  { label: "Categories", href: "/categories" },
  { label: "About Us", href: "/about" },
];

export default function MobileNav() {
  return (
    <div className="mobile-nav">
      <ThemeToggle />

      <details className="mobile-menu-details">
        <summary className="mobile-menu-button" aria-label="Toggle navigation menu">
          <Menu className="mobile-menu-open-icon" size={23} />
          <X className="mobile-menu-close-icon" size={23} />
        </summary>

        <div className="mobile-menu-panel">
          <nav aria-label="Mobile navigation">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`mobile-menu-link${link.href === "/" ? " mobile-menu-home" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mobile-menu-actions">
            <Link href="/login" className="mobile-menu-login">
              Login
            </Link>

            <Link
              href="/register"
              className="button button-primary mobile-menu-register"
            >
              Get Started <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </details>
    </div>
  );
}