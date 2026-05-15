"use client";

import { Product3DPreview } from "components/tryon/Product3DPreview";
import {
  isProductCompatible,
  resolvePreviewModelUrl,
  type TryOnUiProduct,
  type TryOnUiProductType,
} from "components/tryon/tryon-products";
import styles from "components/tryon/tryon.module.css";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";
import type { AvatarGender } from "types/tryon";

type Props = {
  title: string;
  type: TryOnUiProductType;
  products: TryOnUiProduct[];
  avatar: AvatarGender;
  selectedProduct: TryOnUiProduct | null;
  onProductClick: (product: TryOnUiProduct) => void;
  onCycle: (type: TryOnUiProductType, direction: -1 | 1) => void;
};

function wrapIndex(index: number, length: number) {
  if (length === 0) return 0;
  return ((index % length) + length) % length;
}

function getVisibleSlots(
  products: TryOnUiProduct[],
  selectedProduct: TryOnUiProduct | null,
  type: TryOnUiProductType,
) {
  if (products.length === 0) return [];

  const activeIndex = Math.max(
    0,
    selectedProduct
      ? products.findIndex((product) => product.id === selectedProduct.id)
      : 0,
  );
  const offsets = type === "topwear" ? [0, 1, 2, 3] : [-3, -2, -1, 0];

  return offsets.map((offset, slotIndex) => {
    const product = products[wrapIndex(activeIndex + offset, products.length)]!;
    return {
      product,
      side: slotIndex < 2 ? "left" : "right",
      slotIndex,
      active: product.id === selectedProduct?.id,
    };
  });
}

export function FloatingProductCarousel({
  title,
  type,
  products,
  avatar,
  selectedProduct,
  onProductClick,
  onCycle,
}: Props) {
  const visibleProducts = useMemo(
    () => products.filter((product) => isProductCompatible(product, avatar)),
    [avatar, products],
  );
  const selectedIndex = selectedProduct
    ? visibleProducts.findIndex((product) => product.id === selectedProduct.id)
    : -1;
  const selectedPosition = selectedIndex >= 0 ? selectedIndex + 1 : 0;
  const visibleSlots = useMemo(
    () => getVisibleSlots(visibleProducts, selectedProduct, type),
    [selectedProduct, type, visibleProducts],
  );

  const cycle = (direction: -1 | 1) => {
    if (visibleProducts.length <= 1) return;
    onCycle(type, direction);
  };

  return (
    <section
      className={`${styles.floatingRail} ${
        type === "topwear" ? styles.topwearRail : styles.bottomwearRail
      }`}
      aria-label={title}
      data-tryon-wheel-zone={type}
    >
      <header className={styles.railHudLabel}>
        <h2>{title}</h2>
        <span>
          {selectedPosition} / {visibleProducts.length}
        </span>
      </header>

      <div className={styles.floatingRailTrack}>
        <button
          type="button"
          className={styles.carouselArrow}
          onClick={() => cycle(-1)}
          aria-label={`Previous ${title}`}
        >
          {"<"}
        </button>

        <div className={styles.floatingProductList}>
          <div className={styles.productCluster} data-side="left">
            <AnimatePresence mode="popLayout">
              {visibleSlots
                .filter((slot) => slot.side === "left")
                .map(({ product, active, slotIndex }) => (
                  <motion.button
                    layout
                    key={`${product.id}:left:${slotIndex}`}
                    type="button"
                    className={styles.floatingProduct}
                    data-active={active ? "true" : "false"}
                    data-type={type}
                    onClick={() => onProductClick(product)}
                    aria-pressed={active}
                    initial={{ opacity: 0, y: 10, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.92 }}
                    transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <Product3DPreview
                      modelUrl={resolvePreviewModelUrl(product, avatar)}
                      thumbnail={product.thumbnail}
                      name={product.name}
                      type={type}
                      active={active}
                    />
                    <span className="sr-only">{product.name}</span>
                  </motion.button>
                ))}
            </AnimatePresence>
          </div>

          <div className={styles.productCluster} data-side="right">
            <AnimatePresence mode="popLayout">
              {visibleSlots
                .filter((slot) => slot.side === "right")
                .map(({ product, active, slotIndex }) => (
                  <motion.button
                    layout
                    key={`${product.id}:right:${slotIndex}`}
                    type="button"
                    className={styles.floatingProduct}
                    data-active={active ? "true" : "false"}
                    data-type={type}
                    onClick={() => onProductClick(product)}
                    aria-pressed={active}
                    initial={{ opacity: 0, y: 10, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.92 }}
                    transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <Product3DPreview
                      modelUrl={resolvePreviewModelUrl(product, avatar)}
                      thumbnail={product.thumbnail}
                      name={product.name}
                      type={type}
                      active={active}
                    />
                    <span className="sr-only">{product.name}</span>
                  </motion.button>
                ))}
            </AnimatePresence>
          </div>
        </div>

        <button
          type="button"
          className={styles.carouselArrow}
          onClick={() => cycle(1)}
          aria-label={`Next ${title}`}
        >
          {">"}
        </button>
      </div>
    </section>
  );
}
