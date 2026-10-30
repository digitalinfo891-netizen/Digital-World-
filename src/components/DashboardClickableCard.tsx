"use client";

import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from "react";

type DashboardClickableCardProps = {
  href: string;
  className: string;
  style?: CSSProperties;
  children: ReactNode;
};

export default function DashboardClickableCard({
  href,
  className,
  style,
  children,
}: DashboardClickableCardProps) {
  function navigate(event: MouseEvent<HTMLElement>) {
    const target = event.target;
    if (target instanceof Element && target.closest("a, button")) {
      return;
    }

    window.location.assign(href);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.target !== event.currentTarget) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      window.location.assign(href);
    }
  }

  return (
    <article
      role="link"
      aria-label={`Open ${href}`}
      tabIndex={0}
      onClick={navigate}
      onKeyDown={handleKeyDown}
      className={`${className} cursor-pointer transition duration-200 ease-out hover:-translate-y-1 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 motion-reduce:transform-none`}
      style={style}
    >
      {children}
    </article>
  );
}
