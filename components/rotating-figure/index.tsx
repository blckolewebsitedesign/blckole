"use client";

import { ChromaKeyCanvas } from "components/chroma-key-canvas";
import type { Product, ProductMedia } from "lib/shopify/types";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./index.module.css";

type Props = {
  product: Product;
  priority?: boolean;
  onClick?: () => void;
  externalFrame?: number;
};

type VideoMedia = Extract<ProductMedia, { mediaContentType: "VIDEO" }>;

const FRAME_MS = 900;

export function RotatingFigure({
  product,
  priority = false,
  onClick,
  externalFrame,
}: Props) {
  const rawVideo = product.media?.find((m) => m.mediaContentType === "VIDEO");
  const videoMedia = rawVideo as VideoMedia | undefined;

  const images = product.images;
  const [frame, setFrame] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const displayFrame = externalFrame !== undefined ? externalFrame : frame;

  useEffect(() => {
    if (externalFrame !== undefined || videoMedia || images.length <= 1) return;
    timerRef.current = setInterval(
      () => setFrame((f) => (f + 1) % images.length),
      FRAME_MS,
    );
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [externalFrame, videoMedia, images.length]);

  function onMouseEnter() {
    if (externalFrame !== undefined || videoMedia || images.length <= 1) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(
      () => setFrame((f) => (f + 1) % images.length),
      FRAME_MS / 3,
    );
  }

  function onMouseLeave() {
    if (externalFrame !== undefined || videoMedia || images.length <= 1) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(
      () => setFrame((f) => (f + 1) % images.length),
      FRAME_MS,
    );
  }

  // ── Video product ────────────────────────────────────────────────
  if (videoMedia?.sources?.length) {
    const mp4 =
      videoMedia.sources.find((s) => s.mimeType === "video/mp4") ??
      videoMedia.sources[0];

    if (mp4) {
      if (onClick) {
        return (
          <button
            className={styles.wrapper}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            aria-label={product.title}
          >
            <div className={styles.mediaWrap}>
              <ChromaKeyCanvas
                src={mp4.url}
                isVideo={true}
                poster={videoMedia.previewImage?.url}
                className={styles.media}
              />
            </div>
          </button>
        );
      }
      return (
        <Link
          href={`/products/${product.handle}`}
          className={styles.wrapper}
          aria-label={product.title}
        >
          <div className={styles.mediaWrap}>
            <ChromaKeyCanvas
              src={mp4.url}
              isVideo={true}
              poster={videoMedia.previewImage?.url}
              className={styles.media}
            />
          </div>
        </Link>
      );
    }
  }

  // ── Image product ────────────────────────────────────────────────
  const currentImage = images[displayFrame] ?? images[0];
  if (!currentImage) return null;

  if (onClick) {
    return (
      <button
        className={styles.wrapper}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        aria-label={product.title}
      >
        <div className={styles.mediaWrap}>
          {priority && (
            <Image
              src={currentImage.url}
              alt=""
              priority
              fill
              sizes="1px"
              style={{ opacity: 0, pointerEvents: "none", zIndex: -1 }}
            />
          )}
          <ChromaKeyCanvas
            src={currentImage.url}
            className={styles.media}
          />
        </div>
      </button>
    );
  }

  return (
    <Link
      href={`/products/${product.handle}`}
      className={styles.wrapper}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-label={product.title}
    >
      <div className={styles.mediaWrap}>
        {priority && (
          <Image
            src={currentImage.url}
            alt=""
            priority
            fill
            sizes="1px"
            style={{ opacity: 0, pointerEvents: "none", zIndex: -1 }}
          />
        )}
        <ChromaKeyCanvas
          src={currentImage.url}
          className={styles.media}
        />
      </div>
    </Link>
  );
}
