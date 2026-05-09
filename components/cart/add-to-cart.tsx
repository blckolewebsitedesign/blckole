"use client";

import { useCart } from "components/cart/cart-context";
import type { Product, ProductVariant } from "lib/shopify/types";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { addItem } from "./actions";
import styles from "./add-to-cart.module.css";

type Props = {
  product: Product;
};

export function AddToCart({ product }: Props) {
  const { variants, availableForSale } = product;
  const { addCartItem } = useCart();
  const searchParams = useSearchParams();
  const [message, formAction, isPending] = useActionState(addItem, null);

  const variant = variants.find((v: ProductVariant) =>
    v.selectedOptions.every(
      (opt) => opt.value === searchParams.get(opt.name.toLowerCase()),
    ),
  );
  const defaultVariantId = variants.length === 1 ? variants[0]?.id : undefined;
  const selectedVariantId = variant?.id ?? defaultVariantId;
  const finalVariant = variants.find(
    (v: ProductVariant) => v.id === selectedVariantId,
  );

  const addItemAction = formAction.bind(null, selectedVariantId);

  const label = isPending
    ? "Adding..."
    : !selectedVariantId
      ? "Select options"
      : !availableForSale
        ? "Sold out"
        : "Add to Cart";

  return (
    <div className={styles.wrapper}>
      <form
        action={async () => {
          if (finalVariant) addCartItem(finalVariant, product);
          await addItemAction();
        }}
      >
        <button
          type="submit"
          className={styles.btn}
          disabled={!availableForSale || isPending || !selectedVariantId}
        >
          {label}
        </button>
      </form>
      {message && (
        <p className={styles.error} aria-live="polite" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
