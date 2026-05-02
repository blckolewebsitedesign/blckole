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

type Quality = "high" | "thumb";

type Props = {
  product: Product;
  priority?: boolean;
  onClick?: () => void;
  externalFrame?: number;
  listenToGlobalFrame?: boolean;
  noWebGL?: boolean;
  paused?: boolean;
  quality?: Quality;
  /** When true, render only the visual (no Link/button wrapper). For embedding inside another interactive element. */
  noLink?: boolean;
};

type VideoMedia = Extract<ProductMedia, { mediaContentType: "VIDEO" }>;

const FRAME_MS = 900;

export function RotatingFigure({
  product,
  priority = false,
  onClick,
  externalFrame,
  listenToGlobalFrame,
  noWebGL,
  paused,
  quality = "high",
  noLink,
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
      paused ||
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
  }, [paused, externalFrame, listenToGlobalFrame, videoMedia, images.length]);

  function onMouseEnter() {
    if (
      paused ||
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
      paused ||
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

  // ── Pick the media node (video or current image) ──────────────────
  const mp4 = videoMedia?.sources?.length
    ? (videoMedia.sources.find((s) => s.mimeType === "video/mp4") ??
      videoMedia.sources[0])
    : null;

  let mediaNode: React.ReactNode = null;
  if (mp4) {
    mediaNode = noWebGL ? (
      <video
        src={mp4.url}
        className={styles.media}
        autoPlay={!paused}
        loop
        muted
        playsInline
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "bottom center",
        }}
      />
    ) : (
      <ChromaKeyCanvas
        src={mp4.url}
        isVideo={true}
        poster={videoMedia?.previewImage?.url}
        className={styles.media}
        paused={paused}
        quality={quality}
      />
    );
  } else {
    const currentImage = images[displayFrame] ?? images[0];
    if (!currentImage) return null;
    mediaNode = noWebGL ? (
      <img
        src={currentImage.url}
        alt=""
        className={styles.media}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "bottom center",
        }}
      />
    ) : (
      <ChromaKeyCanvas
        src={currentImage.url}
        className={styles.media}
        paused={paused}
        quality={quality}
      />
    );
  }

  // ── Visual-only (no wrapping link/button) ─────────────────────────
  if (noLink) {
    return (
      <span
        className={styles.wrapper}
        onMouseEnter={mp4 ? undefined : onMouseEnter}
        onMouseLeave={mp4 ? undefined : onMouseLeave}
      >
        <span className={styles.mediaWrap}>{mediaNode}</span>
      </span>
    );
  }

  // ── Button (onClick provided) ─────────────────────────────────────
  if (onClick) {
    return (
      <button
        type="button"
        className={styles.wrapper}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onMouseEnter={mp4 ? undefined : onMouseEnter}
        onMouseLeave={mp4 ? undefined : onMouseLeave}
        aria-label={product.title}
      >
        <div className={styles.mediaWrap}>{mediaNode}</div>
      </button>
    );
  }

  // ── Link (default) ────────────────────────────────────────────────
  return (
    <Link
      href={`/products/${product.handle}`}
      className={styles.wrapper}
      onMouseEnter={mp4 ? undefined : onMouseEnter}
      onMouseLeave={mp4 ? undefined : onMouseLeave}
      aria-label={product.title}
    >
      <div className={styles.mediaWrap}>{mediaNode}</div>
    </Link>
  );
}
