"use client";

import { Footer } from "components/footer";
import { Manifesto } from "components/manifesto";
import { Newsletter } from "components/newsletter";
import { PressQuote } from "components/press-quote";
import { Principles } from "components/principles";
import { RestockingCollection } from "components/restocking-collection";
import { ScrollStage } from "components/scroll-stage";
import { StudioSpotlight } from "components/studio-spotlight";
import { TrustBar } from "components/trust-bar";
import type { Product } from "lib/shopify/types";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./index.module.css";

type Props = {
  products: Product[];
  recommendationsMap?: Record<string, Product[]>;
  featuredProducts: Product[];
};

export function HomeScene({ products, featuredProducts }: Props) {
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

  const [selectedIndex, setSelectedIndex] = useState<number | null>(() =>
    indexFromPathname(pathname),
  );

  useEffect(() => {
    setSelectedIndex(indexFromPathname(pathname));
  }, [pathname, indexFromPathname]);

  useEffect(() => {
    products.forEach((p) => router.prefetch(`/looks/${p.handle}`));
  }, [products, router]);

  const lastUserInteractionRef = useRef(0);

  const handleSelect = useCallback(
    (index: number | null) => {
      lastUserInteractionRef.current = Date.now();
      setSelectedIndex(index);
      const target =
        index !== null && products[index]
          ? `/looks/${products[index].handle}`
          : "/";
      if (target === pathname) return;

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

  // Auto-advance through characters one by one. Pauses for 12s after any
  // user interaction so manual browsing isn't fought by the carousel.
  const AUTO_ADVANCE_MS = 5500;
  const PAUSE_AFTER_INTERACTION_MS = 12000;

  console.log("products", products);

  useEffect(() => {
    if (products.length === 0) return;
    const id = setInterval(() => {
      if (
        Date.now() - lastUserInteractionRef.current <
        PAUSE_AFTER_INTERACTION_MS
      ) {
        return;
      }
      // Visual-only update. Do NOT touch the URL — pathname changes
      // cascade through usePathname() consumers (PageTransition, etc.)
      // and have caused full-tree remounts that nuke WebGL contexts.
      // The URL only updates when the user actually clicks a thumbnail.
      setSelectedIndex((cur) => ((cur ?? -1) + 1) % products.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [products]);

  return (
    <div style={{ position: "relative" }}>
      {/* 100vh Main Interactive Stage (40/60 Split) */}
      <div className={styles.mainFixed}>
        <ScrollStage
          products={products}
          selectedIndex={selectedIndex}
          onSelect={handleSelect}
        />
      </div>

      {/* Normal scrollable content below the stage */}
      <div className={styles.scrollableContent}>
        <TrustBar />
        <StudioSpotlight products={featuredProducts} />
        <PressQuote />
        <RestockingCollection products={featuredProducts} />
        <Newsletter />
        <Principles />
        <Manifesto />
        <Footer />
      </div>
    </div>
  );
}
