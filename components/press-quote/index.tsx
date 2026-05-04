import styles from "./index.module.css";

export function PressQuote() {
  return (
    <section className={styles.section}>
      <blockquote className={styles.quote}>
        “Quiet in the cut, loud in the detail — BLCKHOLE is what you wear when
        you do not need to explain the room you walked into.”
      </blockquote>
      <cite className={styles.cite}>Reader submission</cite>
    </section>
  );
}
