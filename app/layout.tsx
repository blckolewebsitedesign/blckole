import { CartProvider } from "components/cart/cart-context";
import { CustomCursor } from "components/custom-cursor";
import { SiteShell } from "components/site-shell";
import { CUSTOMER_ACCOUNT_PROFILE_URL } from "lib/constants";
import { getSelectedCurrencyMarket } from "lib/currency-server";
import { getCart, getPages } from "lib/shopify";
import { baseUrl } from "lib/utils";
import { ReactNode } from "react";
import "./globals.css";

const SITE_NAME = process.env.SITE_NAME || "BLCKOLE";

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  robots: { follow: true, index: true },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cart = getCart();
  const activeCurrencyMarket = await getSelectedCurrencyMarket();

  const pages = await getPages().catch(() => []);
  const storyCount = pages.filter((p) => p.handle.startsWith("story-")).length;

  const leftNavItems = [
    { title: "EXPERIENCE", href: "/" },
    { title: "SHOP", href: "/indexes/products" },
  ];

  const rightNavItems = [
    {
      title: "STORY",
      href: "/story",
      ...(storyCount > 0 ? { count: storyCount } : {}),
    },
    { title: "PROFILE", href: CUSTOMER_ACCOUNT_PROFILE_URL },
  ];

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Open+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <CartProvider cartPromise={cart}>
          <CustomCursor />
          <SiteShell
            leftNavItems={leftNavItems}
            rightNavItems={rightNavItems}
            logoSrc="/logo-lockup-white.png"
            locales={["EN", "IN"]}
            activeCurrencyMarket={activeCurrencyMarket}
          >
            {children}
          </SiteShell>
        </CartProvider>
      </body>
    </html>
  );
}
