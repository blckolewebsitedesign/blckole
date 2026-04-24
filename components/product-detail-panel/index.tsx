"use client";

import type { Product } from "lib/shopify/types";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import styles from "./index.module.css";

type Props = {
  product: Product;
  lookIndex: number;
  totalLooks: number;
  currentFrame: number;
  onFrameChange: (frame: number) => void;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function ProductDetailPanel({
  product,
  lookIndex,
  totalLooks,
  currentFrame,
  onFrameChange,
}: Props) {
  const images = product.images;
  const totalFrames = images.length;
  const hasFilmstrip = totalFrames > 1;
  const degree = hasFilmstrip
    ? Math.round((currentFrame / totalFrames) * 360)
    : 0;

  return (
    <motion.div
      className={styles.panel}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Look counter */}
      <span className={styles.lookCounter}>
        LOOK {pad(lookIndex + 1)} / {pad(totalLooks)}
      </span>

      {/* Product title */}
      <h2 className={styles.title}>{product.title.toUpperCase()}</h2>

      {/* 360° filmstrip — only for image-based products with multiple frames */}
      {hasFilmstrip && (
        <div className={styles.filmstripSection}>
          <span className={styles.degree}>
            {String(degree).padStart(3, "0")}° / 360°
          </span>
          <div className={styles.filmstrip}>
            {images.map((img, i) => (
              <button
                key={i}
                className={`${styles.frame}${i === currentFrame ? ` ${styles.frameCurrent}` : ""}`}
                onClick={() => onFrameChange(i)}
                aria-label={`Frame ${i + 1}`}
              >
                <Image
                  src={img.url}
                  alt={`${product.title} angle ${i + 1}`}
                  fill
                  sizes="30px"
                  className={styles.frameImg}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Product specs from options */}
      {product.options.length > 0 && (
        <dl className={styles.specs}>
          {product.options.map((opt) => (
            <div key={opt.id} className={styles.specRow}>
              <dt className={styles.specName}>{opt.name.toUpperCase()}</dt>
              <dd className={styles.specValue}>{opt.values.join(", ")}</dd>
            </div>
          ))}
        </dl>
      )}
    </motion.div>
  );
}
