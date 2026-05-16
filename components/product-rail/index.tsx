import { ProductCard } from "components/product-card";
import type { Product } from "lib/shopify/types";
import Link from "next/link";
import styles from "./index.module.css";

type Props = {
  title: string;
  products: Product[];
  viewAllHref?: string;
  eyebrow?: string;
  description?: string;
  viewAllLabel?: string;
};

export function ProductRail({
  title,
  products,
  viewAllHref,
  eyebrow,
  description,
  viewAllLabel = "View all",
}: Props) {
  if (products.length === 0) return null;

  return (
    <section className={styles.section} aria-label={title}>
      <header className={styles.head}>
        <div className={styles.headContent}>
          {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
          <h2 className={styles.title}>{title}</h2>
          {description ? (
            <p className={styles.description}>{description}</p>
          ) : null}
        </div>
        {viewAllHref ? (
          <Link href={viewAllHref} className={styles.viewAll}>
            {viewAllLabel}
            <span aria-hidden="true">→</span>
          </Link>
        ) : null}
      </header>

      <ul className={styles.rail}>
        {products.slice(0, 8).map((p, i) => (
          <li key={p.id} className={styles.cell}>
            <ProductCard product={p} index={i} />
          </li>
        ))}
      </ul>
    </section>
  );
}
