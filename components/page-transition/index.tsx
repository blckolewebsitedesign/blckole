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

  useGSAP(
    () => {
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

  return (
    <div ref={containerRef} key={pathname}>
      {children}
    </div>
  );
}
