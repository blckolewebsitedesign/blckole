"use client";

import { useEffect, useState } from "react";
import styles from "./index.module.css";

type Props = {
  locales: string[];
  storageKey?: string;
};

export function LocaleSwitcher({ locales, storageKey = "locale" }: Props) {
  const [active, setActive] = useState(locales[0] ?? "EN");

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored && locales.includes(stored)) setActive(stored);
  }, [locales, storageKey]);

  function pick(loc: string) {
    setActive(loc);
    window.localStorage.setItem(storageKey, loc);
  }

  return (
    <div className={styles.localeSwitcher} aria-label="Select region">
      {locales.map((loc, i) => (
        <span key={loc} className={styles.localeGroup}>
          <button
            type="button"
            className={
              active === loc
                ? `${styles.localeBtn} ${styles.localeBtnActive}`
                : styles.localeBtn
            }
            aria-pressed={active === loc}
            onClick={() => pick(loc)}
          >
            {loc}
          </button>
          {i < locales.length - 1 && (
            <span className={styles.localeSep}>/</span>
          )}
        </span>
      ))}
    </div>
  );
}
