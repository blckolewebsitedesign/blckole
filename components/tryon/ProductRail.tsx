"use client";

import { useDisplayMoney } from "components/currency/use-display-money";
import styles from "components/tryon/tryon.module.css";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useTryOnStore } from "stores/useTryOnStore";
import type { TryOnProduct, WearableCategory } from "types/tryon";

type Props = {
  title: string;
  category: WearableCategory;
  products: TryOnProduct[];
  selectedProductIds: string[];
};

export function ProductRail({
  title,
  category,
  products,
  selectedProductIds,
}: Props) {
  const formatPrice = useDisplayMoney();
  const selectProduct = useTryOnStore((state) => state.selectProduct);
  const pendingProduct = useTryOnStore((state) => state.pendingProduct);
  const productErrors = useTryOnStore((state) => state.productErrors);
  const listRef = useRef<HTMLDivElement>(null);
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
  const featuredProduct = useMemo(
    () =>
      products.find((product) => product.id === hoveredProductId) ??
      products.find((product) => selectedProductIds.includes(product.id)) ??
      products[0],
    [hoveredProductId, products, selectedProductIds],
  );

  const featuredActive = featuredProduct
    ? selectedProductIds.includes(featuredProduct.id)
    : false;
  const selectedIndex = products.findIndex((product) =>
    selectedProductIds.includes(product.id),
  );
  const selectedPosition = selectedIndex >= 0 ? selectedIndex + 1 : 0;

  const scrollRail = (direction: -1 | 1) => {
    listRef.current?.scrollBy({
      left: direction * 260,
      behavior: "smooth",
    });
  };

  return (
    <section className={styles.rail} aria-label={title}>
      <header className={styles.railHeader}>
        <h2 className={styles.railTitle}>{title}</h2>
        <span className={styles.railCount}>
          {selectedPosition} / {products.length}
        </span>
      </header>

      {category === "top" && featuredProduct ? (
        <aside className={styles.productCallout}>
          <span className={styles.calloutThumb}>
            {featuredProduct.imageUrl ? (
              <Image
                src={featuredProduct.imageUrl}
                alt=""
                fill
                sizes="86px"
                className={styles.calloutImage}
              />
            ) : null}
          </span>
          <span className={styles.calloutMeta}>
            <strong>{featuredProduct.title}</strong>
            <span>
              {formatPrice(featuredProduct.price, featuredProduct.currencyCode)}
            </span>
            <Link
              href={`/products/${featuredProduct.handle}`}
              className={styles.calloutLink}
            >
              View
            </Link>
            {featuredActive ? (
              <span className={styles.calloutStatus}>Already wearing</span>
            ) : null}
          </span>
        </aside>
      ) : null}

      {products.length === 0 ? (
        <p className={styles.emptyRail}>No compatible pieces yet.</p>
      ) : (
        <div className={styles.railTrack}>
          <button
            type="button"
            className={styles.railArrow}
            onClick={() => scrollRail(-1)}
            aria-label={`Previous ${title}`}
          >
            {"<"}
          </button>
          <div className={styles.productList} ref={listRef}>
            {products.map((product) => {
              const active = selectedProductIds.includes(product.id);
              const pending = pendingProduct?.id === product.id;
              const error = productErrors[product.id];

              return (
                <button
                  key={product.id}
                  type="button"
                  className={`${styles.productCard} ${
                    active ? styles.productCardActive : ""
                  } ${pending ? styles.productCardPending : ""}`}
                  onClick={() => selectProduct(product)}
                  onFocus={() => setHoveredProductId(product.id)}
                  onMouseEnter={() => setHoveredProductId(product.id)}
                  onMouseLeave={() => setHoveredProductId(null)}
                >
                  <span className={styles.productThumb}>
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.title}
                        fill
                        sizes="160px"
                        className={styles.productImage}
                      />
                    ) : (
                      <span className={styles.productImageFallback} />
                    )}
                  </span>
                  <span className={styles.productMeta}>
                    <span className={styles.productTitle}>{product.title}</span>
                    <span className={styles.productPrice}>
                      {formatPrice(product.price, product.currencyCode)}
                    </span>
                    {error ? (
                      <span className={styles.productError}>{error}</span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className={styles.railArrow}
            onClick={() => scrollRail(1)}
            aria-label={`Next ${title}`}
          >
            {">"}
          </button>
        </div>
      )}
    </section>
  );
}
