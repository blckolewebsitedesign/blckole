import Link from "next/link";
import styles from "./index.module.css";

type Props = {
  count: number;
  discoverHref?: string;
};

export function BottomBar({
  count,
  discoverHref = "/indexes/products",
}: Props) {
  return (
    <div className={styles.wrapper}>
      <span className={styles.count}>{count} PRODUCTS</span>
      <Link href={discoverHref} className={styles.discover}>
        DISCOVER
      </Link>
    </div>
  );
}
