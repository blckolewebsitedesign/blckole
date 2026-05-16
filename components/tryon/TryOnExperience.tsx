"use client";

import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { ActionButtons } from "components/tryon/ActionButtons";
import { AvatarGenderSwitch } from "components/tryon/AvatarGenderSwitch";
import { FloatingProductCarousel } from "components/tryon/FloatingProductCarousel";
import { GlobalTryOnLoader } from "components/tryon/GlobalTryOnLoader";
import { ProductTooltipCard } from "components/tryon/ProductTooltipCard";
import { SkinToneSelector } from "components/tryon/SkinToneSelector";
import { TryOnErrorBoundary } from "components/tryon/TryOnErrorBoundary";
import { TryOnScene } from "components/tryon/TryOnScene";
import {
  isProductCompatible,
  resolvePreviewModelUrl,
  resolveWearableModelUrl,
  type TryOnUiProduct,
} from "components/tryon/tryon-products";
import styles from "components/tryon/tryon.module.css";
import { useModelPreload } from "components/tryon/useModelPreload";
import { useTryOnSwitching } from "components/tryon/useTryOnSwitching";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type WheelEvent,
} from "react";
import type { AvatarGender } from "types/tryon";

type Props = {
  topwearProducts: TryOnUiProduct[];
  bottomwearProducts: TryOnUiProduct[];
};

const ROOT_WHEEL_THRESHOLD = 46;
// Minimum delay between wheel-triggered product changes. Matches the
// switching cooldown so the wheel can never out-race the lock.
const ROOT_WHEEL_COOLDOWN_MS = 340;
// How many previews around the current selection we treat as "visible".
// Anything beyond this is a deferred preload, not a priority one.
const VISIBLE_PREVIEW_NEIGHBORS = 2;

function firstCompatibleProduct(
  products: TryOnUiProduct[],
  avatar: AvatarGender,
) {
  return (
    products.find((product) => isProductCompatible(product, avatar)) ?? null
  );
}

function getCircularProduct(
  products: TryOnUiProduct[],
  currentProduct: TryOnUiProduct | null,
  direction: -1 | 1,
) {
  if (products.length === 0) return null;

  const currentIndex = currentProduct
    ? products.findIndex((product) => product.id === currentProduct.id)
    : 0;
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextIndex = (safeIndex + direction + products.length) % products.length;

  return products[nextIndex]!;
}

function neighborsAround(
  products: TryOnUiProduct[],
  selected: TryOnUiProduct | null,
  span: number,
) {
  if (products.length === 0) return [] as TryOnUiProduct[];
  const baseIndex = selected
    ? Math.max(
        0,
        products.findIndex((product) => product.id === selected.id),
      )
    : 0;

  const out: TryOnUiProduct[] = [];
  for (let offset = -span; offset <= span; offset += 1) {
    const idx =
      (((baseIndex + offset) % products.length) + products.length) %
      products.length;
    out.push(products[idx]!);
  }
  return out;
}

