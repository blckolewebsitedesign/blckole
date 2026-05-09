"use client";

import { useCart } from "components/cart/cart-context";
import { CartDrawer } from "components/cart/drawer";
import { Header } from "components/header";
import { PageTransition } from "components/page-transition";
import type { CurrencyMarket } from "lib/currency";
import { useEffect, useState } from "react";

type NavItem = {
  title: string;
  href: string;
  count?: number;
};

type Props = {
  leftNavItems: NavItem[];
  rightNavItems: NavItem[];
  logoSrc?: string;
  locales?: string[];
  activeCurrencyMarket?: CurrencyMarket;
  children: React.ReactNode;
};

export function SiteShell({
  leftNavItems,
  rightNavItems,
  logoSrc,
  locales,
  activeCurrencyMarket,
  children,
}: Props) {
  const [cartOpen, setCartOpen] = useState(false);
  const { cart } = useCart();
  const cartCount = cart?.totalQuantity ?? 0;

  useEffect(() => {
    document.body.dataset.cartOpen = cartOpen ? "true" : "false";
    window.dispatchEvent(
      new CustomEvent("cart-open-change", { detail: { open: cartOpen } }),
    );
    return () => {
      delete document.body.dataset.cartOpen;
    };
  }, [cartOpen]);

  return (
    <>
      <Header
        leftNavItems={leftNavItems}
        rightNavItems={rightNavItems}
        cartCount={cartCount}
        onCartClick={() => setCartOpen((v) => !v)}
        logoSrc={logoSrc}
        locales={locales}
        activeCurrencyMarket={activeCurrencyMarket}
      />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <PageTransition>{children}</PageTransition>
    </>
  );
}
