"use client";

import { ChromaKeyCanvas } from "components/chroma-key-canvas";
import type { Product, ProductMedia } from "lib/shopify/types";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { preload } from "react-dom";
import styles from "./index.module.css";

type FrameListener = (frame: number) => void;
const frameListeners = new Set<FrameListener>();

export const subscribeToFrame = (listener: FrameListener) => {
  frameListeners.add(listener);
  return () => {
    frameListeners.delete(listener);
  };
};

export const dispatchFrame = (frame: number) => {
  frameListeners.forEach((l) => l(frame));
};

type Props = {
  product: Product;
  priority?: boolean;
  onClick?: () => void;
  externalFrame?: number;
  listenToGlobalFrame?: boolean;
};

type VideoMedia = Extract<ProductMedia, { mediaContentType: "VIDEO" }>;

const FRAME_MS = 900;

export function RotatingFigure({
  product,
  priority = false,
  onClick,
  externalFrame,
  listenToGlobalFrame,
}: Props) {
  const rawVideo = product.media?.find((m) => m.mediaContentType === "VIDEO");
  const videoMedia = rawVideo as VideoMedia | undefined;

  const images = product.images;
  const [frame, setFrame] = useState(0);
  const [globalFrame, setGlobalFrame] = useState<number | undefined>(undefined);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const displayFrame =
    externalFrame !== undefined
      ? externalFrame
      : listenToGlobalFrame && globalFrame !== undefined
        ? globalFrame
        : frame;

  if (priority && images.length > 0 && images[0]?.url) {
    preload(images[0].url, { as: "image" });
  }

  useEffect(() => {
    if (listenToGlobalFrame) {
      return subscribeToFrame(setGlobalFrame);
    }
  }, [listenToGlobalFrame]);

  useEffect(() => {
    if (
      externalFrame !== undefined ||
      listenToGlobalFrame ||
      videoMedia ||
      images.length <= 1
    )
      return;
    timerRef.current = setInterval(
      () => setFrame((f) => (f + 1) % images.length),
      FRAME_MS,
    );
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [externalFrame, listenToGlobalFrame, videoMedia, images.length]);

  function onMouseEnter() {
    if (
      externalFrame !== undefined ||
      listenToGlobalFrame ||
      videoMedia ||
      images.length <= 1
    )
      return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(
      () => setFrame((f) => (f + 1) % images.length),
      FRAME_MS / 3,
    );
  }

  function onMouseLeave() {
    if (
      externalFrame !== undefined ||
      listenToGlobalFrame ||
      videoMedia ||
      images.length <= 1
    )
      return;
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
          <ChromaKeyCanvas src={currentImage.url} className={styles.media} />
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
        <ChromaKeyCanvas src={currentImage.url} className={styles.media} />
      </div>
    </Link>
  );
}
