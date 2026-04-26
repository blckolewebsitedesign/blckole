"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { Product } from "lib/shopify/types";
import Image from "next/image";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./index.module.css";

gsap.registerPlugin(useGSAP);

const COLOR_MAP: Record<string, string> = {
  black: "#0a0a0a",
  white: "#ffffff",
  red: "#e63946",
  blue: "#3a86ff",
  green: "#2d6a4f",
  yellow: "#f4d35e",
  orange: "#f4a261",
  purple: "#7b2d8b",
  pink: "#f48fb1",
  grey: "#9e9e9e",
  gray: "#9e9e9e",
  brown: "#795548",
  navy: "#003049",
  beige: "#d7c9aa",
  cream: "#f5f0e8",
  ivory: "#ffffed",
  tan: "#d2b48c",
  silver: "#c0c0c0",
  gold: "#ffd700",
  khaki: "#c3b091",
  olive: "#808000",
  teal: "#008080",
  coral: "#ff6b6b",
  maroon: "#800000",
};

const LIGHT_COLORS = new Set([
  "white",
  "cream",
  "ivory",
  "yellow",
  "beige",
  "silver",
]);

type Props = {
  product: Product;
  lookIndex: number;
  totalLooks: number;
  currentFrame: number;
  onFrameChange: (frame: number) => void;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function ProductDetailPanel({
  product,
  lookIndex,
  totalLooks,
  currentFrame,
  onFrameChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const images = product.images;
  const filmstripImage = images.length > 0 ? images[images.length - 1] : null;

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >(() => {
    const init: Record<string, string> = {};
    product.options.forEach((opt) => {
      if (opt.values.length > 0) init[opt.id] = opt.values[0]!;
    });
    return init;
  });

  useGSAP(
    () => {
      const isMobile = window.innerWidth <= 768;
      gsap.fromTo(
        containerRef.current,
        { 
          opacity: 0, 
          x: isMobile ? 0 : -20,
          y: isMobile ? 20 : 0 
        },
        { 
          opacity: 1, 
          x: 0, 
          y: 0,
          duration: 0.6, 
          ease: "power3.out" 
        }
      );
    },
    { scope: containerRef, dependencies: [product.id] }
  );

  function selectOption(optId: string, val: string) {
    setSelectedOptions((prev) => ({ ...prev, [optId]: val }));
  }

  return (
    <>
      <div
        ref={containerRef}
        className={styles.panel}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <span className={styles.lookCounter}>
            LOOK {pad(lookIndex + 1)} / {pad(totalLooks)}
          </span>
          <h2 className={styles.title}>{product.title.toUpperCase()}</h2>
        </div>

        {filmstripImage && (
          <div className={styles.filmstripSection}>
            <span className={styles.filmstripLabel}>
              {Math.round((currentFrame / 35) * 360)}° / 360°
            </span>
            <div 
              className={styles.filmstripTrack}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                const percentage = x / rect.width;
                const frame = Math.floor(percentage * 36);
                onFrameChange(Math.max(0, Math.min(35, frame)));
              }}
              onMouseLeave={() => onFrameChange(0)}
            >
              <img
                src={filmstripImage.url}
                alt={`${product.title} filmstrip`}
                className={styles.filmstripRawImg}
              />
              <div
                className={styles.filmstripHighlight}
                style={{
                  width: `${100 / 36}%`,
                  transform: `translateX(${currentFrame * 100}%)`,
                }}
              />
            </div>
          </div>
        )}

        {product.options.length > 0 && (
          <div className={styles.optionsSection}>
            {product.options.map((opt) => {
              const isColor = /colou?r/i.test(opt.name);
              return (
                <div key={opt.id} className={styles.optionGroup}>
                  <span className={styles.optionLabel}>
                    {opt.name.toUpperCase()}
                  </span>
                  <div className={styles.optionValues}>
                    {opt.values.map((val) => {
                      const isActive = selectedOptions[opt.id] === val;
                      if (isColor) {
                        const lower = val.toLowerCase();
                        const hex = COLOR_MAP[lower];
                        const isLight = LIGHT_COLORS.has(lower);
                        return (
                          <button
                            key={val}
                            className={`${styles.swatch}${isLight ? ` ${styles.swatchLight}` : ""}${isActive ? ` ${styles.swatchActive}` : ""}`}
                            style={{ background: hex ?? lower }}
                            title={val}
                            onClick={() => selectOption(opt.id, val)}
                            aria-label={val}
                          />
                        );
                      }
                      return (
                        <button
                          key={val}
                          className={`${styles.sizeChip}${isActive ? ` ${styles.sizeChipActive}` : ""}`}
                          onClick={() => selectOption(opt.id, val)}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {lightboxSrc &&
        typeof window !== "undefined" &&
        createPortal(
          <div className={styles.lightbox} onClick={() => setLightboxSrc(null)}>
            <div
              className={styles.lightboxInner}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles.lightboxClose}
                onClick={() => setLightboxSrc(null)}
                aria-label="Close"
              >
                ✕
              </button>
              <div className={styles.lightboxImageWrap}>
                <Image
                  src={lightboxSrc}
                  alt={product.title}
                  fill
                  sizes="90vw"
                  className={styles.lightboxImage}
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
