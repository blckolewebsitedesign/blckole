"use client";

import { useGSAP } from "@gsap/react";
import { ProductDetailPanel } from "components/product-detail-panel";
import { RotatingFigure } from "components/rotating-figure";
import gsap from "gsap";
import type { Product } from "lib/shopify/types";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./index.module.css";

gsap.registerPlugin(useGSAP);

type Props = {
  products: Product[];
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  currentFrame: number;
  onFrameChange: (frame: number) => void;
  onModelClick?: () => void;
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
  onModelClick,
}: Props) {
  const total = products.length;
  if (total === 0) return null;

  const isDetail = selectedIndex !== null;

  const stageRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rowRef = useRef<HTMLDivElement>(null);
  const navCooldown = useRef(false);

  // Refs for GSAP-animated elements
  const titleOverlayRef = useRef<HTMLDivElement>(null);
  const detailViewRef = useRef<HTMLDivElement>(null);
  const detailMainRef = useRef<HTMLDivElement>(null);
  const detailLeftRef = useRef<HTMLDivElement>(null);
  const detailRightRef = useRef<HTMLDivElement>(null);

  const [transformOrigin, setTransformOrigin] = useState("50% 80%");
  const [detailMounted, setDetailMounted] = useState(isDetail);
  const [titleMounted, setTitleMounted] = useState(!isDetail);

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

  // — Circular layout for mobile
  useGSAP(
    () => {
      const updateLayout = () => {
        if (!rowRef.current || window.innerWidth > 768) return;

        const slots = slotRefs.current.filter(Boolean) as HTMLDivElement[];
        const radius = Math.min(window.innerWidth, window.innerHeight) * 0.42;
        const center = { 
          x: window.innerWidth / 2, 
          y: window.innerHeight * 0.45 
        };

        slots.forEach((slot, i) => {
          const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
          const x = center.x + radius * Math.cos(angle) - slot.offsetWidth / 2;
          const y = center.y + radius * Math.sin(angle) - slot.offsetHeight / 2;

          gsap.set(slot, {
            position: "absolute",
            left: x,
            top: y,
            margin: 0,
          });
        });
      };

      updateLayout();
      window.addEventListener("resize", updateLayout);
      return () => window.removeEventListener("resize", updateLayout);
    },
    { scope: stageRef, dependencies: [total, isDetail] }
  );

  // — Escape to deselect
  useEffect(() => {
    if (!isDetail) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSelect(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isDetail, onSelect]);

  // — Wheel to navigate in detail mode
  useEffect(() => {
    if (!isDetail || selectedIndex === null) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (navCooldown.current) return;
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(delta) < 30) return;
      const dir = delta > 0 ? 1 : -1;
      const nextIndex = selectedIndex + dir;
      if (nextIndex >= 0 && nextIndex < total) {
        navCooldown.current = true;
        setTransformOrigin(dir > 0 ? "88% 50%" : "12% 50%");
        onSelect(nextIndex);
        setTimeout(() => { navCooldown.current = false; }, 600);
      }
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [isDetail, selectedIndex, total, onSelect]);

  // — Touch swipe for mobile
  useEffect(() => {
    if (!isDetail || selectedIndex === null) return;
    let touchStartX = 0;
    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0]!.clientX;
      touchStartY = e.touches[0]!.clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (navCooldown.current) return;
      const deltaX = touchStartX - e.changedTouches[0]!.clientX;
      const deltaY = touchStartY - e.changedTouches[0]!.clientY;
      
      if (Math.abs(deltaX) < 60 && Math.abs(deltaY) < 60) return;
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        const dir = deltaX > 0 ? 1 : -1;
        const nextIndex = selectedIndex + dir;
        if (nextIndex >= 0 && nextIndex < total) {
          navCooldown.current = true;
          setTransformOrigin(dir > 0 ? "88% 50%" : "12% 50%");
          onSelect(nextIndex);
          setTimeout(() => { navCooldown.current = false; }, 600);
        }
      }
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isDetail, selectedIndex, total, onSelect]);

  // — Figures row opacity
  useGSAP(
    () => {
      if (!rowRef.current) return;
      gsap.to(rowRef.current, {
        opacity: isDetail ? 0 : 1,
        scale: isDetail ? 0.95 : 1,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: () => {
          if (rowRef.current) {
            rowRef.current.style.pointerEvents = isDetail ? "none" : "auto";
          }
        },
      });
    },
    { scope: stageRef, dependencies: [isDetail] }
  );

  // — Title overlay fade
  useGSAP(
    () => {
      if (!titleOverlayRef.current) return;
      if (!isDetail) {
        setTitleMounted(true);
        gsap.fromTo(
          titleOverlayRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
        );
      } else {
        gsap.to(titleOverlayRef.current, {
          opacity: 0,
          y: -10,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => setTitleMounted(false),
        });
      }
    },
    { scope: stageRef, dependencies: [isDetail] }
  );

  // — Detail view animation (extremely smooth)
  useGSAP(
    () => {
      if (isDetail) {
        setDetailMounted(true);
      }

      if (!detailMainRef.current) return;

      if (isDetail) {
        // Main entrance/transition
        gsap.fromTo(
          detailMainRef.current,
          { scale: 0.95, opacity: 0, transformOrigin },
          {
            scale: 1,
            opacity: 1,
            duration: 0.7,
            ease: "expo.out",
          }
        );

        // Peeks
        [detailLeftRef.current, detailRightRef.current].forEach((el, i) => {
          if (!el) return;
          gsap.fromTo(
            el,
            { opacity: 0, x: i === 0 ? -30 : 30 },
            { opacity: 0.15, x: 0, duration: 0.6, ease: "power3.out", delay: 0.1 }
          );
        });
      } else {
        gsap.to(detailViewRef.current, {
          opacity: 0,
          scale: 1.05,
          duration: 0.4,
          ease: "power2.in",
          onComplete: () => setDetailMounted(false),
        });
      }
    },
    { scope: stageRef, dependencies: [isDetail, selectedIndex, transformOrigin] }
  );

  function handleRowSelect(i: number) {
    if (i === selectedIndex) return;
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

  return (
    <div
      ref={stageRef}
      className={styles.stage}
      onClick={() => isDetail && onSelect(null)}
    >
      {/* Title overlay */}
      {titleMounted && (
        <div ref={titleOverlayRef} className={styles.titleOverlay}>
          <span className={styles.breadcrumb}>
            COLLECTION {pad(1)} / {pad(1)}
          </span>
          <h1 className={styles.collectionTitle}>COLLECTION</h1>
          <div className={styles.productsMeta}>
            <span className={styles.productsLabel}>PRODUCTS</span>
            <span className={styles.productsCount}>{total}</span>
          </div>
        </div>
      )}

      {/* Left info panel */}
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

      {/* Full-screen detail view */}
      {detailMounted && selectedProduct && (
        <div ref={detailViewRef} className={styles.detailView}>
          {/* Top Right Quick Jump bar */}
          <div className={styles.quickJump}>
            <span className={styles.quickJumpCounter}>
              LOOK {pad(selectedIndex! + 1)} / {pad(total)}
            </span>
            <div className={styles.quickJumpThumbs}>
              {prevProduct && (
                <div 
                  className={styles.jumpThumb}
                  onClick={(e) => {
                    e.stopPropagation();
                    setTransformOrigin("12% 50%");
                    onSelect(selectedIndex! - 1);
                  }}
                >
                  <Image src={prevProduct.featuredImage?.url || ""} alt="" fill sizes="20px" style={{ objectFit: "cover" }} />
                </div>
              )}
              <div className={`${styles.jumpThumb} ${styles.jumpThumbActive}`}>
                <Image src={selectedProduct.featuredImage?.url || ""} alt="" fill sizes="20px" style={{ objectFit: "cover" }} />
              </div>
              {nextProduct && (
                <div 
                  className={styles.jumpThumb}
                  onClick={(e) => {
                    e.stopPropagation();
                    setTransformOrigin("88% 50%");
                    onSelect(selectedIndex! + 1);
                  }}
                >
                  <Image src={nextProduct.featuredImage?.url || ""} alt="" fill sizes="20px" style={{ objectFit: "cover" }} />
                </div>
              )}
            </div>
          </div>

          <div
            ref={detailMainRef}
            className={styles.detailMain}
            style={{ transformOrigin }}
          >
            <RotatingFigure
              product={selectedProduct}
              externalFrame={currentFrame}
              priority
              onClick={onModelClick}
            />
          </div>

          {/* Adjacent peeks */}
          {prevProduct && (
            <div
              ref={detailLeftRef}
              className={`${styles.detailAdjacent} ${styles.detailLeft}`}
            >
              <RotatingFigure 
                product={prevProduct} 
                onClick={() => {
                  setTransformOrigin("12% 50%");
                  onSelect(selectedIndex! - 1);
                }} 
              />
            </div>
          )}

          {nextProduct && (
            <div
              ref={detailRightRef}
              className={`${styles.detailAdjacent} ${styles.detailRight}`}
            >
              <RotatingFigure 
                product={nextProduct} 
                onClick={() => {
                  setTransformOrigin("88% 50%");
                  onSelect(selectedIndex! + 1);
                }} 
              />
            </div>
          )}
        </div>
      )}

      {/* Figures row */}
      <div ref={rowRef} className={styles.figuresRow}>
        {products.map((product, i) => (
          <div
            key={product.id}
            ref={(el) => { slotRefs.current[i] = el; }}
            className={styles.figureSlot}
          >
            <RotatingFigure
              product={product}
              priority={i < 4}
              onClick={() => handleRowSelect(i)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
