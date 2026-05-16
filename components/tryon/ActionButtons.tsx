"use client";

import styles from "components/tryon/tryon.module.css";

type Props = {
  onReset: () => void;
  onShare: () => void;
};

export function ActionButtons({ onReset, onShare }: Props) {
  return (
    <div className={styles.bottomHud}>
      <div className={styles.helperText} aria-hidden="true">
        <span>Drag to rotate</span>
      </div>

      <div className={styles.cornerActions}>
        <button type="button" onClick={onReset}>
          Reset
        </button>
        <button type="button" onClick={onShare}>
          Share
        </button>
      </div>
    </div>
  );
}
