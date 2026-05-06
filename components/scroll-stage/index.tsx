"use client";

import { LookInfo } from "components/look-info";
import { RotatingFigure } from "components/rotating-figure";
import type { Product, ProductMedia } from "lib/shopify/types";
import { preloadVideos } from "lib/video-preload";
import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./index.module.css";

type VideoMedia = Extract<ProductMedia, { mediaContentType: "VIDEO" }>;

type Props = {
  products: Product[];
  recommendationsMap?: Record<string, Product[]>;
  currentIndex: number;
  detailOpen: boolean;
  recsOpen: boolean;
  paused?: boolean;
  onSelect: (
    index: number,
    opts?: { open?: boolean; userInitiated?: boolean },
  ) => void;
  onClose: () => void;
  onToggleRecs: () => void;
};

const SWIPE_MIN_DISTANCE = 50;
const SWIPE_MAX_DURATION = 600;

type LayerEntry = { product: Product; dir: 0 | -1 | 1 };

export const ScrollStage = React.memo(function ScrollStage({
  products,
  recommendationsMap,
  currentIndex,
  detailOpen,
  recsOpen,
  paused = false,
  onSelect,
  onClose,
  onToggleRecs,
}: Props) {
  const total = products.length;

  const safeIndex = Math.max(0, Math.min(total - 1, currentIndex));
  const activeProduct = products[safeIndex];
  const activeRecommendations =
    activeProduct && recommendationsMap
      ? (recommendationsMap[activeProduct.id] ?? [])
      : [];

  const indexRef = useRef(safeIndex);
  const totalRef = useRef(total);
  const detailOpenRef = useRef(detailOpen);
  useEffect(() => {
    indexRef.current = safeIndex;
    totalRef.current = total;
    detailOpenRef.current = detailOpen;
  }, [safeIndex, total, detailOpen]);

  // Click on the model:
  //  - Browse mode: enter detail (info on left, recs sheet up).
  //  - Detail mode: toggle the recs sheet open/closed.
  const handleModelClick = useCallback(() => {
    if (detailOpenRef.current) {
      onToggleRecs();
    } else {
      onSelect(indexRef.current, { open: true, userInitiated: true });
    }
  }, [onSelect, onToggleRecs]);

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
      priorityIndex: safeIndex,
    });
  }, [products, safeIndex, total]);

  // Esc closes the detail mode entirely.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && detailOpen) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, detailOpen]);

  // Swipe navigation (pointer-based, both modes).
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let tracking = false;

    const onDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-no-swipe]")) return;
      tracking = true;
      startX = e.clientX;
      startY = e.clientY;
      startTime = Date.now();
    };

    const onUp = (e: PointerEvent) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const dt = Date.now() - startTime;
      if (dt > SWIPE_MAX_DURATION) return;
      if (Math.abs(dx) < SWIPE_MIN_DISTANCE) return;
      if (Math.abs(dy) > Math.abs(dx)) return;

      const t = totalRef.current;
      if (t === 0) return;
      const dir = dx > 0 ? -1 : 1;
      const next = (indexRef.current + dir + t) % t;
      onSelect(next, { open: false, userInitiated: true });
    };

    const onCancel = () => {
      tracking = false;
    };

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [onSelect]);

  // Wheel navigation in detail mode only. Uses a velocity accumulator
  // so trackpad momentum bursts feel natural — small deltas pile up
  // until they cross a threshold (one switch), then the accumulator
  // empties. A short reset gap (~180ms) treats lulls as a new intent.
  // A switch lock just shorter than the slide animation prevents
  // overlapping transitions while still allowing chained scrolls.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const SWITCH_THRESHOLD = 90;
    const RESET_GAP_MS = 180;
    const SWITCH_LOCK_MS = 380;
    let accumulator = 0;
    let lastWheelAt = 0;
    let switchLockUntil = 0;

    const onWheel = (e: WheelEvent) => {
      if (!detailOpenRef.current) return;
      const target = e.target as HTMLElement | null;
      // Allow native scroll inside the LookInfo content (cards / pills).
      if (target?.closest("[data-no-swipe]")) return;

      const dx = e.deltaX;
      const dy = e.deltaY;
      const dominant = Math.abs(dy) > Math.abs(dx) ? dy : dx;
      if (Math.abs(dominant) < 1) return;

      e.preventDefault();

      const now = Date.now();
      if (now - lastWheelAt > RESET_GAP_MS) {
        accumulator = 0;
      }
      lastWheelAt = now;
      accumulator += dominant;

      if (now < switchLockUntil) return;
      if (Math.abs(accumulator) < SWITCH_THRESHOLD) return;

      switchLockUntil = now + SWITCH_LOCK_MS;
      const dir = accumulator > 0 ? 1 : -1;
      accumulator = 0;

      const t = totalRef.current;
      if (t === 0) return;
      const next = (indexRef.current + dir + t) % t;
      onSelect(next, { open: false, userInitiated: true });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
    };
  }, [onSelect]);

  // ── Two-layer slide for the main character ──
  const [characterLayers, setCharacterLayers] = useState<LayerEntry[]>(() =>
    activeProduct ? [{ product: activeProduct, dir: 0 }] : [],
  );
  const prevActiveIdRef = useRef<string | null>(activeProduct?.id ?? null);
  const prevIndexRef = useRef<number>(safeIndex);

  useEffect(() => {
    if (!activeProduct) return;
    if (prevActiveIdRef.current === activeProduct.id) return;

    const prevIdx = prevIndexRef.current;
    let dir: 1 | -1 = 1;
    if (total > 0) {
      const forward = (safeIndex - prevIdx + total) % total;
      const backward = (prevIdx - safeIndex + total) % total;
      dir = forward <= backward ? 1 : -1;
    }
    prevActiveIdRef.current = activeProduct.id;
    prevIndexRef.current = safeIndex;

    setCharacterLayers((cur) => {
      const last = cur[cur.length - 1];
      if (last && last.product.id === activeProduct.id) return cur;
      return [...cur.slice(-1), { product: activeProduct, dir }];
    });
    const t = setTimeout(() => {
      setCharacterLayers((cur) => cur.slice(-1));
    }, 550);
    return () => clearTimeout(t);
  }, [activeProduct, safeIndex, total]);

  if (total === 0 || !activeProduct) return null;

  return (
    <div
      ref={stageRef}
      className={styles.stage}
      data-detail-open={detailOpen ? "true" : "false"}
      data-recs-open={recsOpen ? "true" : "false"}
    >
      {/* ── 40% Left Panel ── */}
      <div className={styles.leftPanel}>
        {detailOpen ? (
          <LookInfo
            key={activeProduct.id}
            product={activeProduct}
            index={safeIndex}
            total={total}
            recommendations={activeRecommendations}
            expanded={recsOpen}
            onClose={onClose}
          />
        ) : (
          <div className={styles.textContent}>
            <h1 className={styles.heroHeadline}>Wear what pulls you back.</h1>
            <p className={styles.heroBody}>
              Denim and layers built to hold a room without shouting. Pick a
              silhouette to see the two-piece capsule — then head to the shop
              when you are ready to buy.
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
        )}
      </div>

      {/* ── 60% Right Panel (character) ── */}
      <div className={styles.rightPanel}>
        <div className={styles.mainCharacterWrapper}>
          <div className={styles.floorGlow} aria-hidden="true" />
          <div className={styles.mainCharacter}>
            {characterLayers.map((entry, i, arr) => {
              const isLatest = i === arr.length - 1;
              const cls = isLatest
                ? entry.dir === -1
                  ? styles.charLayerInLeft
                  : entry.dir === 1
                    ? styles.charLayerInRight
                    : styles.charLayerInitial
                : entry.dir === -1
                  ? styles.charLayerOutRight
                  : styles.charLayerOutLeft;
              return (
                <div
                  key={entry.product.id}
                  className={`${styles.charLayer} ${cls}`}
                >
                  <RotatingFigure
                    product={entry.product}
                    listenToGlobalFrame={isLatest}
                    priority={true}
                    paused={paused}
                    onClick={isLatest ? handleModelClick : undefined}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Bottom thumbnail strip (hidden when recs sheet is up) ── */}
      <div className={styles.thumbnailListWrapper}>
        <div className={styles.thumbnailList}>
          {products.map((p, i) => (
            <button
              type="button"
              key={p.id}
              className={`${styles.thumbnailSlot} ${i === safeIndex ? styles.thumbnailSlotActive : ""}`}
              onClick={() => onSelect(i, { open: false, userInitiated: true })}
              aria-label={`Select ${p.title}`}
              aria-pressed={i === safeIndex}
            >
              <span className={styles.thumbnailFigure}>
                <RotatingFigure
                  product={p}
                  priority={i < 4}
                  quality="thumb"
                  paused={paused}
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
