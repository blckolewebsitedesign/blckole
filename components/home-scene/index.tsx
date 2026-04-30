"use client";

import { useGSAP } from "@gsap/react";
import { BottomBar } from "components/bottom-bar";
import { FeaturedProducts } from "components/featured-products";
import { Footer } from "components/footer";
import { ScrollStage } from "components/scroll-stage";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Product } from "lib/shopify/types";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./index.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);
const EMPTY_MAP: Record<string, Product[]> = {};

type Props = {
  products: Product[];
  recommendationsMap?: Record<string, Product[]>;
  featuredProducts: Product[];
};

export function HomeScene({
  products,
  recommendationsMap = EMPTY_MAP,
  featuredProducts,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const pathname = usePathname();

  const indexFromPathname = useCallback(
    (path: string | null): number | null => {
      if (!path?.startsWith("/looks/")) return null;
      const handle = path.slice("/looks/".length);
      const idx = products.findIndex((p) => p.handle === handle);
      return idx === -1 ? null : idx;
    },
    [products],
  );

  // selectedIndex is local state seeded from the URL. Click handlers update
  // it optimistically so the GSAP tween fires in the same frame; the
  // router.push/replace below merely syncs the URL afterwards. A useEffect
  // pulls the URL back into state on external changes (back/forward, deep
  // links) so URL stays the source of truth on navigation events.
  const [selectedIndex, setSelectedIndex] = useState<number | null>(() =>
    indexFromPathname(pathname),
  );
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setSelectedIndex(indexFromPathname(pathname));
  }, [pathname, indexFromPathname]);

  // Collapse the bottom panel whenever the look changes.
  useEffect(() => {
    setIsExpanded(false);
  }, [selectedIndex]);

  // Warm the RSC payload for every look so router.replace is instant.
  useEffect(() => {
    products.forEach((p) => router.prefetch(`/looks/${p.handle}`));
  }, [products, router]);

  const handleSelect = useCallback(
    (index: number | null) => {
      setSelectedIndex(index);
      const target =
        index !== null && products[index]
          ? `/looks/${products[index].handle}`
          : "/";
      if (target === pathname) return;

      // push only when entering detail from listing; replace for closing back to "/"
      // For look-to-look in-scene navigation, bypass Next.js router entirely to 
      // avoid server data fetching delays that cause jumpy/laggy scrubbing.
      if (pathname === "/" && target !== "/") {
        router.push(target, { scroll: false });
      } else if (target === "/") {
        router.replace(target, { scroll: false });
      } else {
        window.history.replaceState(null, "", target);
      }
    },
    [products, pathname, router],
  );

  // When entering detail view, scroll to the position matching the selected model.
  // ScrollTrigger maps scrollY to a continuous model index: index = scrollY / innerHeight
  const prevSelectedRef = useRef<number | null>(null);
  useEffect(() => {
    const justEntered = selectedIndex !== null && prevSelectedRef.current === null;
    prevSelectedRef.current = selectedIndex;
    if (justEntered) {
      // Use rAF to ensure the scroll proxy div is mounted first
      requestAnimationFrame(() => {
        window.scrollTo({ top: selectedIndex * window.innerHeight, behavior: 'instant' as ScrollBehavior });
      });
    }
  }, [selectedIndex]);

  // GSAP: main fades out as the scrollable content glides up over it
  useGSAP(
    () => {
      if (!mainRef.current || !contentRef.current) return;

      gsap.to(mainRef.current, {
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: {
          trigger: contentRef.current,
          start: "top 90%",
          end: "top 30%",
          scrub: 1,
        },
      });
    },
    { scope: containerRef, dependencies: [] },
  );

  const selectedProduct = useMemo(
    () => (selectedIndex !== null ? products[selectedIndex] : undefined),
    [selectedIndex, products],
  );

  const handleModelClick = useCallback(
    () => setIsExpanded((prev) => !prev),
    [],
  );

  const relatedProducts = useMemo(
    () =>
      selectedProduct ? recommendationsMap[selectedProduct.id] : undefined,
    [selectedProduct, recommendationsMap],
  );
  console.log("home scene rendering......", selectedIndex, isExpanded);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Gives page scrollable height so the 3D models are shown fully before scrolling */}
      <div className={styles.heroSpacer} style={{ display: selectedIndex !== null ? 'none' : 'block' }} />

      {/* Detail View Scrolling Proxy */}
      {selectedIndex !== null && (
        <div id="detail-scroll-proxy" style={{ height: `${products.length * 100}vh`, width: '100%' }} />
      )}

      <div ref={mainRef} className={styles.mainFixed}>
        <ScrollStage
          products={products}
          selectedIndex={selectedIndex}
          onSelect={handleSelect}
          onModelClick={handleModelClick}
        />
      </div>

      <BottomBar
        count={products.length}
        selectedProduct={selectedProduct}
        relatedProducts={relatedProducts}
        isExpanded={isExpanded}
        onClose={() => setIsExpanded(false)}
      />

      {selectedIndex === null && (
        <div ref={contentRef} className={styles.scrollableContent}>
          <FeaturedProducts products={featuredProducts} />
          <Footer />
        </div>
      )}
    </div>
  );
}
