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
  navItems: NavItem[];
  collectionLabel?: string;
  children: React.ReactNode;
};

export function SiteShell({ navItems, collectionLabel, children }: Props) {
  const [cartOpen, setCartOpen] = useState(false);
  const { cart } = useCart();
  const cartCount = cart?.totalQuantity ?? 0;
  console.log("site-shell rendering......");
  return (
    <>
      <Header
        navItems={navItems}
        cartCount={cartCount}
        onCartClick={() => setCartOpen((v) => !v)}
        collectionLabel={collectionLabel}
      />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      {/* No paddingTop — header is a small panel overlay, not full-width */}
      <PageTransition>{children}</PageTransition>
    </>
  );
}
