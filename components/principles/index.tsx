import styles from "./index.module.css";

const ITEMS = [
  {
    num: "01",
    name: "Presence",
    desc: "Stillness that reads before you speak.",
  },
  {
    num: "02",
    name: "Identity",
    desc: "Signature over novelty — the long arc over the short hit.",
  },
  {
    num: "03",
    name: "Gravity",
    desc: "The pull is emotional first. The clothes simply agree.",
  },
  {
    num: "04",
    name: "Permanence",
    desc: "Cut and cloth meant to age with you, not expire on you.",
  },
  {
    num: "05",
    name: "Anonymity",
    desc: "Power without performance — recognition without announcement.",
  },
];

export function Principles() {
  return (
    <section className={styles.section} aria-label="Principles">
      <div className={styles.grid}>
        {ITEMS.map((p) => (
          <div key={p.num} className={styles.cell}>
            <div className={styles.num}>— {p.num}</div>
            <div className={styles.name}>{p.name}</div>
            <div className={styles.desc}>{p.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
