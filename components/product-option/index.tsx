"use client";

import clsx from "clsx";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./index.module.css";

type OptionValue = {
  value: string;
  available: boolean;
};

type Props = {
  name: string;
  values: OptionValue[];
};

export function ProductOption({ name, values }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get(name.toLowerCase());

  function select(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(name.toLowerCase(), value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }
  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>{name}</span>
      <div className={styles.options}>
        {values.map(({ value, available }) => (
          <button
            key={value}
            className={clsx(
              styles.option,
              current === value && styles.active,
              !available && styles.unavailable,
            )}
            onClick={() => available && select(value)}
            disabled={!available}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}
