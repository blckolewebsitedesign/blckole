"use client";

import Link from "next/link";
import styles from "./index.module.css";

type NavItem = {
  title: string;
  href: string;
  count?: number;
};

type Props = {
  navItems?: NavItem[];
  cartCount?: number;
  onCartClick?: () => void;
  collectionLabel?: string;
};

function fmt(n: number) {
  return n.toString().padStart(2, "0");
}

export function Header({
  navItems = [],
  cartCount = 0,
  onCartClick,
  collectionLabel,
}: Props) {
  return (
    <>
      {/* ── Small panel: top-left ─────────────────────── */}
      <div className={styles.panel}>
        {/* Logo row */}
        <div className={styles.logoRow}>
          <Link
            href="/"
            className={styles.logoLink}
          >
            <span className={styles.logoText}>BECANE</span>
          </Link>
        </div>

        {/* Nav row */}
        <div className={styles.navRow}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={styles.navLink}>
              {item.title}
              {item.count !== undefined && (
                <span className={styles.navCount}>{fmt(item.count)}</span>
              )}
            </Link>
          ))}

          <button className={styles.cartBtn} onClick={onCartClick}>
            CART
            <span className={styles.navCount}>{fmt(cartCount)}</span>
          </button>
        </div>
      </div>

      {/* ── Top-right: collection info ────────────────── */}
      {collectionLabel && (
        <div className={styles.topRight}>
          <span className={styles.collectionLabel}>{collectionLabel}</span>
        </div>
      )}
    </>
  );
}
