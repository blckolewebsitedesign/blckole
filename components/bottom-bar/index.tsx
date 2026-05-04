"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { Product } from "lib/shopify/types";
import Link from "next/link";
import React, { useRef } from "react";
import styles from "./index.module.css";

gsap.registerPlugin(useGSAP);

type Props = {
  count: number;
  discoverHref?: string;
  selectedProduct?: Product;
  relatedProducts?: Product[];
  isExpanded?: boolean;
  onClose?: () => void;
};

export const BottomBar = React.memo(function BottomBar({
  count,
  discoverHref = "/indexes/products",
  selectedProduct,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (selectedProduct) {
        gsap.to(containerRef.current, {
          y: 0,
          autoAlpha: 1,
          duration: 0.6,
          ease: "expo.out",
          overwrite: "auto",
        });
      } else {
        gsap.to(containerRef.current, {
          y: 100,
          autoAlpha: 0,
          duration: 0.4,
          ease: "power2.in",
          overwrite: "auto",
        });
      }
    },
    { scope: containerRef, dependencies: [selectedProduct] },
  );

  const price = selectedProduct?.priceRange?.minVariantPrice;
  const priceString = price
    ? `${parseInt(price.amount, 10)} ${price.currencyCode}`
    : "";

  return (
    <div ref={containerRef} className={styles.bottomBarWrapper}>
      {selectedProduct && (
        <div className={styles.bottomBar}>
          <div className={styles.leftCol}>
            <span className={styles.productTitle}>{selectedProduct.title}</span>
            <span className={styles.productPrice}>{priceString}</span>
          </div>

          <div className={styles.rightCol}>
            <Link
              href={`/products/${selectedProduct.handle}`}
              className={styles.addToBagBtn}
            >
              VIEW DETAILS
            </Link>
          </div>
        </div>
      )}
    </div>
  );
});
