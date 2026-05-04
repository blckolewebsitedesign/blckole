"use client";

import { RotatingFigure } from "components/rotating-figure";
import type { Product, ProductMedia } from "lib/shopify/types";
import { preloadVideos } from "lib/video-preload";
import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./index.module.css";

type VideoMedia = Extract<ProductMedia, { mediaContentType: "VIDEO" }>;

type Props = {
  products: Product[];
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  onModelClick?: () => void;
};

export const ScrollStage = React.memo(function ScrollStage({
  products,
  selectedIndex,
  onSelect,
  onModelClick,
}: Props) {
  const total = products.length;

  const activeIndex = selectedIndex !== null ? selectedIndex : 0;
  const activeProduct = products[activeIndex];

  // Stable callback so RotatingFigure's memoization (which compares onClick
  // by reference) doesn't bail every render. Without this, every parent
  // tick gives RotatingFigure a brand-new function ref → re-render →
  // possible cascading effects in ChromaKeyCanvas.
  const handleModelClick = useCallback(() => {
    onModelClick?.();
  }, [onModelClick]);

  // Preload videos for active and neighbours so swaps are instant.
  useEffect(() => {
    if (total === 0) return;
    const videoUrls: string[] = [];
    for (const p of products) {
      const raw = p.media?.find((m) => m.mediaContentType === "VIDEO");
      const video = raw as VideoMedia | undefined;
      if (!video?.sources?.length) continue;
      const src =
        video.sources.find((s) => s.mimeType === "video/mp4") ??
        video.sources[0];
      if (src?.url) videoUrls.push(src.url);
    }
    if (videoUrls.length === 0) return;
    void preloadVideos(videoUrls, {
      concurrency: 2,
      priorityIndex: activeIndex,
    });
  }, [products, activeIndex, total]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSelect(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSelect]);

  // ── Two-layer crossfade for the main character ──
  // Keeps the previous character on screen while the new one's
  // ChromaKeyCanvas mounts/decodes underneath, then fades between them.
  // No more wrapper-level remount → no blank flash.
  const [characterLayers, setCharacterLayers] = useState<Product[]>(() =>
    activeProduct ? [activeProduct] : [],
  );
  const prevActiveIdRef = useRef<string | null>(activeProduct?.id ?? null);

  useEffect(() => {
    if (!activeProduct) return;
    if (prevActiveIdRef.current === activeProduct.id) return;
    prevActiveIdRef.current = activeProduct.id;
    setCharacterLayers((cur) => {
      const last = cur[cur.length - 1];
      if (last && last.id === activeProduct.id) return cur;
      // Keep at most the previous layer + the new one
      return [...cur.slice(-1), activeProduct];
    });
    const t = setTimeout(() => {
      setCharacterLayers((cur) => cur.slice(-1));
    }, 1200);
    return () => clearTimeout(t);
  }, [activeProduct]);

  if (total === 0 || !activeProduct) return null;

  return (
    <div className={styles.stage}>
      {/* ── 40% Left Panel ── */}
      <div className={styles.leftPanel}>
        <div className={styles.textContent}>
          <h1 className={styles.heroHeadline}>
            Wear what pulls
            <br />
            you back.
          </h1>
          <p className={styles.heroBody}>
            Denim and layers built to hold a room without shouting. Pick a
            silhouette to see the two-piece capsule — then head to the shop when
            you are ready to buy.
          </p>
          <div className={styles.heroLinks}>
            <a href="/indexes/products" className={styles.heroLinkBtn}>
              SHOP ALL PIECES
            </a>
            <a href="/story" className={styles.heroLinkBtn}>
              VIEW LOOKBOOK
            </a>
          </div>
          <p className={styles.heroInstruction}>
            OR HOVER A FIGURE BELOW · CLICK TO OPEN THE CAPSULE
          </p>
        </div>
      </div>

      {/* ── 60% Right Panel ── */}
      <div className={styles.rightPanel}>
        <div className={styles.mainCharacterWrapper}>
          <div className={styles.floorGlow} aria-hidden="true" />
          <div className={styles.mainCharacter}>
            {characterLayers.map((p, i, arr) => {
              const isLatest = i === arr.length - 1;
              return (
                <div
                  key={p.id}
                  className={`${styles.charLayer} ${
                    isLatest ? styles.charLayerIn : styles.charLayerOut
                  }`}
                >
                  <RotatingFigure
                    product={p}
                    listenToGlobalFrame={isLatest}
                    priority={true}
                    onClick={handleModelClick}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Bottom Thumbnail List ── */}
      <div className={styles.thumbnailListWrapper}>
        <div className={styles.thumbnailList}>
          {products.map((p, i) => (
            <button
              type="button"
              key={p.id}
              className={`${styles.thumbnailSlot} ${i === activeIndex ? styles.thumbnailSlotActive : ""}`}
              onClick={() => onSelect(i)}
              aria-label={`Select ${p.title}`}
              aria-pressed={i === activeIndex}
            >
              <span className={styles.thumbnailFigure}>
                <RotatingFigure
                  product={p}
                  priority={i < 4}
                  quality="thumb"
                  noLink
                />
              </span>
              <span className={styles.activeBar} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});
