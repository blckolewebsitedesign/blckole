import { CartProvider } from "components/cart/cart-context";
import { CustomCursor } from "components/custom-cursor";
import { SiteShell } from "components/site-shell";
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
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&family=Inter:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <CartProvider cartPromise={cart}>
          <CustomCursor />
          <SiteShell
            leftNavItems={leftNavItems}
            rightNavItems={rightNavItems}
            logoSrc="/blckole-1.png"
            locales={["EN", "IN"]}
          >
            {children}
          </SiteShell>
        </CartProvider>
      </body>
    </html>
  );
}
