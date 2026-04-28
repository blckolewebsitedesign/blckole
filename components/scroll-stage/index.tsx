"use client";

import { useGSAP } from "@gsap/react";
import { ProductDetailPanel } from "components/product-detail-panel";
import { RotatingFigure } from "components/rotating-figure";
import gsap from "gsap";
import type { Product } from "lib/shopify/types";
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
  const detailSlidesRefs = useRef<(HTMLDivElement | null)[]>([]);
  const firstDetailRenderRef = useRef(true);

  const [transformOrigin, setTransformOrigin] = useState("50% 80%");
  const [detailMounted, setDetailMounted] = useState(isDetail);
  const [titleMounted, setTitleMounted] = useState(!isDetail);
  const [entranceRect, setEntranceRect] = useState<DOMRect | null>(null);

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

  const [mobileGridIndex, setMobileGridIndex] = useState(0);

  useEffect(() => {
    if (selectedIndex !== null) {
      setMobileGridIndex(selectedIndex);
    }
  }, [selectedIndex]);

  // — Mobile Grid Layout (Linear / V-shape)
  const { contextSafe } = useGSAP({ scope: stageRef });

  const updateLayout = contextSafe(() => {
    if (!rowRef.current || window.innerWidth > 768) {
      slotRefs.current.forEach((slot) => {
        // On desktop, we ONLY clear inline styles if the element was previously formatted for mobile (position: absolute).
        // We never clear scale/opacity if in detail view, as it would instantly break the zooming animations.
        if (slot && slot.style.position === "absolute") {
          if (isDetail) {
            gsap.set(slot, { clearProps: "position,left,top,margin" });
          } else {
            gsap.set(slot, { clearProps: "position,left,top,margin,scale,opacity,zIndex" });
          }
        }
      });
      return;
    }

    const slots = slotRefs.current.filter(Boolean) as HTMLDivElement[];
    const drCX = window.innerWidth * 0.5;
    const drCY = window.innerHeight * 0.45;

    slots.forEach((slot, i) => {
      const offset = i - mobileGridIndex;
      
      const x = drCX + offset * (window.innerWidth * 0.35) - slot.offsetWidth / 2;
      const y = drCY - Math.abs(offset) * 15 - slot.offsetHeight / 2;
      
      const scale = Math.max(1 - Math.abs(offset) * 0.15, 0.4);
      const opacity = Math.max(1 - Math.abs(offset) * 0.3, 0);

      if (!isDetail) {
        gsap.to(slot, {
          position: "absolute",
          left: x,
          top: y,
          scale: scale,
          opacity: opacity,
          zIndex: 10 - Math.abs(offset),
          margin: 0,
          duration: 0.5,
          ease: "power2.out",
          overwrite: "auto"
        });
      } else {
        gsap.set(slot, {
          position: "absolute",
          left: x,
          top: y,
          margin: 0,
          zIndex: 10 - Math.abs(offset)
        });
      }
    });
  });

  useGSAP(() => {
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, { scope: stageRef, dependencies: [updateLayout] });

  useEffect(() => {
    updateLayout();
  }, [mobileGridIndex, isDetail, total, updateLayout]);

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
      const delta =
        Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(delta) < 30) return;
      const dir = delta > 0 ? 1 : -1;
      const nextIndex = selectedIndex + dir;
      if (nextIndex >= 0 && nextIndex < total) {
        navCooldown.current = true;
        setTransformOrigin(dir > 0 ? "88% 50%" : "12% 50%");
        onSelect(nextIndex);
        setTimeout(() => {
          navCooldown.current = false;
        }, 600);
      }
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [isDetail, selectedIndex, total, onSelect]);

  // — Touch swipe for mobile
  useEffect(() => {
    if (total <= 1) return;
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
        if (isDetail && selectedIndex !== null) {
          const nextIndex = selectedIndex + dir;
          if (nextIndex >= 0 && nextIndex < total) {
            navCooldown.current = true;
            setTransformOrigin(dir > 0 ? "88% 50%" : "12% 50%");
            onSelect(nextIndex);
            setTimeout(() => { navCooldown.current = false; }, 600);
          }
        } else if (!isDetail && window.innerWidth <= 768) {
          const nextIndex = mobileGridIndex + dir;
          if (nextIndex >= 0 && nextIndex < total) {
            navCooldown.current = true;
            setMobileGridIndex(nextIndex);
            setTimeout(() => { navCooldown.current = false; }, 400);
          }
        }
      }
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isDetail, selectedIndex, total, onSelect, mobileGridIndex]);

  // — Figures row opacity and Flying Thumbnail
  const prevSelectedIndexRef = useRef(selectedIndex);

  useEffect(() => {
    if (selectedIndex !== null) {
      prevSelectedIndexRef.current = selectedIndex;
    }
  }, [selectedIndex]);

  useGSAP(
    () => {
      if (!rowRef.current) return;

      if (isDetail) {
        const lastIndex = selectedIndex;
        slotRefs.current.forEach((slot, i) => {
          if (!slot) return;
          if (i === lastIndex) {
            const isMobile = window.innerWidth <= 768;
            const drWidth = isMobile ? window.innerWidth * 0.9 : window.innerWidth * 0.4;
            const drHeight = window.innerHeight * 0.7; // Detail view height is 70vh
            const drCX = window.innerWidth * 0.5;
            const drCY = isMobile ? window.innerHeight * 0.4 : window.innerHeight * 0.45;
            
            const rect = slot.getBoundingClientRect();
            const srCX = rect.left + rect.width / 2;
            const srCY = rect.top + rect.height / 2;
            
            const targetX = drCX - srCX;
            const targetY = drCY - srCY;
            
            // Replicate object-fit: contain mathematically
            const targetScale = Math.min(drWidth / slot.offsetWidth, drHeight / slot.offsetHeight);

            gsap.set(slot, { transition: "none" });
            gsap.to(slot, {
              x: targetX,
              y: targetY,
              scale: targetScale,
              duration: 0.8,
              ease: "expo.out",
              zIndex: 50,
              onComplete: () => gsap.set(slot, { clearProps: "transition" })
            });
            // Crossfade out at the end when detail WebGL is ready
            gsap.to(slot, { opacity: 0, duration: 0.2, delay: 0.6, ease: "none" });
          } else {
            gsap.set(slot, { transition: "none" });
            gsap.to(slot, { opacity: 0, scale: 0.95, duration: 0.2, ease: "power2.inOut", onComplete: () => gsap.set(slot, { clearProps: "transition" }) });
          }
        });
        rowRef.current.style.pointerEvents = "none";
      } else if (prevSelectedIndexRef.current !== null) {
        const lastIndex = prevSelectedIndexRef.current;
        slotRefs.current.forEach((slot, i) => {
          if (!slot) return;
          gsap.set(slot, { transition: "none" });
          
          if (i === lastIndex) {
            gsap.set(slot, { opacity: 1 });
            gsap.to(slot, { x: 0, y: 0, scale: 1, duration: 0.6, ease: "power3.inOut", zIndex: 1, onComplete: () => gsap.set(slot, { clearProps: "transition" }) });
          } else {
            const isMobile = window.innerWidth <= 768;
            const offset = i - mobileGridIndex;
            const targetScale = isMobile ? Math.max(1 - Math.abs(offset) * 0.15, 0.4) : 1;
            const targetOpacity = isMobile ? Math.max(1 - Math.abs(offset) * 0.3, 0) : 1;
            
            gsap.to(slot, { 
              x: 0, 
              y: 0, 
              opacity: targetOpacity, 
              scale: targetScale, 
              duration: 0.6, 
              ease: "power3.inOut", 
              onComplete: () => gsap.set(slot, { clearProps: "transition" }) 
            });
          }
        });
        rowRef.current.style.pointerEvents = "auto";
      } else if (isDetail && firstDetailRenderRef.current) {
        // Handle direct visit to detail page
        slotRefs.current.forEach((slot) => {
          if (slot) {
             gsap.set(slot, { opacity: 0, scale: 0.95 });
          }
        });
        rowRef.current.style.pointerEvents = "none";
      }
    },
    { scope: stageRef, dependencies: [isDetail] },
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
          { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
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
    { scope: stageRef, dependencies: [isDetail] },
  );

  // — Detail view animation (extremely smooth)
  useGSAP(
    () => {
      if (isDetail && !detailMounted) {
        setDetailMounted(true);
        return;
      }

      if (!detailViewRef.current) return;

      if (!isDetail) {
        gsap.to(detailViewRef.current, {
          opacity: 0,
          duration: 0.15,
          ease: "power2.out",
          onComplete: () => {
            setDetailMounted(false);
            firstDetailRenderRef.current = true;
          },
        });
        return;
      }

      const mm = gsap.matchMedia(stageRef);
      
      mm.add({
        isDesktop: "(min-width: 769px)",
        isMobile: "(max-width: 768px)"
      }, (context) => {
        const { isMobile } = context.conditions as any;
        const offsetVw = isMobile ? 45 : 42.5;
        
        products.forEach((_, i) => {
           const slide = detailSlidesRefs.current[i];
           if (!slide) return;
           
           const isActive = i === selectedIndex;
           const isPrev = i === selectedIndex! - 1;
           const isNext = i === selectedIndex! + 1;
           const isFarPrev = i === selectedIndex! - 2;
           const isFarNext = i === selectedIndex! + 2;
           const isOutPrev = i < selectedIndex! - 2;
           
           let targetX = "0vw";
           let targetOpacity = 0;
           let targetScale = 0.8;
           
           if (isActive) {
             targetX = "0vw";
             targetOpacity = 1;
             targetScale = 1;
           } else if (isPrev) {
             targetX = isMobile ? "-45vw" : "-28vw";
             targetOpacity = isMobile ? 0.1 : 0.25;
             targetScale = 0.8;
           } else if (isNext) {
             targetX = isMobile ? "45vw" : "28vw";
             targetOpacity = isMobile ? 0.1 : 0.25;
             targetScale = 0.8;
           } else if (isFarPrev) {
             targetX = isMobile ? "-80vw" : "-48vw";
             targetOpacity = isMobile ? 0 : 0.08;
             targetScale = 0.6;
           } else if (isFarNext) {
             targetX = isMobile ? "80vw" : "48vw";
             targetOpacity = isMobile ? 0 : 0.08;
             targetScale = 0.6;
           } else if (isOutPrev) {
             targetX = isMobile ? "-100vw" : "-80vw";
             targetOpacity = 0;
             targetScale = 0.5;
           } else {
             targetX = isMobile ? "100vw" : "80vw";
             targetOpacity = 0;
             targetScale = 0.5;
           }
           
           if (firstDetailRenderRef.current) {
             if (isActive) {
               // The flying thumbnail covers the movement. 
               // This slide waits invisibly for WebGL to init, then crossfades in!
               gsap.set(slide, { scale: targetScale, x: targetX, y: 0, opacity: 0 });
               gsap.to(slide, { opacity: targetOpacity, duration: 0.2, delay: 0.6, ease: "none" });
             } else if (isPrev || isNext || isFarPrev || isFarNext) {
               gsap.set(slide, { opacity: 0, x: targetX, scale: targetScale });
               gsap.to(slide, { opacity: targetOpacity, duration: 0.8, ease: "power2.out", delay: 0.4 });
             } else {
               gsap.set(slide, { opacity: 0, x: targetX, scale: targetScale });
             }
           } else {
             gsap.to(slide, {
               x: targetX,
               opacity: targetOpacity,
               scale: targetScale,
               duration: 0.8,
               ease: "power3.inOut",
               overwrite: "auto"
             });
           }
        });
        
        firstDetailRenderRef.current = false;
      });
      
      return () => mm.revert();
    },
    {
      scope: stageRef,
      dependencies: [isDetail, selectedIndex, transformOrigin, detailMounted],
    },
  );

  function handleRowSelect(i: number) {
    if (i === selectedIndex) return;
    const slot = slotRefs.current[i];
    if (slot) {
      setEntranceRect(slot.getBoundingClientRect());
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
                <div className={styles.jumpThumb}>
                  <RotatingFigure
                    product={prevProduct}
                    onClick={() => {
                      setTransformOrigin("12% 50%");
                      onSelect(selectedIndex! - 1);
                    }}
                  />
                </div>
              )}
              <div className={`${styles.jumpThumb} ${styles.jumpThumbActive}`}>
                <RotatingFigure
                  product={selectedProduct}
                  externalFrame={currentFrame}
                />
              </div>
              {nextProduct && (
                <div className={styles.jumpThumb}>
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
          </div>

          {/* Main Stage Track */}
          {products.map((p, i) => {
            const isActive = i === selectedIndex;
            const isPrev = i === selectedIndex! - 1;
            const isNext = i === selectedIndex! + 1;
            const isFarPrev = i === selectedIndex! - 2;
            const isFarNext = i === selectedIndex! + 2;
            const isVisible = isActive || isPrev || isNext || isFarPrev || isFarNext;
            
            return (
              <div 
                key={p.id}
                ref={(el) => {
                  detailSlidesRefs.current[i] = el;
                }}
                className={`${styles.detailSlide} ${isActive ? styles.detailSlideActive : (isVisible ? styles.detailSlideAdjacent : '')}`}
              >
                {isVisible && (
                  <RotatingFigure
                    product={p}
                    externalFrame={isActive ? currentFrame : undefined}
                    priority={isActive}
                    onClick={() => {
                      if (isFarPrev) {
                        onSelect(selectedIndex! - 2);
                      } else if (isPrev) {
                        onSelect(selectedIndex! - 1);
                      } else if (isNext) {
                        onSelect(selectedIndex! + 1);
                      } else if (isFarNext) {
                        onSelect(selectedIndex! + 2);
                      } else if (isActive) {
                        onModelClick?.();
                      }
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Figures row */}
      <div ref={rowRef} className={styles.figuresRow}>
        {products.map((product, i) => (
          <div
            key={product.id}
            ref={(el) => {
              slotRefs.current[i] = el;
            }}
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
