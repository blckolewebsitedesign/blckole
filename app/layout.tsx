import { CartProvider } from "components/cart/cart-context";
import { SiteShell } from "components/site-shell";
import { getCart, getCollections, getPages, getProducts } from "lib/shopify";
import { baseUrl } from "lib/utils";
import { ReactNode } from "react";
import "./globals.css";

const { SITE_NAME } = process.env;

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: SITE_NAME ?? "Storefront",
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

  const [products, pages, collections] = await Promise.all([
    getProducts({}).catch(() => []),
    getPages().catch(() => []),
    getCollections().catch(() => []),
  ]);

  const storyCount = pages.filter((p) => p.handle.startsWith("story-")).length;

  const navItems = [
    { title: "ALL", href: "/indexes/products", count: products.length },
    ...(storyCount > 0
      ? [{ title: "STORIES", href: "/story", count: storyCount }]
      : []),
  ];

  // e.g. "COLLECTION 01 / 01"
  const collectionLabel =
    collections.length > 0
      ? `COLLECTION 01 / ${String(collections.length).padStart(2, "0")}`
      : "COLLECTION";

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
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;900&family=Barlow:wght@400;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <CartProvider cartPromise={cart}>
          <SiteShell navItems={navItems} collectionLabel={collectionLabel}>
            {children}
          </SiteShell>
        </CartProvider>
      </body>
    </html>
  );
}
