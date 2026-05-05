"use client";

import type { Product } from "lib/shopify/types";
import Image from "next/image";
import Link from "next/link";
import styles from "./index.module.css";

type Props = {
  product: Product;
  index: number;
  total: number;
  recommendations: Product[];
  expanded: boolean;
  onClose: () => void;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatPrice(amount: string, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export function LookInfo({
  product,
  index,
  total,
  recommendations,
  expanded,
  onClose,
}: Props) {
  const items = recommendations.slice(0, 6);

  return (
    <div className={styles.panel}>
      <button type="button" className={styles.back} onClick={onClose}>
        <span aria-hidden="true">←</span>
        Back to lookbook
      </button>
      <div className={styles.head}>
        <span className={styles.lookCounter}>
          Look {pad(index + 1)} / {pad(total)}
        </span>
        <h2 className={styles.title}>{product.title}</h2>
      </div>

      {product.description ? (
        <p className={styles.description}>{product.description}</p>
      ) : null}

      <p className={styles.rotation} aria-live="polite">
        <span className={styles.rotationDot} aria-hidden="true" />
        Auto rotating 360°
      </p>

      <p className={styles.hint} aria-live="polite">
        {expanded
          ? "Tap the model to collapse worn items"
          : "Tap the model to expand worn items"}
      </p>

      {items.length > 0 ? (
        <div
          className={`${styles.items} ${expanded ? styles.itemsExpanded : styles.itemsCompact}`}
          data-no-swipe
        >
          {expanded ? (
            <>
              <div className={styles.itemsHead}>
                <span className={styles.itemsEyebrow}>In this look</span>
                <span className={styles.itemsCount}>
                  {pad(items.length)} ITEMS
                </span>
              </div>
              <ul className={styles.cardList}>
                {items.map((item) => {
                  const img = item.featuredImage || item.images[0];
                  const price = item.priceRange.minVariantPrice;
                  return (
                    <li key={item.id} className={styles.card}>
                      <Link
                        href={`/products/${item.handle}`}
                        className={styles.cardLink}
                      >
                        <div className={styles.cardThumb}>
                          {img ? (
                            <Image
                              src={img.url}
                              alt={img.altText ?? item.title}
                              fill
                              sizes="56px"
                              className={styles.cardImage}
                            />
                          ) : null}
                        </div>
                        <div className={styles.cardMeta}>
                          <span className={styles.cardTitle}>{item.title}</span>
                          <span className={styles.cardPrice}>
                            {formatPrice(price.amount, price.currencyCode)}
                          </span>
                        </div>
                        <span className={styles.cardCta}>
                          View
                          <span aria-hidden="true">→</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <ul className={styles.pillList} aria-label="Worn items">
              {items.map((item) => (
                <li key={item.id} className={styles.pill}>
                  <span className={styles.pillDot} aria-hidden="true" />
                  {item.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      
    </div>
  );
}
