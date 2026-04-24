"use client";

import { useCart } from "components/cart/cart-context";
import { Panel } from "components/panel";
import Image from "next/image";
import { useTransition } from "react";
import { redirectToCheckout, removeItem, updateItemQuantity } from "./actions";
import styles from "./drawer.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
};

function formatPrice(amount: string, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

export function CartDrawer({ open, onClose }: Props) {
  const { cart, updateCartItem } = useCart();
  const [, startTransition] = useTransition();

  async function handleRemove(merchandiseId: string) {
    updateCartItem(merchandiseId, "delete");
    startTransition(async () => {
      await removeItem(null, merchandiseId);
    });
  }

  async function handleQty(
    merchandiseId: string,
    delta: "plus" | "minus",
    currentQty: number,
  ) {
    updateCartItem(merchandiseId, delta);
    startTransition(async () => {
      await updateItemQuantity(null, {
        merchandiseId,
        quantity: delta === "plus" ? currentQty + 1 : currentQty - 1,
      });
    });
  }

  const items = cart?.lines ?? [];
  const subtotal = cart?.cost.subtotalAmount;
  const total = cart?.cost.totalAmount;

  return (
    <Panel open={open}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <span className={styles.title}>Cart</span>
          <button className={styles.closeBtn} onClick={onClose}>
            Close
          </button>
        </div>

        <div className={styles.items}>
          {items.length === 0 ? (
            <div className={styles.empty}>Your cart is empty</div>
          ) : (
            items.map((item) => (
              <div key={item.merchandise.id} className={styles.line}>
                {item.merchandise.product.featuredImage && (
                  <Image
                    src={item.merchandise.product.featuredImage.url}
                    alt={
                      item.merchandise.product.featuredImage.altText ??
                      item.merchandise.product.title
                    }
                    width={48}
                    height={48}
                    className={styles.lineImage}
                  />
                )}

                <div className={styles.lineInfo}>
                  <span className={styles.lineTitle}>
                    {item.merchandise.product.title}
                  </span>
                  {item.merchandise.title !== "Default Title" && (
                    <span className={styles.lineVariant}>
                      {item.merchandise.title}
                    </span>
                  )}

                  <div className={styles.lineActions}>
                    <div className={styles.lineQty}>
                      <button
                        className={styles.qtyBtn}
                        onClick={() =>
                          handleQty(item.merchandise.id, "minus", item.quantity)
                        }
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        className={styles.qtyBtn}
                        onClick={() =>
                          handleQty(item.merchandise.id, "plus", item.quantity)
                        }
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <span className={styles.linePrice}>
                      {formatPrice(
                        item.cost.totalAmount.amount,
                        item.cost.totalAmount.currencyCode,
                      )}
                    </span>
                  </div>

                  <button
                    className={styles.removeBtn}
                    onClick={() => handleRemove(item.merchandise.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && subtotal && total && (
          <div className={styles.checkout}>
            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span>
                  {formatPrice(subtotal.amount, subtotal.currencyCode)}
                </span>
              </div>
              <div className={`${styles.totalRow} ${styles.grand}`}>
                <span>Total</span>
                <span>{formatPrice(total.amount, total.currencyCode)}</span>
              </div>
            </div>

            <form action={redirectToCheckout}>
              <button type="submit" className={styles.checkoutBtn}>
                Proceed to Checkout
              </button>
            </form>
          </div>
        )}
      </div>
    </Panel>
  );
}
