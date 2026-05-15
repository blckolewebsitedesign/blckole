"use client";

import { ActionButtons } from "components/tryon/ActionButtons";
import { AvatarGenderSwitch } from "components/tryon/AvatarGenderSwitch";
import { FloatingProductCarousel } from "components/tryon/FloatingProductCarousel";
import { ProductTooltipCard } from "components/tryon/ProductTooltipCard";
import { SkinToneSelector } from "components/tryon/SkinToneSelector";
import { TryOnScene } from "components/tryon/TryOnScene";
import {
  isProductCompatible,
  type TryOnUiProduct,
} from "components/tryon/tryon-products";
import styles from "components/tryon/tryon.module.css";
import { useEffect, useMemo, useRef, useState, type WheelEvent } from "react";
import type { AvatarGender } from "types/tryon";

type Props = {
  topwearProducts: TryOnUiProduct[];
  bottomwearProducts: TryOnUiProduct[];
};

const ROOT_WHEEL_THRESHOLD = 46;
const ROOT_WHEEL_COOLDOWN_MS = 260;

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
  const rootWheelDeltaRef = useRef(0);
  const rootLastWheelSwitchRef = useRef(0);

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
  };

  const handleProductClick = (product: TryOnUiProduct) => {
    const active =
      product.type === "topwear"
        ? selectedTopwear?.id === product.id
        : selectedBottomwear?.id === product.id;

    if (active) {
      setActiveTooltipProduct(null);
      setIsProductAlreadyWorn(false);
      return;
    }

    if (product.type === "topwear") {
      setSelectedTopwear(product);
    } else {
      setSelectedBottomwear(product);
    }

    setActiveTooltipProduct(null);
    setIsProductAlreadyWorn(false);
  };

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

  const cycleProduct = (type: TryOnUiProduct["type"], direction: -1 | 1) => {
    // Infinite circular switching: arrows and wheel gestures both use this
    // function so moving past either end wraps cleanly to the opposite side.
    if (type === "topwear") {
      setSelectedTopwear((current) =>
        getCircularProduct(compatibleTopwear, current, direction),
      );
    } else {
      setSelectedBottomwear((current) =>
        getCircularProduct(compatibleBottomwear, current, direction),
      );
    }

    setActiveTooltipProduct(null);
    setIsProductAlreadyWorn(false);
  };

  const handleExperienceWheel = (event: WheelEvent<HTMLElement>) => {
    event.preventDefault();

    const findWheelZone = (type: TryOnUiProduct["type"]) =>
      event.currentTarget.querySelector<HTMLElement>(
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

    if (!wheelZone) return;

    // Zone-based wheel switching for the central avatar area. The page stays
    // locked, and the vertical pointer zone decides which circular carousel
    // advances when the user scrolls over the character.
    rootWheelDeltaRef.current += event.deltaY;

    const now = window.performance.now();
    if (now - rootLastWheelSwitchRef.current < ROOT_WHEEL_COOLDOWN_MS) return;
    if (Math.abs(rootWheelDeltaRef.current) < ROOT_WHEEL_THRESHOLD) return;

    const direction = rootWheelDeltaRef.current > 0 ? 1 : -1;
    rootWheelDeltaRef.current = 0;
    rootLastWheelSwitchRef.current = now;
    cycleProduct(wheelZone, direction);
  };

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

  return (
    <main
      className={`${styles.experience} relative min-h-[100svh] overflow-hidden`}
      onWheelCapture={handleExperienceWheel}
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
      />

      <FloatingProductCarousel
        title="Bottomwear"
        type="bottomwear"
        products={compatibleBottomwear}
        avatar={selectedAvatarGender}
        selectedProduct={selectedBottomwear}
        onProductClick={handleProductClick}
        onCycle={cycleProduct}
      />

      <ProductTooltipCard
        product={isProductAlreadyWorn ? activeTooltipProduct : null}
      />

      <ActionButtons onReset={resetLook} onShare={() => void shareLook()} />
    </main>
  );
}
