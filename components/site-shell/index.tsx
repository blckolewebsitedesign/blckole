"use client";

import { useCart } from "components/cart/cart-context";
import { CartDrawer } from "components/cart/drawer";
import { Header } from "components/header";
import { PageTransition } from "components/page-transition";
import { Suspense, useEffect, useState } from "react";

type NavItem = {
  title: string;
  href: string;
  count?: number;
};

type ChromeProps = {
  leftNavItems: NavItem[];
  rightNavItems: NavItem[];
  logoSrc?: string;
  locales?: string[];
};

type Props = ChromeProps & {
  children: React.ReactNode;
};

// Header + CartDrawer depend on the private cart promise (use cache: private),
// which must resolve inside a Suspense boundary. Isolating them here lets the
// rest of the page tree (children) render without waiting on the cart.
function CartAwareChrome({
  leftNavItems,
  rightNavItems,
  logoSrc,
  locales,
}: ChromeProps) {
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
      />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

export function SiteShell({
  leftNavItems,
  rightNavItems,
  logoSrc,
  locales,
  children,
}: Props) {
  return (
    <>
      <Suspense fallback={null}>
        <CartAwareChrome
          leftNavItems={leftNavItems}
          rightNavItems={rightNavItems}
          logoSrc={logoSrc}
          locales={locales}
        />
      </Suspense>
      <PageTransition>{children}</PageTransition>
    </>
  );
}
