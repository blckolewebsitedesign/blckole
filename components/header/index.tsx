"use client";

import type { CurrencyMarket } from "lib/currency";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CurrencySelector } from "./currency-selector";
import styles from "./index.module.css";

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
  activeCurrencyMarket?: CurrencyMarket;
};

function fmt(n: number) {
  return n.toString().padStart(2, "0");
}

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

function NavLink({ item }: { item: NavItem }) {
  const searchParams = useSearchParams();
  const currency = searchParams.get("currency");
  const href =
    currency && !isExternalHref(item.href)
      ? `${item.href}?currency=${encodeURIComponent(currency)}`
      : item.href;

  const content = (
    <>
      {item.title}
      {item.count !== undefined && (
        <span className={styles.navCount}>{fmt(item.count)}</span>
      )}
    </>
  );

  if (isExternalHref(href)) {
    return (
      <a href={href} className={styles.navLink}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={styles.navLink}>
      {content}
    </Link>
  );
}

export function Header({
  leftNavItems = [],
  rightNavItems = [],
  cartCount = 0,
  onCartClick,
  logoSrc = "/logo-lockup-white.png",
  logoAlt = "BLCKHOLE",
  locales = ["EN", "IN"],
  activeCurrencyMarket,
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
        {/* <LocaleSwitcher locales={locales} /> */}
        <CurrencySelector activeMarket={activeCurrencyMarket} />
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
