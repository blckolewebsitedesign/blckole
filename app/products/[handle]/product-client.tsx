"use client";

import { addItem } from "components/cart/actions";
import { useCart } from "components/cart/cart-context";
import { AnimatePresence, motion } from "framer-motion";
import type { Product, ProductVariant } from "lib/shopify/types";
import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
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
};

const HIDDEN_TAG = "nextjs-frontend-hidden";

type Props = {
  product: Product;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function ProductPageClient({ product }: Props) {
  console.log("PRODUCT OPTIONS:", JSON.stringify(product.options));
  console.log("REAL OPTIONS:", JSON.stringify(product.options.filter(opt => !(opt.values.length === 1 && opt.values[0]?.toLowerCase() === "default title"))));

  const { addCartItem } = useCart();
  const [message, formAction, isPending] = useActionState(addItem, null);

  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >(() =>
    Object.fromEntries(product.options.map((o) => [o.name, o.values[0] ?? ""])),
  );
  const [imageIndex, setImageIndex] = useState(0);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const rightPanelRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imageIndexRef = useRef(0);
  const wheelCooldown = useRef(false);

  const images = product.images;
  const total = images.length;

  useEffect(() => {
    imageIndexRef.current = imageIndex;
  }, [imageIndex]);

  useEffect(() => {
    const panel = rightPanelRef.current;
    if (!panel) return;
    const apply = () => {
      const h = panel.clientHeight;
      slideRefs.current.forEach((slide) => {
        if (slide) slide.style.height = `${h}px`;
      });
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(panel);
    return () => ro.disconnect();
  }, [total]);

  useEffect(() => {
    const panel = rightPanelRef.current;
    if (!panel || total <= 1) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = slideRefs.current.findIndex((s) => s === entry.target);
            if (idx !== -1) setImageIndex(idx);
          }
        });
      },
      { root: panel, threshold: 0.5 },
    );
    slideRefs.current.forEach((s) => s && io.observe(s));
    return () => io.disconnect();
  }, [total]);

  function scrollToImage(i: number) {
    const panel = rightPanelRef.current;
    const slide = slideRefs.current[i];
    if (!panel || !slide) return;
    panel.scrollTo({ top: slide.offsetTop, behavior: "smooth" });
    setImageIndex(i);
  }

  const matchingVariant = product.variants.find((v: ProductVariant) =>
    v.selectedOptions.every((opt) => selectedOptions[opt.name] === opt.value),
  );

  const price = product.priceRange.minVariantPrice;
  const priceDisplay = `${Math.round(parseFloat(price.amount))} ${price.currencyCode}`;

  const category = product.tags.find((t) => t !== HIDDEN_TAG);

  const realOptions = product.options.filter(
    (opt) =>
      !(
        opt.values.length === 1 &&
        opt.values[0]?.toLowerCase() === "default title"
      ),
  );

  const sections: { key: string; content: React.ReactNode }[] = [
    {
      key: "DETAILS",
      content: product.descriptionHtml ? (
        <div
          className={styles.accordionHtml}
          dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
        />
      ) : (
        <p className={styles.accordionText}>No details available.</p>
      ),
    },
    {
      key: "MATERIALS",
      content: (
        <p className={styles.accordionText}>
          See product label for full material composition.
        </p>
      ),
    },
    {
      key: "SHIPPING",
      content: (
        <p className={styles.accordionText}>
          Fast, tracked and secure worldwide shipping.
        </p>
      ),
    },
  ];

  const addItemAction = formAction.bind(null, matchingVariant?.id);

  return (
    <div className={styles.container}>
      <div className={styles.body}>
        <div className={styles.leftPanel}>
          {category && (
            <span className={styles.category}>{category.toUpperCase()}</span>
          )}

          <div className={styles.titleRow}>
            <h1 className={styles.title}>{product.title}</h1>
            <p className={styles.price}>{priceDisplay}</p>
            <button 
              className={styles.mobileDetailsTrigger}
              onClick={() => setOpenSection(openSection === "DETAILS" ? null : "DETAILS")}
            >
              DETAILS {openSection === "DETAILS" ? "—" : "+"}
            </button>
          </div>

          {total > 1 && (
            <div className={styles.thumbnailSection}>
              <div className={styles.thumbnailHeader}>
                <span className={styles.imageCounter}>
                  {pad(imageIndex + 1)} / {pad(total)}
                </span>
              </div>
              <div className={styles.thumbnails}>
                {images.map((img, i) => (
                  <button
                    key={img.url}
                    className={`${styles.thumb} ${i === imageIndex ? styles.thumbActive : ""}`}
                    onClick={() => scrollToImage(i)}
                    aria-label={`Image ${i + 1}`}
                  >
                    <Image
                      src={img.url}
                      alt={img.altText ?? product.title}
                      fill
                      sizes="48px"
                      className={styles.thumbImg}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {realOptions.map((option) => {
            const isColor =
              option.name.toLowerCase().includes("color") ||
              option.name.toLowerCase().includes("couleur") ||
              option.name.toLowerCase().includes("colour");

            return (
              <div key={option.id} className={styles.optionSectionRow}>
                <span className={styles.optionLabelRow}>
                  {option.name.toUpperCase()}
                </span>
                <div className={isColor ? styles.optionListColor : styles.optionListSize}>
                  {option.values.map((val) => {
                    const active = selectedOptions[option.name] === val;
                    const selectOption = () =>
                      setSelectedOptions((prev) => ({
                        ...prev,
                        [option.name]: val,
                      }));

                    if (isColor) {
                      const bg = SWATCH_COLORS[val.toUpperCase()] ?? "#b2b2b2";
                      return (
                        <button
                          key={val}
                          className={`${styles.colorRow} ${active ? styles.colorRowActive : ""}`}
                          onClick={selectOption}
                          aria-label={val}
                          aria-pressed={active}
                        >
                          <span
                            className={styles.colorDot}
                            style={{ background: bg }}
                          />
                          <span className={styles.colorName}>{val.toUpperCase()}</span>
                        </button>
                      );
                    }

                    return (
                      <button
                        key={val}
                        className={`${styles.sizeText} ${active ? styles.sizeTextActive : ""}`}
                        onClick={selectOption}
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

          <div className={styles.accordions}>
            {sections.map(({ key, content }) => (
              <div key={key} className={styles.accordionItem}>
                <button
                  className={styles.accordionTrigger}
                  onClick={() =>
                    setOpenSection((prev) => (prev === key ? null : key))
                  }
                  aria-expanded={openSection === key}
                >
                  <span>{key}</span>
                  <span className={styles.accordionIcon}>
                    {openSection === key ? "—" : "+"}
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
                      <button
                        className={styles.closeSection}
                        onClick={() => setOpenSection(null)}
                      >
                        CLOSE
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.rightWrapper}>
          <div className={styles.rightPanel} ref={rightPanelRef}>
            {images.map((img, i) => (
              <div
                key={img.url}
                ref={(el) => {
                  slideRefs.current[i] = el;
                }}
                className={styles.imageSlide}
              >
                <Image
                  src={img.url}
                  alt={img.altText ?? product.title}
                  fill
                  sizes="62vw"
                  className={styles.rightImage}
                  priority={i === 0}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <form
          className={styles.cartForm}
          action={async () => {
            if (matchingVariant) addCartItem(matchingVariant, product);
            addItemAction();
          }}
        >
          <button
            type="submit"
            className={styles.addToCartBtn}
            disabled={
              !matchingVariant?.availableForSale ||
              isPending ||
              !matchingVariant
            }
          >
            <span>
              {isPending
                ? "ADDING..."
                : !matchingVariant
                  ? "SELECT OPTIONS"
                  : !matchingVariant.availableForSale
                    ? "SOLD OUT"
                    : "ADD TO CART"}
            </span>
            <span>{priceDisplay}</span>
          </button>
        </form>

        {message && (
          <p className={styles.errorMsg} aria-live="polite" role="status">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
