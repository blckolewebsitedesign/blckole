"use client";

import { Footer } from "components/footer";
import { Manifesto } from "components/manifesto";
import { Newsletter } from "components/newsletter";
import { PressQuote } from "components/press-quote";
import { Principles } from "components/principles";
import { ProductRail } from "components/product-rail";
import { ScrollStage } from "components/scroll-stage";
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

export function HomeScene({
  products,
  recommendationsMap,
  featuredProducts,
}: Props) {
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

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    const fromPath = indexFromPathname(pathname);
    return fromPath ?? 0;
  });
  const [detailOpen, setDetailOpen] = useState<boolean>(() =>
    Boolean(pathname?.startsWith("/looks/")),
  );
  // Recs always start collapsed. The user has to tap the model to expand.
  const [recsOpen, setRecsOpen] = useState<boolean>(false);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const fromPath = indexFromPathname(pathname);
    if (fromPath !== null) {
      setCurrentIndex(fromPath);
      setDetailOpen(true);
      setRecsOpen(false);
    } else {
      setDetailOpen(false);
      setRecsOpen(false);
    }
  }, [pathname, indexFromPathname]);

  useEffect(() => {
    const handleCartOpenChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ open?: boolean }>;
      setCartOpen(Boolean(customEvent.detail?.open));
    };

    setCartOpen(document.body.dataset.cartOpen === "true");
    window.addEventListener("cart-open-change", handleCartOpenChange);
    return () => {
      window.removeEventListener("cart-open-change", handleCartOpenChange);
    };
  }, []);

  useEffect(() => {
    products.forEach((p) => router.prefetch(`/looks/${p.handle}`));
  }, [products, router]);

  const lastUserInteractionRef = useRef(0);
  const detailOpenRef = useRef(detailOpen);
  useEffect(() => {
    detailOpenRef.current = detailOpen;
  }, [detailOpen]);

  const handleSelect = useCallback(
    (index: number, opts?: { open?: boolean; userInitiated?: boolean }) => {
      const open = opts?.open ?? false;
      const userInitiated = opts?.userInitiated ?? true;
      if (userInitiated) {
        lastUserInteractionRef.current = Date.now();
      }
      setCurrentIndex(index);

      const target = products[index] ? `/looks/${products[index].handle}` : "/";

      if (open) {
        setDetailOpen(true);
        setRecsOpen(false);
        if (target !== pathname) {
          router.push(target, { scroll: false });
        }
        return;
      }

      // Just an index change (swipe / thumbnail click). Keep current
      // detail/recs state. If detail is already open, sync the URL.
      if (detailOpenRef.current) {
        if (target !== pathname) {
          window.history.replaceState(null, "", target);
        }
      }
    },
    [products, pathname, router],
  );

  const handleClose = useCallback(() => {
    lastUserInteractionRef.current = Date.now();
    setDetailOpen(false);
    setRecsOpen(false);
    if (pathname !== "/") {
      router.replace("/", { scroll: false });
    }
  }, [pathname, router]);

  const handleToggleRecs = useCallback(() => {
    lastUserInteractionRef.current = Date.now();
    setRecsOpen((prev) => !prev);
  }, []);

  // Auto-advance through characters. Pauses for 12s after any user
  // interaction and stops entirely while the detail mode is active.
  const AUTO_ADVANCE_MS = 5500;
  const PAUSE_AFTER_INTERACTION_MS = 12000;

  useEffect(() => {
    if (products.length === 0) return;
    const id = setInterval(() => {
      if (cartOpen) return;
      if (detailOpenRef.current) return;
      if (
        Date.now() - lastUserInteractionRef.current <
        PAUSE_AFTER_INTERACTION_MS
      ) {
        return;
      }
      setCurrentIndex((cur) => (cur + 1) % products.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [cartOpen, products]);

  return (
    <div style={{ position: "relative" }}>
      <div className={styles.mainFixed}>
        <ScrollStage
          products={products}
          recommendationsMap={recommendationsMap}
          currentIndex={currentIndex}
          detailOpen={detailOpen}
          recsOpen={recsOpen}
          paused={cartOpen}
          onSelect={handleSelect}
          onClose={handleClose}
          onToggleRecs={handleToggleRecs}
        />
      </div>

      {!detailOpen && (
        <div className={styles.scrollableContent}>
          <TrustBar />
          <ProductRail
            eyebrow="Shop"
            title="In the studio now"
            description="Tap a piece to pick size and colour — add to bag from the product page."
            products={featuredProducts}
            viewAllHref="/indexes/products"
            viewAllLabel="Shop entire line"
          />
          <PressQuote />
          <ProductRail
            eyebrow="Featured"
            title="Pieces we keep restocking"
            description="Same flow as any store: browse → open product → choose size → add to bag → checkout when your gateway is live."
            products={featuredProducts}
            viewAllHref="/indexes/products"
            viewAllLabel="View all in shop"
          />
          <Newsletter />
          <Principles />
          <Manifesto />
          <Footer />
        </div>
      )}
    </div>
  );
}
