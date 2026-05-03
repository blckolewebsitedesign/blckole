import styles from "./index.module.css";

export function Manifesto() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.quote}>
          Not volume.
          <br />
          Conviction.
        </div>
        <div className={styles.right}>
          <p className={styles.body}>
            <span className={styles.pill}>BK</span>
            We drift, we orbit, we come back. BLCKHOLE is the reminder: some
            forces do not negotiate — they align you. The work is wardrobe as
            gravity — black, white, a controlled flash of red, and silhouettes
            that hold the room without asking for it.
          </p>
          <p className={styles.meta}>Established 2024</p>
        </div>
      </div>
    </section>
  );
}
