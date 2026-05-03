"use client";

import Link from "next/link";
import styles from "./index.module.css";
import { LocaleSwitcher } from "./locale-switcher";

type NavItem = {
  title: string;
  href: string;
  count?: number;
};

type Props = {
  leftNavItems?: NavItem[];
  rightNavItems?: NavItem[];
  cartCount?: number;
  onCartClick?: () => void;
  logoSrc?: string;
  logoAlt?: string;
  locales?: string[];
};

function fmt(n: number) {
  return n.toString().padStart(2, "0");
}

function NavLink({ item }: { item: NavItem }) {
  return (
    <Link href={item.href} className={styles.navLink}>
      {item.title}
      {item.count !== undefined && (
        <span className={styles.navCount}>{fmt(item.count)}</span>
      )}
    </Link>
  );
}

export function Header({
  leftNavItems = [],
  rightNavItems = [],
  cartCount = 0,
  onCartClick,
  logoSrc = "/blckole-1.png",
  logoAlt = "BLCKHOLE",
  locales = ["EN", "IN"],
}: Props) {
  return (
    <header className={styles.header}>
      <nav className={styles.zoneLeft} aria-label="Primary">
        {leftNavItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      <Link href="/" className={styles.logoLink} aria-label={logoAlt}>
        <img src={logoSrc} alt={logoAlt} className={styles.logoImg} />
      </Link>

      <div className={styles.zoneRight}>
        <nav aria-label="Secondary" className={styles.zoneRightNav}>
          {rightNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
        <LocaleSwitcher locales={locales} />
        <button
          type="button"
          className={styles.cartBtn}
          onClick={onCartClick}
          aria-label="Open cart"
        >
          CART
          <span className={styles.navCount}>{fmt(cartCount)}</span>
        </button>
      </div>
    </header>
  );
}
