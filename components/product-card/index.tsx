"use client";

import { useDisplayMoney } from "components/currency/use-display-money";
import { motion, useInView } from "framer-motion";
import type { Product } from "lib/shopify/types";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef } from "react";
import styles from "./index.module.css";

type Props = {
  product: Product;
  index: number;
  priority?: boolean;
};

export function ProductCard({ product, index, priority = false }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const searchParams = useSearchParams();
  const formatPrice = useDisplayMoney();
  const inView = useInView(ref, { once: true, margin: "0px 0px -60px 0px" });

  const image = product.featuredImage || product.images[0];
  const price = product.priceRange.minVariantPrice;
  const category = product.productType;
  const currency = searchParams.get("currency");
  const href = currency
    ? `/products/${product.handle}?currency=${encodeURIComponent(currency)}`
    : `/products/${product.handle}`;

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
      <Link href={href} className={styles.wrapper} ref={ref}>
        <div className={styles.frame}>
          <div className={styles.imageArea}>
            {image ? (
              <Image
                src={image.url}
                alt={image.altText ?? product.title}
                fill
                sizes="(max-width: 480px) 100vw, (max-width: 860px) 50vw, (max-width: 1100px) 33vw, 25vw"
                className={styles.image}
                priority={priority}
              />
            ) : null}
          </div>

          <div className={styles.info}>
            {category ? (
              <span className={styles.category}>{category}</span>
            ) : null}
            <div className={styles.titleRow}>
              <span className={styles.title}>{product.title}</span>
              <span className={styles.price}>
                {formatPrice(price.amount, price.currencyCode)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
