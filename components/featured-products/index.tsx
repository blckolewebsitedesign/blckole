import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Product } from "lib/shopify/types";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef } from "react";
import styles from "./index.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type Props = {
  products: Product[];
};

export function FeaturedProducts({ products }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const displayProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((product) => product.availableForSale).slice(0, 4);
  }, [products]);

  useGSAP(
    () => {
      if (!gridRef.current) return;
      const cards = gsap.utils.toArray("." + styles.card);

      gsap.fromTo(
        cards,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            once: true,
          },
        },
      );
    },
    { scope: sectionRef },
  );

  if (displayProducts.length === 0) return null;

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          FEATURED <br /> PRODUCTS
        </h2>
        <span className={styles.count}>{displayProducts.length} ITEMS</span>
      </div>

      <div ref={gridRef} className={styles.grid}>
        {displayProducts.map((product) => (
          <Link
            href={`/products/${product.handle}`}
            key={product.id}
            className={styles.card}
          >
            <div className={styles.imageWrap}>
              {product.featuredImage ? (
                <Image
                  src={product.featuredImage.url}
                  alt={product.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className={styles.image}
                />
              ) : (
                <div className={styles.placeholder} />
              )}
            </div>
            <div className={styles.details}>
              <h3 className={styles.productTitle}>{product.title}</h3>
              <p className={styles.price}>
                {product.priceRange.minVariantPrice.amount}{" "}
                {product.priceRange.minVariantPrice.currencyCode}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
