import { ProductCard } from "components/product-card";
import type { Product } from "lib/shopify/types";
import Link from "next/link";
import styles from "./index.module.css";

type Props = {
  title: string;
  products: Product[];
  viewAllHref?: string;
};

export function ProductRail({ title, products, viewAllHref }: Props) {
  if (products.length === 0) return null;

  return (
    <section className={styles.section} aria-label={title}>
      <header className={styles.head}>
        <h2 className={styles.title}>{title}</h2>
        {viewAllHref ? (
          <Link href={viewAllHref} className={styles.viewAll}>
            View all
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
