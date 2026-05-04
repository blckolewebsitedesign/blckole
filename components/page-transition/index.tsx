"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { usePathname } from "next/navigation";
import { useRef } from "react";

gsap.registerPlugin(useGSAP);

type Props = { children: React.ReactNode };

export function PageTransition({ children }: Props) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);

  // Track the previous pathname so we only fire the fade on actual route
  // changes — not on shallow `history.replaceState` calls (e.g. the home
  // auto-cycle, which silently rotates /looks/<handle>). The previous
  // implementation also re-keyed the wrapper div on pathname which caused
  // the entire subtree (and every WebGL context underneath) to unmount
  // and remount on every cycle.
  const prevPathRef = useRef<string | null>(null);

  useGSAP(
    () => {
      const prev = prevPathRef.current;
      prevPathRef.current = pathname;
      // Skip the very first paint (no previous path) and any same-path call.
      if (prev === null || prev === pathname) return;
      // Skip /looks/<x> ↔ /looks/<y> transitions — these are character
      // swaps within the same scene, handled by ScrollStage's crossfade.
      const isLooks = (p: string | null) => !!p && p.startsWith("/looks/");
      const isHome = (p: string | null) => p === "/";
      if (
        (isLooks(prev) || isHome(prev)) &&
        (isLooks(pathname) || isHome(pathname))
      ) {
        return;
      }
      gsap.fromTo(
        containerRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.4,
          ease: "power2.out",
          clearProps: "opacity",
        },
      );
    },
    { scope: containerRef, dependencies: [pathname], revertOnUpdate: true },
  );

  return <div ref={containerRef}>{children}</div>;
}
