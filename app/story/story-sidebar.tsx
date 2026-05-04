"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

const ITEMS = [
  { id: "intro", label: "Intro" },
  { id: "how-this-started", label: "How this started" },
  { id: "what-we-actually-make", label: "What we actually make" },
  { id: "how-we-use-colour", label: "How we use colour" },
  { id: "timeline", label: "Timeline" },
];

export function StorySidebar() {
  const [active, setActive] = useState<string>("intro");

  useEffect(() => {
    const els = ITEMS.map((it) => document.getElementById(it.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // pick the section whose top is closest to (and above) the viewport's
        // upper third. Stable, no flicker.
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const top = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
        );
        setActive(top.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: 0 },
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <aside className={styles.sidebar} aria-label="Story sections">
      <ol className={styles.sidebarList}>
        {ITEMS.map((it) => {
          const isActive = active === it.id;
          return (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                className={`${styles.sidebarLink} ${
                  isActive ? styles.sidebarLinkActive : ""
                }`}
                aria-current={isActive ? "true" : undefined}
              >
                <span
                  className={`${styles.sidebarDot} ${
                    isActive ? styles.sidebarDotActive : ""
                  }`}
                  aria-hidden="true"
                />
                <span className={styles.sidebarLabel}>{it.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
