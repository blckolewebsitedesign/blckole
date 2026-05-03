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
  if (currencyCode === "INR") return `₹${n.toLocaleString("en-IN")}`;
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

function category(p: Product): string {
  const tag = p.tags?.find((t) => t.startsWith("category:"));
  if (tag) return tag.slice("category:".length).toUpperCase();
  // fallback to product type/first tag if available
  return (p.tags?.[0] || "PIECE").toUpperCase();
}

export function RestockingCollection({
  products,
  shopHref = "/indexes/products",
}: Props) {
  const items = useMemo(
    () => products.filter((p) => p.availableForSale).slice(0, 6),
    [products],
  );
  if (items.length === 0) return null;
  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <div>
          <span className={styles.eyebrow}>Featured</span>
          <h2 className={styles.title}>Pieces we keep restocking</h2>
          <p className={styles.sub}>
            Same flow as any store: browse → open product → choose size → add to
            bag → checkout when your gateway is live.
          </p>
        </div>
        <Link href={shopHref} className={styles.cta}>
          View all in shop →
        </Link>
      </div>

      <div className={styles.grid}>
        {items.map((p, i) => {
          const price = p.priceRange?.minVariantPrice;
          const img = p.featuredImage;
          return (
            <Link
              key={p.id}
              href={`/products/${p.handle}`}
              className={styles.card}
            >
              <div className={styles.imgWrap}>
                {i === 0 && <span className={styles.badge}>JUST IN</span>}
                {img?.url && (
                  <Image
                    src={img.url}
                    alt={img.altText || p.title}
                    width={img.width || 800}
                    height={img.height || 1000}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className={styles.img}
                  />
                )}
              </div>
              <div className={styles.cat}>{category(p)}</div>
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
