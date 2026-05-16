"use client";

import { SKIN_TONES } from "components/tryon/skin-tones";
import styles from "components/tryon/tryon.module.css";
import { useState, type CSSProperties } from "react";
import { useTryOnStore } from "stores/useTryOnStore";

export function SkinToneSelector() {
  const selectedSkinTone = useTryOnStore((state) => state.selectedSkinTone);
  const setSkinTone = useTryOnStore((state) => state.setSkinTone);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className={styles.skinPanel} aria-label="Skin tone">
      <header className={styles.skinHeader} onClick={() => setIsOpen(!isOpen)}>
        <span>Skin tone {isOpen ? '▲' : '▼'}</span>
      </header>
      {isOpen && (
        <div className={styles.skinSwatches}>
        {SKIN_TONES.map((tone) => (
          <button
            key={tone.id}
            type="button"
            className={`${styles.skinSwatch} ${
              selectedSkinTone === tone.id ? styles.skinSwatchActive : ""
            }`}
            style={{ "--swatch": tone.color } as CSSProperties}
            onClick={() => setSkinTone(tone.id)}
            aria-label={tone.label}
            aria-pressed={selectedSkinTone === tone.id}
            title={tone.label}
          />
        ))}
        </div>
      )}
    </section>
  );
}
