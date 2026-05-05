"use client";

import { addItem } from "components/cart/actions";
import { useCart } from "components/cart/cart-context";
import { AnimatePresence, motion } from "framer-motion";
import type { Product, ProductVariant } from "lib/shopify/types";
import Image from "next/image";
import { useActionState, useState } from "react";
import styles from "./product-client.module.css";

const SWATCH_COLORS: Record<string, string> = {
  NOIR: "#0a0a0a",
  BLACK: "#0a0a0a",
  BLANC: "#f5f5f5",
  WHITE: "#f5f5f5",
  SABLE: "#c8a97e",
  OLIVE: "#6b7c5c",
  ROUGE: "#c0392b",
  RED: "#c0392b",
  BLEU: "#2980b9",
  BLUE: "#2980b9",
  "VOID BLUE": "#1a2a4a",
  VERT: "#27ae60",
  GREEN: "#27ae60",
  ROSE: "#e91e8c",
  PINK: "#e91e8c",
  GRIS: "#b2b2b2",
  GREY: "#b2b2b2",
  GRAY: "#b2b2b2",
  CARAMEL: "#c19a6b",
  ECRU: "#f5f0e1",
  MARINE: "#1a2a4a",
  NAVY: "#1a2a4a",
  CRIMSON: "#891824",
};

type Props = {
  product: Product;
};