export function TryOnExperience({
  topwearProducts,
  bottomwearProducts,
}: Props) {
  const [selectedAvatarGender, setSelectedAvatarGender] =
    useState<AvatarGender>("female");
  const [selectedTopwear, setSelectedTopwear] = useState<TryOnUiProduct | null>(
    () => firstCompatibleProduct(topwearProducts, "female"),
  );
  const [selectedBottomwear, setSelectedBottomwear] =
    useState<TryOnUiProduct | null>(() =>
      firstCompatibleProduct(bottomwearProducts, "female"),
    );
  const [activeTooltipProduct, setActiveTooltipProduct] =
    useState<TryOnUiProduct | null>(null);
  const [isProductAlreadyWorn, setIsProductAlreadyWorn] = useState(false);

  const switching = useTryOnSwitching({ cooldownMs: ROOT_WHEEL_COOLDOWN_MS });
  const rootWheelDeltaRef = useRef(0);
  const rootLastWheelSwitchRef = useRef(0);
  const mainRef = useRef<HTMLElement>(null);

  const compatibleTopwear = useMemo(
    () =>
      topwearProducts.filter((product) =>
        isProductCompatible(product, selectedAvatarGender),
      ),
    [selectedAvatarGender, topwearProducts],
  );
  const compatibleBottomwear = useMemo(
    () =>
      bottomwearProducts.filter((product) =>
        isProductCompatible(product, selectedAvatarGender),
      ),
    [bottomwearProducts, selectedAvatarGender],
  );
  const selectedProducts = useMemo(
    () =>
      [selectedTopwear, selectedBottomwear].filter(Boolean) as TryOnUiProduct[],
    [selectedBottomwear, selectedTopwear],
  );

  // Priority preloads: avatar + currently-worn + visible neighbors.
  // Deferred preloads: the rest of both compatible catalogs, fired in idle.
  const { priorityUrls, deferredUrls } = useMemo(() => {
    const priority = new Set<string>();
    priority.add(`/models/avatar/${selectedAvatarGender}-avatar.glb`);

    if (selectedTopwear) {
      priority.add(
        resolveWearableModelUrl(selectedTopwear, selectedAvatarGender),
      );
      priority.add(
        resolvePreviewModelUrl(selectedTopwear, selectedAvatarGender),
      );
    }
    if (selectedBottomwear) {
      priority.add(
        resolveWearableModelUrl(selectedBottomwear, selectedAvatarGender),
      );
      priority.add(
        resolvePreviewModelUrl(selectedBottomwear, selectedAvatarGender),
      );
    }

    for (const product of neighborsAround(
      compatibleTopwear,
      selectedTopwear,
      VISIBLE_PREVIEW_NEIGHBORS,
    )) {
      priority.add(resolvePreviewModelUrl(product, selectedAvatarGender));
    }
    for (const product of neighborsAround(
      compatibleBottomwear,
      selectedBottomwear,
      VISIBLE_PREVIEW_NEIGHBORS,
    )) {
      priority.add(resolvePreviewModelUrl(product, selectedAvatarGender));
    }

    const deferred = new Set<string>();
    for (const product of compatibleTopwear) {
      deferred.add(resolveWearableModelUrl(product, selectedAvatarGender));
      deferred.add(resolvePreviewModelUrl(product, selectedAvatarGender));
    }
    for (const product of compatibleBottomwear) {
      deferred.add(resolveWearableModelUrl(product, selectedAvatarGender));
      deferred.add(resolvePreviewModelUrl(product, selectedAvatarGender));
    }

    return {
      priorityUrls: Array.from(priority),
      deferredUrls: Array.from(deferred),
    };
  }, [
    compatibleBottomwear,
    compatibleTopwear,
    selectedAvatarGender,
    selectedBottomwear,
    selectedTopwear,
  ]);

  useModelPreload({ priorityUrls, deferredUrls });

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  const handleTopwearReady = useCallback(
    (product: TryOnUiProduct) => {
      switching.finish("topwear", product.id);
    },
    [switching],
  );

  const handleBottomwearReady = useCallback(
    (product: TryOnUiProduct) => {
      switching.finish("bottomwear", product.id);
    },
    [switching],
  );

  useEffect(() => {
    if (
      selectedTopwear &&
      compatibleTopwear.some((product) => product.id === selectedTopwear.id)
    ) {
      return;
    }

    setSelectedTopwear(compatibleTopwear[0] ?? null);
  }, [compatibleTopwear, selectedTopwear]);

  useEffect(() => {
    if (
      selectedBottomwear &&
      compatibleBottomwear.some(
        (product) => product.id === selectedBottomwear.id,
      )
    ) {
      return;
    }

    setSelectedBottomwear(compatibleBottomwear[0] ?? null);
  }, [compatibleBottomwear, selectedBottomwear]);

  const updateAvatarGender = (avatar: AvatarGender) => {
    setSelectedAvatarGender(avatar);
    setActiveTooltipProduct(null);
    setIsProductAlreadyWorn(false);
    switching.reset();
  };

  const handleProductClick = useCallback(
    (product: TryOnUiProduct) => {
      const active =
        product.type === "topwear"
          ? selectedTopwear?.id === product.id
          : selectedBottomwear?.id === product.id;

      if (active) {
        setActiveTooltipProduct(null);
        setIsProductAlreadyWorn(false);
        return;
      }

      if (!switching.tryStart(product.type, product.id)) return;

      if (product.type === "topwear") {
        setSelectedTopwear(product);
      } else {
        setSelectedBottomwear(product);
      }

      setActiveTooltipProduct(null);
      setIsProductAlreadyWorn(false);
    },
    [selectedBottomwear, selectedTopwear, switching],
  );

  const handleWornProductClick = (product: TryOnUiProduct) => {
    const alreadyShowing =
      isProductAlreadyWorn && activeTooltipProduct?.id === product.id;

    setActiveTooltipProduct(alreadyShowing ? null : product);
    setIsProductAlreadyWorn(!alreadyShowing);
  };

  const resetLook = () => {
    setSelectedTopwear(compatibleTopwear[0] ?? null);
    setSelectedBottomwear(compatibleBottomwear[0] ?? null);
    setActiveTooltipProduct(null);
    setIsProductAlreadyWorn(false);
  };

  const cycleProduct = useCallback(
    (type: TryOnUiProduct["type"], direction: -1 | 1) => {
      if (!switching.canSwitch(type)) return;

      const pool =
        type === "topwear" ? compatibleTopwear : compatibleBottomwear;
      const currentSelected =
        type === "topwear" ? selectedTopwear : selectedBottomwear;
      const next = getCircularProduct(pool, currentSelected, direction);
      if (!next || next.id === currentSelected?.id) return;

      if (!switching.tryStart(type, next.id)) return;

      if (type === "topwear") {
        setSelectedTopwear(next);
      } else {
        setSelectedBottomwear(next);
      }

      setActiveTooltipProduct(null);
      setIsProductAlreadyWorn(false);
    },
    [
      compatibleBottomwear,
      compatibleTopwear,
      selectedBottomwear,
      selectedTopwear,
      switching,
    ],
  );

  const handleExperienceWheel = useCallback(
    (event: globalThis.WheelEvent) => {
      const currentTarget = mainRef.current;
      if (!currentTarget) return;

      const findWheelZone = (type: TryOnUiProduct["type"]) =>
        currentTarget.querySelector<HTMLElement>(
          `[data-tryon-wheel-zone="${type}"]`,
        );
      
      const isPointerInsideZone = (element: HTMLElement | null) => {
        if (!element) return false;

        const bounds = element.getBoundingClientRect();
        return (
          event.clientY >= bounds.top - 44 && event.clientY <= bounds.bottom + 44
        );
      };

      const wheelZone: TryOnUiProduct["type"] | null = isPointerInsideZone(
        findWheelZone("topwear"),
      )
        ? "topwear"
        : isPointerInsideZone(findWheelZone("bottomwear"))
          ? "bottomwear"
          : null;

      // Only prevent default INSIDE one of the wheel interaction zones, so the
      // rest of the page (and any future scrollable sections) is untouched.
      if (!wheelZone) return;
      event.preventDefault();

      if (!switching.canSwitch(wheelZone)) {
        rootWheelDeltaRef.current = 0;
        return;
      }

      rootWheelDeltaRef.current += event.deltaY;

      const now = window.performance.now();
      if (now - rootLastWheelSwitchRef.current < ROOT_WHEEL_COOLDOWN_MS) return;
      if (Math.abs(rootWheelDeltaRef.current) < ROOT_WHEEL_THRESHOLD) return;

      const direction = rootWheelDeltaRef.current > 0 ? 1 : -1;
      rootWheelDeltaRef.current = 0;
      rootLastWheelSwitchRef.current = now;
      cycleProduct(wheelZone, direction);
    },
    [cycleProduct, switching],
  );

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    // Attach as non-passive to allow preventDefault
    el.addEventListener("wheel", handleExperienceWheel, {
      passive: false,
      capture: true,
    });
    
    return () => {
      el.removeEventListener("wheel", handleExperienceWheel, {
        capture: true,
      });
    };
  }, [handleExperienceWheel]);

  const shareLook = async () => {
    const text = `BLCKOLE try-on: ${selectedProducts
      .map((product) => product.name)
      .join(", ")}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "BLCKOLE try-on", text });
        return;
      }

      await navigator.clipboard?.writeText(`${text} ${window.location.href}`);
    } catch {
      // User cancellation is expected for native share sheets.
    }
  };

  const isTopwearSwitching = Boolean(switching.pending.topwear);
  const isBottomwearSwitching = Boolean(switching.pending.bottomwear);

  return (
    <TryOnErrorBoundary>
      <GlobalTryOnLoader />
      <main
        ref={mainRef}
        className={`${styles.experience} relative min-h-[100svh] overflow-hidden`}
      >
        <img
          className={styles.stageBackgroundImage}
          src="/tryon-stage-bg.png"
          alt=""
          aria-hidden="true"
        />
        <div className={styles.stageAtmosphere} aria-hidden="true" />

        <div
          className={`${styles.switchLayer} absolute left-0 right-0 flex justify-center`}
        >
          <AvatarGenderSwitch
            value={selectedAvatarGender}
            onChange={updateAvatarGender}
          />
        </div>

        <TryOnScene
          avatar={selectedAvatarGender}
          topwear={selectedTopwear}
          bottomwear={selectedBottomwear}
          onWornProductClick={handleWornProductClick}
          onTopwearReady={handleTopwearReady}
          onBottomwearReady={handleBottomwearReady}
        />

        <SkinToneSelector />

        <FloatingProductCarousel
          title="Topwear"
          type="topwear"
          products={compatibleTopwear}
          avatar={selectedAvatarGender}
          selectedProduct={selectedTopwear}
          onProductClick={handleProductClick}
          onCycle={cycleProduct}
          isSwitching={isTopwearSwitching}
        />

        <FloatingProductCarousel
          title="Bottomwear"
          type="bottomwear"
          products={compatibleBottomwear}
          avatar={selectedAvatarGender}
          selectedProduct={selectedBottomwear}
          onProductClick={handleProductClick}
          onCycle={cycleProduct}
          isSwitching={isBottomwearSwitching}
        />

        <ProductTooltipCard
          product={isProductAlreadyWorn ? activeTooltipProduct : null}
        />

        <ActionButtons onReset={resetLook} onShare={() => void shareLook()} />

        <Canvas
          className="pointer-events-none"
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 100 }}
          eventSource={mainRef}
          dpr={1}
          gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
        >
          <View.Port />
        </Canvas>
      </main>
    </TryOnErrorBoundary>
  );
}
