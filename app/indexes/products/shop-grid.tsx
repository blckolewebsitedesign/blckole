"use client";

import { ProductCard } from "components/product-card";
import type { Product } from "lib/shopify/types";
import { useMemo, useState } from "react";
import styles from "./page.module.css";

const ALL = "ALL";

type Props = { products: Product[] };

export function ShopGrid({ products }: Props) {
  const [active, setActive] = useState<string>(ALL);

  const categories = useMemo(() => {
    const set = new Map<string, string>();
    for (const p of products) {
      const t = (p.productType || "").trim();
      if (!t) continue;
      const key = t.toUpperCase();
      if (!set.has(key)) set.set(key, t);
    }
    return [ALL, ...Array.from(set.keys()).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    if (active === ALL) return products;
    return products.filter(
      (p) => (p.productType || "").toUpperCase() === active,
    );
  }, [active, products]);

  return (
    <>
      {categories.length > 1 ? (
        <div className={styles.chips} role="tablist" aria-label="Categories">
          {categories.map((c) => {
            const isActive = c === active;
            return (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(c)}
                className={`${styles.chip} ${
                  isActive ? styles.chipActive : ""
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className={styles.grid}>
        {filtered.map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            index={i}
            priority={i < 8}
          />
        ))}
      </div>
    </>
  );
}
