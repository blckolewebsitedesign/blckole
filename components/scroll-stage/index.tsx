"use client";

import { ProductDetailPanel } from "components/product-detail-panel";
import { RotatingFigure } from "components/rotating-figure";
import { AnimatePresence, motion } from "framer-motion";
import type { Product } from "lib/shopify/types";
import { useEffect, useRef, useState } from "react";
import styles from "./index.module.css";

type Props = {
  products: Product[];
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  currentFrame: number;
  onFrameChange: (frame: number) => void;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function ScrollStage({
  products,
  selectedIndex,
  onSelect,
  currentFrame,
  onFrameChange,
}: Props) {
  const total = products.length;
  if (total === 0) return null;

  const isDetail = selectedIndex !== null;

  // Refs for position-aware zoom origin
  const stageRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rowRef = useRef<HTMLDivElement>(null);
  const navCooldown = useRef(false);

  // transformOrigin tracks where in the stage the zoom should emanate from
  const [transformOrigin, setTransformOrigin] = useState("50% 80%");

  // Escape → deselect
  useEffect(() => {
    if (!isDetail) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSelect(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isDetail, onSelect]);

  // Wheel in detail mode → navigate between products (left/right)
  // Row mode: no interception — page scroll works normally to reveal the footer
  useEffect(() => {
    if (!isDetail) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (navCooldown.current) return;
      const delta = e.deltaY || e.deltaX;
      if (Math.abs(delta) < 15) return;
      const dir = delta > 0 ? 1 : -1;
      const next = (selectedIndex ?? 0) + dir;
      if (next >= 0 && next < total) {
        navCooldown.current = true;
        setTransformOrigin(dir > 0 ? "88% 50%" : "12% 50%");
        onSelect(next);
        setTimeout(() => {
          navCooldown.current = false;
        }, 650);
      }
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [isDetail, selectedIndex, total, onSelect]);

  function handleRowSelect(i: number) {
    const slot = slotRefs.current[i];
    const stage = stageRef.current;
    if (slot && stage) {
      const sr = slot.getBoundingClientRect();
      const gr = stage.getBoundingClientRect();
      const cx = ((sr.left + sr.width / 2 - gr.left) / gr.width) * 100;
      const cy = ((sr.top + sr.height / 2 - gr.top) / gr.height) * 100;
      setTransformOrigin(`${Math.round(cx)}% ${Math.round(cy)}%`);
    }
    onSelect(i);
  }

  const selectedProduct =
    selectedIndex !== null ? products[selectedIndex]! : null;
  const prevProduct =
    selectedIndex !== null && selectedIndex > 0
      ? products[selectedIndex - 1]!
      : null;
  const nextProduct =
    selectedIndex !== null && selectedIndex < total - 1
      ? products[selectedIndex + 1]!
      : null;

  return (
    <div ref={stageRef} className={styles.stage} onClick={() => isDetail && onSelect(null)}>
      {/* Title overlay — fades out in detail mode */}
      <AnimatePresence>
        {!isDetail && (
          <motion.div
            className={styles.titleOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <span className={styles.breadcrumb}>
              COLLECTION {pad(1)} / {pad(1)}
            </span>
            <h1 className={styles.collectionTitle}>COLLECTION</h1>
            <div className={styles.productsMeta}>
              <span className={styles.productsLabel}>PRODUCTS</span>
              <span className={styles.productsCount}>{total}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left info panel */}
      <AnimatePresence>
        {isDetail && selectedProduct && (
          <ProductDetailPanel
            key={selectedIndex}
            product={selectedProduct}
            lookIndex={selectedIndex!}
            totalLooks={total}
            currentFrame={currentFrame}
            onFrameChange={onFrameChange}
          />
        )}
      </AnimatePresence>

      {/* Full-screen detail view */}
      <AnimatePresence>
        {isDetail && selectedProduct && (
          <div className={styles.detailView}>
            {/* Main: scale-zooms from the slot's position */}
            <motion.div
              key={selectedIndex}
              className={styles.detailMain}
              style={{ transformOrigin }}
              initial={{ scale: 0.08, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.08, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 240,
                damping: 28,
                mass: 0.9,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <RotatingFigure
                product={selectedProduct}
                externalFrame={currentFrame}
                priority
                onClick={() => onSelect(null)}
              />
            </motion.div>

            {/* Left adjacent peek */}
            {prevProduct && (
              <motion.div
                className={`${styles.detailAdjacent} ${styles.detailLeft}`}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 0.1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                whileHover={{ opacity: 0.25 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
              >
                <RotatingFigure
                  product={prevProduct}
                  onClick={() => {
                    setTransformOrigin("12% 50%");
                    onSelect(selectedIndex! - 1);
                  }}
                />
              </motion.div>
            )}

            {/* Right adjacent peek */}
            {nextProduct && (
              <motion.div
                className={`${styles.detailAdjacent} ${styles.detailRight}`}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 0.1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                whileHover={{ opacity: 0.25 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
              >
                <RotatingFigure
                  product={nextProduct}
                  onClick={() => {
                    setTransformOrigin("88% 50%");
                    onSelect(selectedIndex! + 1);
                  }}
                />
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Figures row — kept in DOM for scroll position */}
      <motion.div
        ref={rowRef}
        className={styles.figuresRow}
        animate={{ opacity: isDetail ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        style={{ pointerEvents: isDetail ? "none" : "auto" }}
      >
        {products.map((product, i) => (
          <div
            key={product.id}
            ref={(el) => {
              slotRefs.current[i] = el;
            }}
            className={styles.figureSlot}
            onClick={(e) => {
              e.stopPropagation();
              handleRowSelect(i);
            }}
          >
            <RotatingFigure
              product={product}
              priority={i < 4}
              onClick={() => {}}
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
