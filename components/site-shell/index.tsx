"use client";

import { useCart } from "components/cart/cart-context";
import { CartDrawer } from "components/cart/drawer";
import { Header } from "components/header";
import { PageTransition } from "components/page-transition";
import { useState } from "react";

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
  children: React.ReactNode;
};

export function SiteShell({
  leftNavItems,
  rightNavItems,
  logoSrc,
  locales,
  children,
}: Props) {
  const [cartOpen, setCartOpen] = useState(false);
  const { cart } = useCart();
  const cartCount = cart?.totalQuantity ?? 0;

  return (
    <>
      <Header
        leftNavItems={leftNavItems}
        rightNavItems={rightNavItems}
        cartCount={cartCount}
        onCartClick={() => setCartOpen((v) => !v)}
        logoSrc={logoSrc}
        locales={locales}
      />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <PageTransition>{children}</PageTransition>
    </>
  );
}
