"use client";

import { useCart } from "components/cart/cart-context";
import { useDisplayMoney } from "components/currency/use-display-money";
import { Panel } from "components/panel";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { redirectToCheckout, removeItem, updateItemQuantity } from "./actions";
import styles from "./drawer.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function CartDrawer({ open, onClose }: Props) {
  const { cart, updateCartItem } = useCart();
  const formatPrice = useDisplayMoney();
  const searchParams = useSearchParams();
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
  const itemCount = items.reduce((sum, l) => sum + l.quantity, 0);
  const currency = searchParams.get("currency");
  const productsHref = currency
    ? `/indexes/products?currency=${encodeURIComponent(currency)}`
    : "/indexes/products";

  return (
    <Panel open={open}>
      <div className={styles.wrapper}>
        <header className={styles.header}>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close cart"
          >
            <span aria-hidden="true">×</span>
            <span className={styles.closeLabel}>Close</span>
          </button>
          <span className={styles.eyebrow}>
            Bag · {pad(itemCount)} {itemCount === 1 ? "item" : "items"}
          </span>
        </header>

        <h2 className={styles.title}>Your bag</h2>

        <div className={styles.items}>
          {items.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>Nothing in here yet.</p>
              <p className={styles.emptyDek}>
                Pick a piece — it&apos;ll wait for you.
              </p>
              <Link
                href={productsHref}
                className={styles.emptyCta}
                onClick={onClose}
              >
                Browse the line
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          ) : (
            <ul className={styles.itemList}>
              {items.map((item) => {
                const img = item.merchandise.product.featuredImage;
                const showVariant = item.merchandise.title !== "Default Title";
                return (
                  <li key={item.merchandise.id} className={styles.line}>
                    <div className={styles.lineThumb}>
                      {img ? (
                        <Image
                          src={img.url}
                          alt={img.altText ?? item.merchandise.product.title}
                          fill
                          sizes="80px"
                          className={styles.lineImage}
                        />
                      ) : null}
                    </div>

                    <div className={styles.lineBody}>
                      <div className={styles.lineHeadRow}>
                        <span className={styles.lineTitle}>
                          {item.merchandise.product.title}
                        </span>
                        <span className={styles.linePrice}>
                          {formatPrice(
                            item.cost.totalAmount.amount,
                            item.cost.totalAmount.currencyCode,
                          )}
                        </span>
                      </div>

                      {showVariant ? (
                        <span className={styles.lineVariant}>
                          {item.merchandise.title}
                        </span>
                      ) : null}

                      <div className={styles.lineActions}>
                        <div className={styles.qtyGroup} aria-label="Quantity">
                          <button
                            type="button"
                            className={styles.qtyBtn}
                            onClick={() =>
                              handleQty(
                                item.merchandise.id,
                                "minus",
                                item.quantity,
                              )
                            }
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className={styles.qtyVal} aria-live="polite">
                            {pad(item.quantity)}
                          </span>
                          <button
                            type="button"
                            className={styles.qtyBtn}
                            onClick={() =>
                              handleQty(
                                item.merchandise.id,
                                "plus",
                                item.quantity,
                              )
                            }
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={() => handleRemove(item.merchandise.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && subtotal && total ? (
          <footer className={styles.checkout}>
            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Subtotal</span>
                <span className={styles.totalValue}>
                  {formatPrice(subtotal.amount, subtotal.currencyCode)}
                </span>
              </div>
              <div className={`${styles.totalRow} ${styles.grand}`}>
                <span className={styles.totalLabel}>Total</span>
                <span className={styles.totalValue}>
                  {formatPrice(total.amount, total.currencyCode)}
                </span>
              </div>
            </div>

            <p className={styles.shipNote}>
              Shipping &amp; taxes calculated at checkout
            </p>

            <form action={redirectToCheckout}>
              <button type="submit" className={styles.checkoutBtn}>
                <span>Checkout</span>
                <span className={styles.checkoutPrice}>
                  · {formatPrice(total.amount, total.currencyCode)}
                </span>
              </button>
            </form>
          </footer>
        ) : null}
      </div>
    </Panel>
  );
}
