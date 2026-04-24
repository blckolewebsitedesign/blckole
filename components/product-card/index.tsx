"use client";

import { motion, useInView } from "framer-motion";
import type { Product } from "lib/shopify/types";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import styles from "./index.module.css";

type Props = {
  product: Product;
  index: number;
  priority?: boolean;
};

function formatPrice(amount: string, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

export function ProductCard({ product, index, priority = false }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -60px 0px" });

  const num = (index + 1).toString().padStart(2, "0");
  const image = product.featuredImage;
  const price = product.priceRange.minVariantPrice;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.5,
        delay: (index % 4) * 0.06,
        ease: [0.23, 1, 0.32, 1],
      }}
    >
      <Link
        href={`/products/${product.handle}`}
        className={styles.wrapper}
        ref={ref}
      >
        <div className={styles.media}>
          {image ? (
            <Image
              src={image.url}
              alt={image.altText ?? product.title}
              fill
              sizes="(max-width: 900px) 50vw, 25vw"
              className={styles.image}
              priority={priority}
            />
          ) : null}
          <span className={styles.number}>{num}</span>
        </div>
        <div className={styles.info}>
          <span className={styles.title}>{product.title}</span>
          <span className={styles.price}>
            {formatPrice(price.amount, price.currencyCode)}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
