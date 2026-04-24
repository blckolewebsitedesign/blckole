"use client";

import { RotatingFigure } from "components/rotating-figure";
import type { Product } from "lib/shopify/types";
import { useState } from "react";
import styles from "./index.module.css";

type Props = {
  products: Product[];
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function ScrollStage({ products }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (products.length === 0) return null;

  const product = products[activeIndex]!;
  const total = products.length;

  function prev() {
    setActiveIndex((i) => (i - 1 + total) % total);
  }

  function next() {
    setActiveIndex((i) => (i + 1) % total);
  }

  return (
    <div className={styles.scrollDriver}>
      <section className={styles.sticky}>
        {/* Title overlay — top-left */}
        <div className={styles.titleOverlay}>
          <span className={styles.breadcrumb}>
            COLLECTION {pad(activeIndex + 1)} / {pad(total)}
          </span>
          <h1 className={styles.collectionTitle}>{product.title}</h1>
          <div className={styles.productsMeta}>
            <span className={styles.productsLabel}>PRODUCTS</span>
            <span className={styles.productsCount}>{total}</span>
          </div>
        </div>

        {/* Large centered product figure */}
        <div className={styles.figure}>
          <RotatingFigure product={product} priority />
        </div>

        {/* Prev / next navigation */}
        {total > 1 && (
          <div className={styles.nav}>
            <button
              className={styles.navBtn}
              onClick={prev}
              aria-label="Previous product"
            >
              ← PREV
            </button>

            <div className={styles.dots}>
              {products.map((_, i) => (
                <button
                  key={i}
                  className={`${styles.dot}${i === activeIndex ? ` ${styles.dotActive}` : ""}`}
                  onClick={() => setActiveIndex(i)}
                  aria-label={`Product ${i + 1}`}
                />
              ))}
            </div>

            <button
              className={styles.navBtn}
              onClick={next}
              aria-label="Next product"
            >
              NEXT →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
