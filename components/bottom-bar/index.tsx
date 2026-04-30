"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { Product } from "lib/shopify/types";
import Image from "next/image";
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
  relatedProducts,
  isExpanded = false,
  onClose,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Establish initial hidden state so GSAP fully owns visibility (no inline-style conflicts)
      gsap.set(".expanded_panel", { autoAlpha: 0 });

      if (!selectedProduct) return;

      if (isExpanded) {
        gsap.to(".collapsed_group", {
          autoAlpha: 0,
          y: 10,
          duration: 0.3,
          ease: "power2.out",
          overwrite: "auto",
        });
        gsap.fromTo(
          ".expanded_panel",
          { autoAlpha: 0, y: 10 },
          { autoAlpha: 1, y: 0, duration: 0.4, delay: 0.1, ease: "power2.out" },
        );
      } else {
        gsap.to(".expanded_panel", {
          autoAlpha: 0,
          y: 10,
          duration: 0.3,
          ease: "power2.out",
          overwrite: "auto",
        });
        gsap.fromTo(
          ".collapsed_group",
          { autoAlpha: 0, y: 10 },
          { autoAlpha: 1, y: 0, duration: 0.4, delay: 0.1, ease: "power2.out" },
        );
      }
    },
    { scope: containerRef, dependencies: [isExpanded, selectedProduct] },
  );

  const productsToShow = selectedProduct
    ? relatedProducts?.length
      ? relatedProducts
      : [selectedProduct]
    : [];

  return (
    <div ref={containerRef}>
      {/* Global default view (Single chip with product count) */}
      {!selectedProduct && (
        <div className={styles.group}>
          <div className={styles.wrapper}>
            <span className={styles.count}>{count} PRODUCTS</span>
            <Link href={discoverHref} className={styles.discover}>
              DISCOVER
            </Link>
          </div>
        </div>
      )}

      {/* Detail view chips */}
      {selectedProduct && (
        <>
          <div className={`collapsed_group ${styles.group}`}>
            {productsToShow.map((p) => (
              <div key={p.id} className={styles.wrapper}>
                {p.featuredImage && (
                  <div className={styles.productThumb}>
                    <Image
                      src={p.featuredImage.url}
                      alt=""
                      fill
                      sizes="24px"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                )}
                <span className={styles.count}>{p.title.toUpperCase()}</span>
                <Link
                  href={`/products/${p.handle}`}
                  className={styles.discover}
                >
                  VIEW
                </Link>
              </div>
            ))}
          </div>

          <div className={`expanded_panel ${styles.expandedPanel}`}>
            <div className={styles.expandedCards}>
              {productsToShow.map((p) => {
                const price = p.priceRange?.minVariantPrice;
                const priceString = price
                  ? `${parseInt(price.amount, 10)} ${price.currencyCode}`
                  : "";

                return (
                  <div key={p.id} className={styles.productCard}>
                    <div className={styles.cardInfo}>
                      <span className={styles.cardTitle}>
                        {p.title.toUpperCase()}
                      </span>
                      <span className={styles.cardPrice}>{priceString}</span>
                    </div>
                    <Link
                      href={`/products/${p.handle}`}
                      className={styles.cardImageLink}
                    >
                      {p.featuredImage && (
                        <Image
                          src={p.featuredImage.url}
                          alt={p.title}
                          fill
                          sizes="(max-width: 900px) 45vw, 15vw"
                          className={styles.cardImage}
                        />
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
            <div className={styles.expandedFooter}>
              <span className={styles.count}>
                {productsToShow.length} PRODUCTS
              </span>
              <button className={styles.discover} onClick={onClose}>
                CLOSE
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
});
