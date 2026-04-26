"use client";

import { useGSAP } from "@gsap/react";
import { BottomBar } from "components/bottom-bar";
import { Footer } from "components/footer";
import { ScrollStage } from "components/scroll-stage";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Product } from "lib/shopify/types";
import { useEffect, useRef, useState } from "react";
import styles from "./index.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type Props = {
  products: Product[];
  recommendationsMap?: Record<string, Product[]>;
  initialHandle?: string;
};

export function HomeScene({ products, recommendationsMap = {}, initialHandle }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(() => {
    if (initialHandle) {
      const idx = products.findIndex((p) => p.handle === initialHandle);
      return idx !== -1 ? idx : null;
    }
    return null;
  });
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  function handleSelect(index: number | null) {
    setSelectedIndex(index);
    setCurrentFrame(0);
    setIsExpanded(false);

    if (index !== null && products[index]) {
      History.prototype.pushState.apply(window.history, [null, "", `/looks/${products[index].handle}`]);
    } else {
      History.prototype.pushState.apply(window.history, [null, "", `/`]);
    }
  }

  // Prevent page scroll when in detail view
  useEffect(() => {
    if (selectedIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedIndex]);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === "/") {
        setSelectedIndex(null);
        setIsExpanded(false);
      } else if (path.startsWith("/looks/")) {
        const handle = path.replace("/looks/", "");
        const idx = products.findIndex((p) => p.handle === handle);
        if (idx !== -1) {
          setSelectedIndex(idx);
          setIsExpanded(false);
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [products]);

  // GSAP: main fades out + footer slides up on scroll
  useGSAP(
    () => {
      if (!mainRef.current || !footerRef.current) return;

      // Main canvas fades out as you scroll toward footer
      gsap.to(mainRef.current, {
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });

      // Footer slides up from 100% → 0% as you scroll
      gsap.fromTo(
        footerRef.current,
        { y: "100%" },
        {
          y: "0%",
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
          },
        }
      );
    },
    { scope: containerRef }
  );

  const selectedProduct =
    selectedIndex !== null ? products[selectedIndex] : undefined;

  return (
    <div ref={containerRef}>
      {/* Gives page scrollable height so footer can slide up */}
      <div className={styles.spacer} />

      <div ref={mainRef} className={styles.mainFixed}>
        <ScrollStage
          products={products}
          selectedIndex={selectedIndex}
          onSelect={handleSelect}
          currentFrame={currentFrame}
          onFrameChange={setCurrentFrame}
          onModelClick={() => setIsExpanded((prev) => !prev)}
        />
      </div>

      <BottomBar
        count={products.length}
        selectedProduct={selectedProduct}
        relatedProducts={selectedProduct ? recommendationsMap[selectedProduct.id] : undefined}
        isExpanded={isExpanded}
        onClose={() => setIsExpanded(false)}
      />

      <div ref={footerRef} className={styles.footerSlider}>
        <Footer />
      </div>
    </div>
  );
}
