"use client";

import { addItems } from "components/cart/actions";
import { useCart } from "components/cart/cart-context";
import { useDisplayMoney } from "components/currency/use-display-money";
import styles from "components/tryon/tryon.module.css";
import { useActionState, useMemo } from "react";
import { useTryOnStore } from "stores/useTryOnStore";
import type { TryOnProduct } from "types/tryon";

function selectedVariantLabel(product: TryOnProduct, variantId: string) {
  const variant = product.variants.find((item) => item.id === variantId);
  if (!variant) return "Select variant";
  if (variant.title && variant.title !== "Default Title") return variant.title;

  const options = variant.selectedOptions
    .map((option) => option.value)
    .filter((value) => value !== "Default Title");

  return options.length > 0 ? options.join(" / ") : "Default";
}

function getSelectedProducts({
  top,
  bottom,
  shoes,
  accessories,
}: {
  top: TryOnProduct | null;
  bottom: TryOnProduct | null;
  shoes: TryOnProduct | null;
  accessories: TryOnProduct[];
}) {
  return [top, bottom, shoes, ...accessories].filter(Boolean) as TryOnProduct[];
}

export function LookSummary() {
  const formatPrice = useDisplayMoney();
  const { addCartItems } = useCart();
  const [message, formAction, isPending] = useActionState(addItems, null);
  const selectedAvatar = useTryOnStore((state) => state.selectedAvatar);
  const selectedSkinTone = useTryOnStore((state) => state.selectedSkinTone);
  const top = useTryOnStore((state) => state.selectedTop);
  const bottom = useTryOnStore((state) => state.selectedBottom);
  const shoes = useTryOnStore((state) => state.selectedShoes);
  const accessories = useTryOnStore((state) => state.selectedAccessories);
  const savedLooks = useTryOnStore((state) => state.savedLooks);
  const setProductVariant = useTryOnStore((state) => state.setProductVariant);
  const resetLook = useTryOnStore((state) => state.resetLook);
  const saveLook = useTryOnStore((state) => state.saveLook);
  const removeProduct = useTryOnStore((state) => state.removeProduct);

  const selectedProducts = useMemo(
    () => getSelectedProducts({ top, bottom, shoes, accessories }),
    [accessories, bottom, shoes, top],
  );

  const total = selectedProducts.reduce(
    (sum, product) => sum + Number(product.price),
    0,
  );
  const currencyCode = selectedProducts[0]?.currencyCode ?? "INR";
  const addItemsAction = formAction.bind(
    null,
    selectedProducts.map((product) => product.variantId),
  );

  const shareLook = async () => {
    const text = `BLCKOLE try-on: ${selectedProducts
      .map((product) => product.title)
      .join(", ")}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "BLCKOLE try-on", text });
        return;
      }

      await navigator.clipboard?.writeText(`${text} ${window.location.href}`);
    } catch {
      // Share cancellation is a normal browser flow.
    }
  };

  return (
    <aside className={styles.summary} aria-label="Selected outfit">
      <div className={styles.summaryPanel}>
        <header className={styles.summaryHeader}>
          <span className={styles.summaryKicker}>
            {selectedAvatar} / {selectedSkinTone}
          </span>
          <h2 className={styles.summaryTitle}>Current look</h2>
        </header>

        {selectedProducts.length === 0 ? (
          <p className={styles.summaryEmpty}>
            Choose pieces to style the avatar.
          </p>
        ) : (
          <div className={styles.summaryItems}>
            {selectedProducts.map((product) => (
              <div key={product.id} className={styles.summaryItem}>
                <div className={styles.summaryItemHead}>
                  <div>
                    <span className={styles.summaryCategory}>
                      {product.category}
                    </span>
                    <h3 className={styles.summaryProductTitle}>
                      {product.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => removeProduct(product.category, product.id)}
                  >
                    Remove
                  </button>
                </div>

                {product.variants.length > 1 ? (
                  <label className={styles.variantLabel}>
                    Size / variant
                    <select
                      className={styles.variantSelect}
                      value={product.variantId}
                      onChange={(event) =>
                        setProductVariant(product.id, event.target.value)
                      }
                    >
                      {product.variants.map((variant) => (
                        <option
                          key={variant.id}
                          value={variant.id}
                          disabled={!variant.availableForSale}
                        >
                          {selectedVariantLabel(product, variant.id)}
                          {!variant.availableForSale ? " - Sold out" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <span className={styles.variantStatic}>
                    {selectedVariantLabel(product, product.variantId)}
                  </span>
                )}

                <span className={styles.summaryPrice}>
                  {formatPrice(product.price, product.currencyCode)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.summaryBar}>
        <div className={styles.savedLooks}>
          Saved <span>{savedLooks.length.toString().padStart(2, "0")}</span>
        </div>

        <div className={styles.summaryActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={saveLook}
            disabled={selectedProducts.length === 0}
          >
            Save Look
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={resetLook}
            disabled={selectedProducts.length === 0}
          >
            Reset
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => void shareLook()}
            disabled={selectedProducts.length === 0}
          >
            Share
          </button>
        </div>

        <form
          className={styles.addForm}
          action={async () => {
            addCartItems(
              selectedProducts.map((product) => {
                const variant =
                  product.variants.find(
                    (item) => item.id === product.variantId,
                  ) ?? product.variants[0]!;

                return {
                  variant,
                  product: {
                    id: product.shopifyProductId,
                    handle: product.handle,
                    title: product.title,
                    featuredImage: {
                      url: product.imageUrl || "/logo.svg",
                      altText: product.title,
                      width: 1,
                      height: 1,
                    },
                  },
                };
              }),
            );
            await addItemsAction();
          }}
        >
          <button
            type="submit"
            className={styles.addButton}
            disabled={selectedProducts.length === 0 || isPending}
          >
            <span>{isPending ? "Adding" : "Add All To Bag"}</span>
            {selectedProducts.length > 0 ? (
              <span> / {formatPrice(total.toString(), currencyCode)}</span>
            ) : null}
          </button>
        </form>
      </div>

      {message ? (
        <p className={styles.summaryError} aria-live="polite">
          {message}
        </p>
      ) : null}
    </aside>
  );
}
