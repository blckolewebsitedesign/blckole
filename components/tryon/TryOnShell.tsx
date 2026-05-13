"use client";

import { AvatarSelector } from "components/tryon/AvatarSelector";
import { LookSummary } from "components/tryon/LookSummary";
import { ProductRail } from "components/tryon/ProductRail";
import styles from "components/tryon/tryon.module.css";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useTryOnStore } from "stores/useTryOnStore";
import type { TryOnProduct, WearableCategory } from "types/tryon";

const ExperienceCanvas = dynamic(
  () =>
    import("components/tryon/ExperienceCanvas").then(
      (mod) => mod.ExperienceCanvas,
    ),
  {
    ssr: false,
    loading: () => (
      <div className={styles.canvasFallback}>Preparing fitting room</div>
    ),
  },
);

type Props = {
  products: TryOnProduct[];
};

const MOBILE_TABS: { category: WearableCategory; label: string }[] = [
  { category: "top", label: "Tops" },
  { category: "bottom", label: "Bottoms" },
  { category: "shoes", label: "Shoes" },
  { category: "accessory", label: "Accessories" },
];

function byCategory(products: TryOnProduct[], category: WearableCategory) {
  return products.filter((product) => product.category === category);
}

export function TryOnShell({ products }: Props) {
  const [mobileCategory, setMobileCategory] = useState<WearableCategory>("top");
  const [isMobile, setIsMobile] = useState(false);
  const selectedAvatar = useTryOnStore((state) => state.selectedAvatar);
  const selectedTop = useTryOnStore((state) => state.selectedTop);
  const selectedBottom = useTryOnStore((state) => state.selectedBottom);
  const selectedShoes = useTryOnStore((state) => state.selectedShoes);
  const selectedAccessories = useTryOnStore(
    (state) => state.selectedAccessories,
  );
  const pendingProduct = useTryOnStore((state) => state.pendingProduct);

  const compatibleProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.compatibleAvatar === "unisex" ||
          product.compatibleAvatar === selectedAvatar,
      ),
    [products, selectedAvatar],
  );

  const tops = useMemo(
    () => byCategory(compatibleProducts, "top"),
    [compatibleProducts],
  );
  const bottoms = useMemo(
    () => byCategory(compatibleProducts, "bottom"),
    [compatibleProducts],
  );
  const shoes = useMemo(
    () => byCategory(compatibleProducts, "shoes"),
    [compatibleProducts],
  );
  const accessories = useMemo(
    () => byCategory(compatibleProducts, "accessory"),
    [compatibleProducts],
  );

  const selectedProductIds = [
    selectedTop?.id,
    selectedBottom?.id,
    selectedShoes?.id,
    ...selectedAccessories.map((product) => product.id),
  ].filter(Boolean) as string[];

  const mobileProducts = byCategory(compatibleProducts, mobileCategory);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Virtual styling</p>
        <h1 className={styles.headline}>Try the pull</h1>
        <p className={styles.dek}>
          Build a look on the avatar with Shopify-hosted 3D garments.
        </p>
      </header>

      <div className={styles.toolbar}>
        <AvatarSelector />
      </div>

      {isMobile ? (
        <section className={styles.mobileLayout}>
          <ExperienceCanvas products={compatibleProducts} />

          <div className={styles.mobileTabs} role="tablist">
            {MOBILE_TABS.map((tab) => (
              <button
                key={tab.category}
                type="button"
                role="tab"
                aria-selected={mobileCategory === tab.category}
                className={`${styles.mobileTab} ${
                  mobileCategory === tab.category ? styles.mobileTabActive : ""
                }`}
                onClick={() => setMobileCategory(tab.category)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <ProductRail
            title={
              MOBILE_TABS.find((tab) => tab.category === mobileCategory)
                ?.label ?? "Products"
            }
            category={mobileCategory}
            products={mobileProducts}
            selectedProductIds={selectedProductIds}
          />
        </section>
      ) : (
        <section className={styles.desktopLayout}>
          <ProductRail
            title="Topwear"
            category="top"
            products={tops}
            selectedProductIds={selectedProductIds}
          />

          <div className={styles.stageColumn}>
            <ExperienceCanvas products={compatibleProducts} />
            {compatibleProducts.length === 0 ? (
              <div className={styles.stageNotice}>
                <h2>No try-on products found</h2>
                <p>
                  The avatar is ready. Enable Shopify try_on metafields and
                  Model3d GLB media to populate the rails.
                </p>
              </div>
            ) : null}
          </div>

          <ProductRail
            title="Bottomwear"
            category="bottom"
            products={bottoms}
            selectedProductIds={selectedProductIds}
          />
        </section>
      )}

      <LookSummary />

      <AnimatePresence>
        {pendingProduct ? (
          <motion.div
            key={pendingProduct.id}
            className={styles.pullPreview}
            initial={{ opacity: 0, scale: 0.82, x: "-42vw", y: "18vh" }}
            animate={{ opacity: 1, scale: 0.25, x: "0vw", y: "-8vh" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.62, ease: [0.23, 1, 0.32, 1] }}
          >
            {pendingProduct.imageUrl ? (
              <Image
                src={pendingProduct.imageUrl}
                alt=""
                fill
                sizes="180px"
                className={styles.pullImage}
              />
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
