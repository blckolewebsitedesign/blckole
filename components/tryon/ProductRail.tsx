"use client";

import { useDisplayMoney } from "components/currency/use-display-money";
import styles from "components/tryon/tryon.module.css";
import Image from "next/image";
import { useTryOnStore } from "stores/useTryOnStore";
import type { TryOnProduct, WearableCategory } from "types/tryon";

type Props = {
  title: string;
  category: WearableCategory;
  products: TryOnProduct[];
  selectedProductIds: string[];
};

export function ProductRail({
  title,
  category,
  products,
  selectedProductIds,
}: Props) {
  const formatPrice = useDisplayMoney();
  const selectProduct = useTryOnStore((state) => state.selectProduct);
  const pendingProduct = useTryOnStore((state) => state.pendingProduct);
  const productErrors = useTryOnStore((state) => state.productErrors);

  return (
    <section className={styles.rail} aria-label={title}>
      <header className={styles.railHeader}>
        <span className={styles.railKicker}>{category}</span>
        <h2 className={styles.railTitle}>{title}</h2>
      </header>

      {products.length === 0 ? (
        <p className={styles.emptyRail}>No compatible pieces yet.</p>
      ) : (
        <div className={styles.productList}>
          {products.map((product) => {
            const active = selectedProductIds.includes(product.id);
            const pending = pendingProduct?.id === product.id;
            const error = productErrors[product.id];

            return (
              <button
                key={product.id}
                type="button"
                className={`${styles.productCard} ${
                  active ? styles.productCardActive : ""
                } ${pending ? styles.productCardPending : ""}`}
                onClick={() => selectProduct(product)}
              >
                <span className={styles.productThumb}>
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.title}
                      fill
                      sizes="160px"
                      className={styles.productImage}
                    />
                  ) : (
                    <span className={styles.productImageFallback} />
                  )}
                </span>
                <span className={styles.productMeta}>
                  <span className={styles.productTitle}>{product.title}</span>
                  <span className={styles.productPrice}>
                    {formatPrice(product.price, product.currencyCode)}
                  </span>
                  {error ? (
                    <span className={styles.productError}>{error}</span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
