"use client";

import { useGSAP } from "@gsap/react";
import { ProductDetailPanel } from "components/product-detail-panel";
import { RotatingFigure } from "components/rotating-figure";
import { TextShuffle } from "components/text-shuffle";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Product } from "lib/shopify/types";
import React, { useEffect, useRef, useState } from "react";
import styles from "./index.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollToPlugin);

type Props = {
  products: Product[];
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  onModelClick?: () => void;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export const ScrollStage = React.memo(function ScrollStage({
  products,
  selectedIndex,
  onSelect,
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

  const [mobileGridIndex, setMobileGridIndex] = useState(0);

  useEffect(() => {
    if (selectedIndex !== null) {
      setMobileGridIndex(selectedIndex);
    }
  }, [selectedIndex]);

  // — Mobile Grid Layout (Linear / V-shape)
  useGSAP(
    () => {
      const updateLayout = () => {
        const isMobile = window.innerWidth <= 768;

        if (!isMobile) {
          // Desktop: clear all mobile-specific GSAP transforms so flex layout takes over
          slotRefs.current.forEach((slot) => {
            if (!slot) return;
            if (!isDetail) {
              gsap.set(slot, {
                clearProps: "x,y,xPercent,yPercent,scale,zIndex,autoAlpha",
              });
            } else {
              // In detail mode keep x/y/scale for flying-thumbnail; clear mobile centering only
              gsap.set(slot, { xPercent: 0, yPercent: 0 });
            }
          });
          return;
        }

        // Mobile: CSS sets position:absolute; left:50%; top:45%.
        // GSAP offsets each slot from that anchor using x/y transforms only — no layout props.
        const slots = slotRefs.current.filter(Boolean) as HTMLDivElement[];
        slots.forEach((slot, i) => {
          const offset = i - mobileGridIndex;
          const xOffset = offset * (window.innerWidth * 0.35);
          const yOffset = -Math.abs(offset) * 15;
          const scale = Math.max(1 - Math.abs(offset) * 0.15, 0.4);
          const opacity = Math.max(1 - Math.abs(offset) * 0.3, 0);

          if (!isDetail) {
            gsap.to(slot, {
              xPercent: -50,
              yPercent: -50,
              x: xOffset,
              y: yOffset,
              scale,
              autoAlpha: opacity,
              zIndex: 10 - Math.abs(offset),
              duration: 0.5,
              ease: "power2.out",
              overwrite: "auto",
            });
          } else {
            // In detail mode: only update stacking/centering without animation
            gsap.set(slot, {
              xPercent: -50,
              yPercent: -50,
              x: xOffset,
              y: yOffset,
              zIndex: 10 - Math.abs(offset),
            });
          }
        });
      };

      updateLayout();
      window.addEventListener("resize", updateLayout);
      return () => window.removeEventListener("resize", updateLayout);
    },
    { scope: stageRef, dependencies: [total, isDetail, mobileGridIndex] },
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

  // — Stable refs so the ScrollTrigger created below survives renders
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const selectedIndexRef = useRef(selectedIndex);
  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  // Paints every slide from a continuous float rawIndex (0..count-1).
  // Pure transform writes — no React state, no React reads.
  const paintSlides = useRef((rawIndex: number) => {
    const isMobile = window.innerWidth <= 768;
    const spacing = isMobile ? 50 : 35; // vw between adjacent models
    let painted = 0;
    detailSlidesRefs.current.forEach((slide, i) => {
      if (!slide) return;
      painted++;
      const diff = i - rawIndex;
      const abs = Math.abs(diff);
      const scale = Math.max(1 - abs * 0.15, 0.6);

      let opacity = 0;
      if (abs < 0.1) {
        opacity = 1;
      } else if (abs < 1.5) {
        opacity = Math.max(1 - abs * 0.85, 0.15);
        if (abs > 1) {
          opacity = 0.15 - ((abs - 1) * 0.3);
        }
      }
      if (abs >= 1.5) opacity = 0;

      gsap.set(slide, { x: `${diff * spacing}vw`, scale, autoAlpha: Math.max(opacity, 0) });
    });
    return painted;
  }).current;

  // — ScrollTrigger: created when detail mode is entered, killed when exited.
  // Uses a ref guard inside the rAF to prevent double-creation from Strict Mode.
  const stRef = useRef<ScrollTrigger | null>(null);

  useEffect(() => {
    if (!isDetail || !detailMounted) {
      // Leaving detail mode — kill ScrollTrigger
      if (stRef.current) {
        stRef.current.kill();
        stRef.current = null;
      }
      return;
    }

    const proxy = document.getElementById("detail-scroll-proxy");
    if (!proxy) return;
    const count = products.length;
    if (count <= 1) return;

    // Double-rAF ensures DOM is settled and slide refs populated
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        // Guard: skip if already created (handles Strict Mode double-invoke)
        if (stRef.current) return;

        ScrollTrigger.refresh();
        stRef.current = ScrollTrigger.create({
          trigger: proxy,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          snap: {
            snapTo: 1 / (count - 1),
            duration: { min: 0.2, max: 0.5 },
            ease: "power3.out",
            inertia: false,
            delay: 0,
            onComplete: (self) => {
              const idx = Math.round(self.progress * (count - 1));
              if (idx !== selectedIndexRef.current && idx >= 0 && idx < count) {
                onSelectRef.current(idx);
              }
            },
          },
          onUpdate: (self) => {
            paintSlides(self.progress * (count - 1));
          },
        });

        // Initial paint at the current model position
        paintSlides(selectedIndexRef.current ?? 0);
        console.log('[ST] Created. slides:', detailSlidesRefs.current.filter(Boolean).length);
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      // NOTE: we do NOT kill stRef.current here — only kill when isDetail becomes false.
      // This prevents the "kill → recreate" cycle during in-scene re-renders.
    };
  }, [isDetail, detailMounted, products.length, paintSlides]);

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
            onSelect(nextIndex);
            setTimeout(() => {
              navCooldown.current = false;
            }, 350);
          }
        } else if (!isDetail && window.innerWidth <= 768) {
          const nextIndex = mobileGridIndex + dir;
          if (nextIndex >= 0 && nextIndex < total) {
            navCooldown.current = true;
            setMobileGridIndex(nextIndex);
            setTimeout(() => {
              navCooldown.current = false;
            }, 400);
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
  const prevDetailRef = useRef(isDetail);
  const prevSelectedIndexRef = useRef(selectedIndex);
  useGSAP(
    () => {
      if (!rowRef.current) return;

      const justEntered = isDetail && !prevDetailRef.current;
      const justExited = !isDetail && prevDetailRef.current;
      const lastIndex = justExited
        ? prevSelectedIndexRef.current
        : selectedIndex;

      prevDetailRef.current = isDetail;
      if (selectedIndex !== null) {
        prevSelectedIndexRef.current = selectedIndex;
      }

      if (justEntered) {
        slotRefs.current.forEach((slot, i) => {
          if (!slot) return;
          if (i === lastIndex) {
            const isMobile = window.innerWidth <= 768;
            const drWidth = isMobile
              ? window.innerWidth * 0.9
              : window.innerWidth * 0.4;
            const drHeight = window.innerHeight * 0.7;
            const drCX = window.innerWidth * 0.5;
            const drCY = isMobile
              ? window.innerHeight * 0.4
              : window.innerHeight * 0.45;

            const rect = slot.getBoundingClientRect();
            const srCX = rect.left + rect.width / 2;
            const srCY = rect.top + rect.height / 2;

            const currentX = (gsap.getProperty(slot, "x") as number) || 0;
            const currentY = (gsap.getProperty(slot, "y") as number) || 0;
            const targetX = currentX + (drCX - srCX);
            const targetY = currentY + (drCY - srCY);
            const targetScale = Math.min(
              drWidth / slot.offsetWidth,
              drHeight / slot.offsetHeight,
            );

            gsap.to(slot, {
              x: targetX,
              y: targetY,
              scale: targetScale,
              duration: 0.8,
              ease: "expo.out",
              zIndex: 50,
              overwrite: "auto",
            });
            gsap.to(slot, {
              autoAlpha: 0,
              duration: 0.2,
              delay: 0.6,
              ease: "none",
            });
          } else {
            gsap.to(slot, {
              autoAlpha: 0,
              scale: 0.95,
              duration: 0.2,
              ease: "power2.inOut",
              overwrite: "auto",
            });
          }
        });
        rowRef.current.style.pointerEvents = "none";
      } else if (justExited) {
        slotRefs.current.forEach((slot, i) => {
          if (!slot) return;
          const isMobile = window.innerWidth <= 768;
          const offset = i - mobileGridIndex;

          if (i === lastIndex) {
            const gridX = isMobile ? offset * (window.innerWidth * 0.35) : 0;
            const gridY = isMobile ? -Math.abs(offset) * 15 : 0;
            gsap.set(slot, { autoAlpha: 1 });
            gsap.to(slot, {
              x: gridX,
              y: gridY,
              xPercent: isMobile ? -50 : 0,
              yPercent: isMobile ? -50 : 0,
              scale: 1,
              duration: 0.6,
              ease: "power3.inOut",
              zIndex: 1,
              overwrite: "auto",
              onComplete: () => {
                if (!isMobile)
                  gsap.set(slot, {
                    clearProps: "x,y,xPercent,yPercent,scale,zIndex",
                  });
              },
            });
          } else {
            const targetScale = isMobile
              ? Math.max(1 - Math.abs(offset) * 0.15, 0.4)
              : 1;
            const targetOpacity = isMobile
              ? Math.max(1 - Math.abs(offset) * 0.3, 0)
              : 1;
            const gridX = isMobile ? offset * (window.innerWidth * 0.35) : 0;
            const gridY = isMobile ? -Math.abs(offset) * 15 : 0;
            gsap.to(slot, {
              x: gridX,
              y: gridY,
              xPercent: isMobile ? -50 : 0,
              yPercent: isMobile ? -50 : 0,
              autoAlpha: targetOpacity,
              scale: targetScale,
              duration: 0.6,
              ease: "power3.inOut",
              overwrite: "auto",
              onComplete: () => {
                if (!isMobile)
                  gsap.set(slot, {
                    clearProps: "x,y,xPercent,yPercent,scale,zIndex",
                  });
              },
            });
          }
        });
        rowRef.current.style.pointerEvents = "auto";
      } else if (isDetail && firstDetailRenderRef.current) {
        slotRefs.current.forEach((slot) => {
          if (slot) gsap.set(slot, { autoAlpha: 0, scale: 0.95 });
        });
        rowRef.current.style.pointerEvents = "none";
      }
    },
    { scope: stageRef, dependencies: [isDetail, mobileGridIndex] },
  );

  // — Title overlay fade
  useGSAP(
    () => {
      if (!titleOverlayRef.current) return;
      if (!isDetail) {
        setTitleMounted(true);
        gsap.fromTo(
          titleOverlayRef.current,
          { autoAlpha: 0, y: 10 },
          { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" },
        );
      } else {
        gsap.to(titleOverlayRef.current, {
          autoAlpha: 0,
          y: -10,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => setTitleMounted(false),
        });
      }
    },
    { scope: stageRef, dependencies: [isDetail] },
  );

  // — Detail view mount/unmount & entrance positioning
  // paintSlides is the SINGLE source of truth for slide positions.
  // No separate entrance animation that could fight with ScrollTrigger.
  useGSAP(
    () => {
      if (isDetail && !detailMounted) {
        setDetailMounted(true);
        return;
      }

      if (!detailViewRef.current) return;

      if (!isDetail) {
        gsap.to(detailViewRef.current, {
          autoAlpha: 0,
          duration: 0.15,
          ease: "power2.out",
          onComplete: () => {
            setDetailMounted(false);
            firstDetailRenderRef.current = true;
          },
        });
        return;
      }

      // Position slides using paintSlides (single source of truth)
      // so there's no mismatch when ScrollTrigger takes over
      if (!firstDetailRenderRef.current) return;

      // Start all slides hidden, then fade the detail view container in
      const idx = selectedIndex ?? 0;
      paintSlides(idx);

      // Initially hide all slides, then fade them in together
      detailSlidesRefs.current.forEach((slide) => {
        if (slide) gsap.set(slide, { autoAlpha: 0 });
      });

      // Fade in the detail view after the flying thumbnail animation
      gsap.fromTo(
        detailViewRef.current,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: 0.3,
          delay: 0.5,
          ease: "power2.out",
          onComplete: () => {
            // Now paint slides with proper opacity
            paintSlides(idx);
          },
        },
      );

      firstDetailRenderRef.current = false;
    },
    {
      scope: stageRef,
      dependencies: [isDetail, detailMounted],
    },
  );

  function handleRowSelect(i: number) {
    if (i === selectedIndex) return;
    onSelect(i);
  }
  console.log("scroll-stage rendering......");
  return (
    <div
      ref={stageRef}
      className={styles.stage}
      onClick={() => isDetail && onSelect(null)}
    >
      {/* Title overlay — hidden in detail mode */}
      {titleMounted && !isDetail && (
        <div ref={titleOverlayRef} className={styles.titleOverlay}>
          <span className={styles.breadcrumb}>
            COLLECTION {pad(1)} / {pad(1)}
          </span>
          <h1 className={styles.collectionTitle}>
            <TextShuffle text="COLLECTION" triggerOnHover />
          </h1>
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
                    onClick={() => onSelect(selectedIndex! - 1)}
                  />
                </div>
              )}
              <div className={`${styles.jumpThumb} ${styles.jumpThumbActive}`}>
                <RotatingFigure
                  product={selectedProduct}
                  listenToGlobalFrame={true}
                />
              </div>
              {nextProduct && (
                <div className={styles.jumpThumb}>
                  <RotatingFigure
                    product={nextProduct}
                    onClick={() => onSelect(selectedIndex! + 1)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Main Stage Track */}
          {products.map((p, i) => {
            const isActive = i === selectedIndex;
            const isNearby = Math.abs(i - (selectedIndex ?? 0)) <= 2;

            return (
              <div
                key={p.id}
                ref={(el) => {
                  detailSlidesRefs.current[i] = el;
                }}
                className={`${styles.detailSlide} ${isActive ? styles.detailSlideActive : styles.detailSlideAdjacent}`}
              >
                {isNearby && (
                  <RotatingFigure
                    product={p}
                    listenToGlobalFrame={isActive}
                    priority={isActive}
                    onClick={() => {
                      if (isActive) {
                        onModelClick?.();
                      } else {
                        onSelect(i);
                      }
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Figures row — hidden via display:none in detail mode as primary mechanism */}
      <div ref={rowRef} className={styles.figuresRow} style={{ display: isDetail ? 'none' : undefined }}>
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
});
