import type { Product } from "lib/shopify/types";
import Link from "next/link";
import styles from "./index.module.css";

type Props = {
  count: number;
  discoverHref?: string;
  selectedProduct?: Product;
};

export function BottomBar({
  count,
  discoverHref = "/indexes/products",
  selectedProduct,
}: Props) {
  if (selectedProduct) {
    return (
      <div className={styles.wrapper}>
        <span className={styles.count}>
          {selectedProduct.title.toUpperCase()}
        </span>
        <Link
          href={`/products/${selectedProduct.handle}`}
          className={styles.discover}
        >
          VIEW
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <span className={styles.count}>{count} PRODUCTS</span>
      <Link href={discoverHref} className={styles.discover}>
        DISCOVER
      </Link>
    </div>
  );
}
