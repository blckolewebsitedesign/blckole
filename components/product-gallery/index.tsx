"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import styles from "./index.module.css";

type ProductImage = {
  url: string;
  altText: string | null;
  width: number;
  height: number;
};

type Props = {
  images: ProductImage[];
  title: string;
};

export function ProductGallery({ images, title }: Props) {
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);

  if (!images.length) return null;

  const [first, ...rest] = images;
  console.log("product gallery rendering......", images.length);

  return (
    <>
      <div className={styles.wrapper}>
        {/* First image — full viewport height */}
        <div className={styles.first} onClick={() => setZoomSrc(first!.url)}>
          <Image
            src={first!.url}
            alt={first!.altText ?? title}
            fill
            priority
            sizes="(max-width: 900px) 100vw, 50vw"
            className={styles.firstImage}
          />
        </div>

        {/* Remaining images in 2-col grid */}
        {rest.length > 0 && (
          <div className={styles.rest}>
            {rest.map((img, i) => (
              <div
                key={i}
                className={styles.thumb}
                onClick={() => setZoomSrc(img.url)}
              >
                <Image
                  src={img.url}
                  alt={img.altText ?? `${title} ${i + 2}`}
                  fill
                  sizes="(max-width: 900px) 100vw, 25vw"
                  className={styles.thumbImage}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {zoomSrc && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setZoomSrc(null)}
          >
            <motion.img
              src={zoomSrc}
              alt={title}
              className={styles.overlayImage}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            />
            <button
              className={styles.closeOverlay}
              onClick={() => setZoomSrc(null)}
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
