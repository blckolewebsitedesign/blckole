"use client";

import { useGSAP } from "@gsap/react";
import { BottomBar } from "components/bottom-bar";
import { FeaturedProducts } from "components/featured-products";
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
  featuredProducts: Product[];
};

export function HomeScene({
  products,
  recommendationsMap = {},
  initialHandle,
  featuredProducts,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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
      History.prototype.pushState.apply(window.history, [
        null,
        "",
        `/looks/${products[index].handle}`,
      ]);
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

  // GSAP: main fades out as you scroll down to reveal content
  useGSAP(
    () => {
      if (!mainRef.current || !contentRef.current) return;

      // Main canvas fades out as the scrollable content glides up over it
      gsap.to(mainRef.current, {
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: contentRef.current,
          start: "top bottom", // when the top of content hits bottom of viewport
          end: "top center", // fully faded out when content reaches the middle
          scrub: true,
        },
      });
    },
    { scope: containerRef },
  );

  const selectedProduct =
    selectedIndex !== null ? products[selectedIndex] : undefined;

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Gives page scrollable height so the 3D models are shown fully before scrolling */}
      <div className={styles.heroSpacer} />

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
        relatedProducts={
          selectedProduct ? recommendationsMap[selectedProduct.id] : undefined
        }
        isExpanded={isExpanded}
        onClose={() => setIsExpanded(false)}
      />

      <div ref={contentRef} className={styles.scrollableContent}>
        <FeaturedProducts products={featuredProducts} />
        <Footer />
      </div>
    </div>
  );
}
