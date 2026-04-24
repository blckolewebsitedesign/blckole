"use client";

import type { Product, ProductMedia } from "lib/shopify/types";
import Image from "next/image";
import Link from "next/link";
import styles from "./index.module.css";

type Props = {
  product: Product;
  priority?: boolean;
};

type VideoMedia = Extract<ProductMedia, { mediaContentType: "VIDEO" }>;

export function RotatingFigure({ product, priority = false }: Props) {
  const rawVideo = product.media?.find((m) => m.mediaContentType === "VIDEO");
  const videoMedia = rawVideo as VideoMedia | undefined;

  if (videoMedia?.sources?.length) {
    const mp4 =
      videoMedia.sources.find((s) => s.mimeType === "video/mp4") ??
      videoMedia.sources[0];

    if (mp4) {
      return (
        <Link
          href={`/products/${product.handle}`}
          className={styles.wrapper}
          aria-label={product.title}
        >
          <div className={styles.imageWrap}>
            <video
              src={mp4.url}
              autoPlay
              loop
              muted
              playsInline
              className={styles.video}
              poster={videoMedia.previewImage?.url}
            />
          </div>
        </Link>
      );
    }
  }

  const image = product.images[0];
  if (!image) return null;

  return (
    <Link
      href={`/products/${product.handle}`}
      className={styles.wrapper}
      aria-label={product.title}
    >
      <div className={styles.imageWrap}>
        <Image
          src={image.url}
          alt={image.altText ?? product.title}
          fill
          sizes="80vw"
          className={styles.img}
          priority={priority}
        />
      </div>
    </Link>
  );
}
