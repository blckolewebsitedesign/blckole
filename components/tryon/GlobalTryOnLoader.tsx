"use client";

import { useProgress } from "@react-three/drei";
import styles from "components/tryon/tryon.module.css";
import { useEffect, useState } from "react";

/**
 * Single full-screen loader that piggybacks on drei's global `useProgress`
 * so every `useGLTF` (avatar, wearable, preview) contributes to one bar.
 * Stays mounted until the first batch of assets has finished, then unmounts
 * itself — later preloads happen silently in the background.
 */
export function GlobalTryOnLoader() {
  const { progress, active, total, loaded } = useProgress();
  const [firstPaintReady, setFirstPaintReady] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Wait one full cycle: we must see at least one item enter the loader
  // (total > 0) before considering progress=100% as "done", otherwise the
  // very first render — before any GLB has begun fetching — would unmount
  // the overlay instantly.
  useEffect(() => {
    if (total > 0) setFirstPaintReady(true);
  }, [total]);

  useEffect(() => {
    if (!firstPaintReady) return;
    if (active) return;
    if (loaded < total) return;

    const t = window.setTimeout(() => setHidden(true), 320);
    return () => window.clearTimeout(t);
  }, [active, firstPaintReady, loaded, total]);

  if (hidden) return null;

  const display = firstPaintReady ? Math.min(100, Math.round(progress)) : 0;
  const hiding = firstPaintReady && !active && loaded >= total;

  return (
    <div
      className={styles.globalLoader}
      data-hiding={hiding ? "true" : "false"}
      role="status"
      aria-live="polite"
    >
      <div className={styles.globalLoaderInner}>
        <span className={styles.globalLoaderLabel}>Initializing try-on</span>
        <div className={styles.globalLoaderBarTrack}>
          <div
            className={styles.globalLoaderBar}
            style={{ width: `${display}%` }}
          />
        </div>
        <span className={styles.globalLoaderPercent}>{display}%</span>
      </div>
    </div>
  );
}