function formatPrice(amount: string, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export function ProductPageClient({ product }: Props) {
  const { addCartItem } = useCart();
  const [message, formAction, isPending] = useActionState(addItem, null);

  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >(() =>
    Object.fromEntries(product.options.map((o) => [o.name, o.values[0] ?? ""])),
  );
  const [imageIndex, setImageIndex] = useState(0);
  const [openSection, setOpenSection] = useState<string | null>(null);

  // Filmstrip convention: when there are 2+ images the LAST image is a
  // 36-frame sprite for the homepage's 360° rotation. Strip it from the
  // gallery so it doesn't pollute the product photo set.
  const galleryImages =
    product.images.length > 1 ? product.images.slice(0, -1) : product.images;
  const total = galleryImages.length;

  const matchingVariant = product.variants.find((v: ProductVariant) =>
    v.selectedOptions.every((opt) => selectedOptions[opt.name] === opt.value),
  );

  const price = product.priceRange.minVariantPrice;
  const priceDisplay = formatPrice(price.amount, price.currencyCode);
  const category = product.productType?.trim() || product.tags[0] || "";

  const realOptions = product.options.filter(
    (opt) =>
      !(
        opt.values.length === 1 &&
        opt.values[0]?.toLowerCase() === "default title"
      ),
  );

  const detailsHtml = product.descriptionHtml || "";
  const description = product.description || "";

  function selectOption(name: string, val: string) {
    setSelectedOptions((prev) => ({ ...prev, [name]: val }));
  }

  function nextImage() {
    if (total === 0) return;
    setImageIndex((i) => (i + 1) % total);
  }

  function prevImage() {
    if (total === 0) return;
    setImageIndex((i) => (i - 1 + total) % total);
  }

  const addItemAction = formAction.bind(null, matchingVariant?.id);
  const activeImage = galleryImages[imageIndex];

  const sections: { key: string; label: string; content: React.ReactNode }[] = [
    {
      key: "DETAILS",
      label: "Details",
      content: detailsHtml ? (
        <div
          className={styles.accordionHtml}
          dangerouslySetInnerHTML={{ __html: detailsHtml }}
        />
      ) : (
        <p className={styles.accordionText}>{description}</p>
      ),
    },
    {
      key: "SHIPPING",
      label: "Shipping & Returns",
      content: (
        <p className={styles.accordionText}>
          Fast, tracked, secure worldwide shipping. 14-day returns &amp; easy
          exchange.
        </p>
      ),
    },
    {
      key: "SIZE_GUIDE",
      label: "Size Guide",
      content: (
        <p className={styles.accordionText}>
          Refer to the product label for full sizing. Most pieces run a relaxed,
          oversized fit.
        </p>
      ),
    },
  ];

  return (
    <div className={styles.body}>
      {/* ── Left column (info) ───────────────────────────────── */}
      <div className={styles.leftCol}>
        {category ? <span className={styles.category}>{category}</span> : null}

        <h1 className={styles.title}>{product.title}</h1>

        <div className={styles.priceRow}>
          <span className={styles.price}>{priceDisplay}</span>
          <span className={styles.priceTax}>MRP incl. of all taxes</span>
        </div>

        {description ? (
          <p className={styles.description}>{description}</p>
        ) : null}

        {realOptions.map((option) => {
          const isColor = /colou?r/i.test(option.name);
          return (
            <div key={option.id} className={styles.optionGroup}>
              <span className={styles.optionLabel}>
                {option.name.toUpperCase()}
              </span>
              <div
                className={
                  isColor ? styles.optionListColor : styles.optionListSize
                }
              >
                {option.values.map((val) => {
                  const active = selectedOptions[option.name] === val;
                  if (isColor) {
                    const bg = SWATCH_COLORS[val.toUpperCase()] ?? "#b2b2b2";
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => selectOption(option.name, val)}
                        className={`${styles.colorChip} ${active ? styles.colorChipActive : ""}`}
                        aria-pressed={active}
                      >
                        <span
                          className={styles.colorDot}
                          style={{ background: bg }}
                          aria-hidden="true"
                        />
                        <span className={styles.colorName}>
                          {val.toUpperCase()}
                        </span>
                      </button>
                    );
                  }
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => selectOption(option.name, val)}
                      className={`${styles.sizeChip} ${active ? styles.sizeChipActive : ""}`}
                      aria-pressed={active}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className={styles.utilityRow}>
          <button
            type="button"
            className={styles.utilityLink}
            onClick={() =>
              setOpenSection((p) => (p === "SIZE_GUIDE" ? null : "SIZE_GUIDE"))
            }
          >
            <svg
              className={styles.utilityIcon}
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M11.3 2.7l2 2L4.5 13.5l-2.7.7.7-2.7 8.8-8.8z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
            Size guide
          </button>
          <button
            type="button"
            className={styles.utilityLink}
            onClick={() =>
              setOpenSection((p) => (p === "SHIPPING" ? null : "SHIPPING"))
            }
          >
            <svg
              className={styles.utilityIcon}
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="1"
                y="4"
                width="9"
                height="7"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <path
                d="M10 6h3l2 2v3h-5z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <circle
                cx="4"
                cy="12"
                r="1.4"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <circle
                cx="12"
                cy="12"
                r="1.4"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </svg>
            Shipping &amp; returns
          </button>
        </div>

        <div className={styles.accordions}>
          {sections.map(({ key, label, content }) => (
            <div key={key} className={styles.accordionItem}>
              <button
                className={styles.accordionTrigger}
                onClick={() => setOpenSection((p) => (p === key ? null : key))}
                aria-expanded={openSection === key}
                type="button"
              >
                <span>{label}</span>
                <span className={styles.accordionIcon} aria-hidden="true">
                  {openSection === key ? "−" : "+"}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {openSection === key && (
                  <motion.div
                    key="content"
                    className={styles.accordionContent}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                  >
                    {content}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <form
          className={styles.cartForm}
          action={async () => {
            if (matchingVariant) addCartItem(matchingVariant, product);
            addItemAction();
          }}
        >
          <button
            type="submit"
            className={styles.addToBag}
            disabled={
              !matchingVariant?.availableForSale ||
              isPending ||
              !matchingVariant
            }
          >
            <span>
              {isPending
                ? "Adding…"
                : !matchingVariant
                  ? "Select options"
                  : !matchingVariant.availableForSale
                    ? "Sold out"
                    : "Add to bag"}
            </span>
            <span className={styles.addToBagPrice}>· {priceDisplay}</span>
          </button>
        </form>

        <p className={styles.returns}>
          <svg
            className={styles.returnsIcon}
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M8 1.5L2.5 3.7v4.6c0 3 2.4 5.6 5.5 6.2 3.1-.6 5.5-3.2 5.5-6.2V3.7L8 1.5z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
          14-day returns &amp; easy exchange
        </p>

        {message ? (
          <p className={styles.errorMsg} aria-live="polite" role="status">
            {message}
          </p>
        ) : null}
      </div>

      {/* ── Right column (gallery) ───────────────────────────── */}
      <div className={styles.rightCol}>
        <div className={styles.galleryGrid}>
          <div className={styles.mainImageWrap}>
            {activeImage ? (
              <Image
                src={activeImage.url}
                alt={activeImage.altText ?? product.title}
                fill
                sizes="(max-width: 860px) 100vw, 50vw"
                className={styles.mainImage}
                priority
              />
            ) : null}

            {total > 1 ? (
              <div className={styles.navButtons}>
                <button
                  type="button"
                  className={styles.navButton}
                  onClick={prevImage}
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className={styles.navButton}
                  onClick={nextImage}
                  aria-label="Next image"
                >
                  ›
                </button>
              </div>
            ) : null}
          </div>

          {total > 1 ? (
            <ul className={styles.thumbRail} aria-label="Product images">
              {galleryImages.map((img, i) => (
                <li key={img.url}>
                  <button
                    type="button"
                    className={`${styles.thumb} ${i === imageIndex ? styles.thumbActive : ""}`}
                    onClick={() => setImageIndex(i)}
                    aria-label={`Image ${i + 1}`}
                    aria-pressed={i === imageIndex}
                  >
                    <Image
                      src={img.url}
                      alt={img.altText ?? product.title}
                      fill
                      sizes="80px"
                      className={styles.thumbImg}
                    />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
