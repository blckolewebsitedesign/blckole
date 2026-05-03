import styles from "./index.module.css";

const ITEMS = [
  { k: "Ship", v: "Free standard above ₹4,999" },
  { k: "Dispatch", v: "In-stock orders within 48 hours" },
  { k: "Returns", v: "14 days · unused with tags" },
];

export function TrustBar() {
  return (
    <section className={styles.bar} aria-label="Store policies">
      <div className={styles.inner}>
        {ITEMS.map((it) => (
          <div key={it.k} className={styles.item}>
            <span className={styles.key}>{it.k}</span>
            <span className={styles.value}>{it.v}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
