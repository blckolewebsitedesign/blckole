"use client";

import type { Product } from "lib/shopify/types";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import styles from "./index.module.css";

type Props = {
  products: Product[];
  shopHref?: string;
};

function formatPrice(amount: string, currencyCode: string) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return `${amount} ${currencyCode}`;
  if (currencyCode === "INR") {
    return `₹${n.toLocaleString("en-IN")}`;
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${n.toLocaleString()} ${currencyCode}`;
  }
}

export function StudioSpotlight({
  products,
  shopHref = "/indexes/products",
}: Props) {
  const items = useMemo(
    () => products.filter((p) => p.availableForSale).slice(0, 8),
    [products],
  );
  if (items.length === 0) return null;
  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <div>
          <span className={styles.eyebrow}>Shop</span>
          <h2 className={styles.title}>In the studio now</h2>
          <p className={styles.sub}>
            Tap a piece to pick size and colour — add to bag from the product
            page.
          </p>
        </div>
        <Link href={shopHref} className={styles.cta}>
          Shop entire line →
        </Link>
      </div>
      <div className={styles.grid}>
        {items.map((p) => {
          const price = p.priceRange?.minVariantPrice;
          const img = p.featuredImage;
          return (
            <Link
              key={p.id}
              href={`/products/${p.handle}`}
              className={styles.card}
            >
              <div className={styles.imgWrap}>
                {img?.url && (
                  <Image
                    src={img.url}
                    alt={img.altText || p.title}
                    width={img.width || 600}
                    height={img.height || 800}
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className={styles.img}
                  />
                )}
              </div>
              <div className={styles.meta}>
                <span className={styles.name}>{p.title}</span>
                {price && (
                  <span className={styles.price}>
                    {formatPrice(price.amount, price.currencyCode)}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
