"use client";

import { FeaturedProducts } from "components/featured-products";
import { Footer } from "components/footer";
import { ScrollStage } from "components/scroll-stage";
import type { Product } from "lib/shopify/types";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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

  const handleSelect = useCallback(
    (index: number | null) => {
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
        <FeaturedProducts products={featuredProducts} />
        <Footer />
      </div>
    </div>
  );
}
