"use client";

import type { Product } from "lib/shopify/types";
import Image from "next/image";
import Link from "next/link";
import styles from "./index.module.css";

type Props = {
  recommendations: Product[];
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

export function LookDetail({ recommendations }: Props) {
  const items = recommendations.slice(0, 8);

  return (
    <div
      className={styles.sheet}
      data-no-swipe
      role="region"
      aria-label="Worn items in this look"
    >
      <span className={styles.handle} aria-hidden="true" />

      <div className={styles.inner}>
        {items.length > 0 ? (
          <>
            <div className={styles.head}>
              <span className={styles.eyebrow}>In this look</span>
              <span className={styles.count}>{pad(items.length)} ITEMS</span>
            </div>

            <ul
              className={styles.itemsList}
              data-no-swipe
              aria-label="Worn items"
            >
              {items.map((item) => {
                const img = item.featuredImage || item.images[0];
                const price = item.priceRange.minVariantPrice;
                return (
                  <li key={item.id} className={styles.itemCard}>
                    <Link
                      href={`/products/${item.handle}`}
                      className={styles.itemLink}
                    >
                      <div className={styles.itemThumb}>
                        {img ? (
                          <Image
                            src={img.url}
                            alt={img.altText ?? item.title}
                            fill
                            sizes="180px"
                            className={styles.itemImage}
                          />
                        ) : null}
                      </div>
                      <div className={styles.itemMeta}>
                        <span className={styles.itemTitle}>{item.title}</span>
                        <span className={styles.itemPrice}>
                          {formatPrice(price.amount, price.currencyCode)}
                        </span>
                        <span className={styles.itemCta}>
                          View
                          <span aria-hidden="true">→</span>
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <p className={styles.empty}>
            Configure recommended products in Shopify Search &amp; Discovery to
            populate this look.
          </p>
        )}
      </div>
    </div>
  );
}
