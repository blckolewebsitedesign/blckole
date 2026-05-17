import { HomeScene } from "components/home-scene";
import { getSelectedCountryCode } from "lib/currency-server";
import {
  getCollectionProducts,
  getProductRecommendations,
  getProducts,
} from "lib/shopify";
import type { Product } from "lib/shopify/types";
import { Suspense, type ReactNode } from "react";

async function BrowserShell({ children }: { children: ReactNode }) {
  const countryCode = await getSelectedCountryCode();
  const products = await getCollectionProducts({
    collection: "hidden-homepage-featured-items",
    countryCode,
  })
    .catch(() => [])
    .then((items) =>
      items.length > 0 ? items : getProducts({ countryCode }).catch(() => []),
    );

  const recommendationsMap: Record<string, Product[]> = {};
  await Promise.all(
    products.map(async (p) => {
      recommendationsMap[p.id] = await getProductRecommendations(
        p.id,
        "RELATED",
        countryCode,
      ).catch(() => []);
    }),
  );

  const featuredProducts = await getProducts({ countryCode }).catch(() => []);

  return (
    <>
      <HomeScene
        products={products}
        recommendationsMap={recommendationsMap}
        featuredProducts={featuredProducts}
      />
      {children}
    </>
  );
}

export default function BrowserLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <BrowserShell>{children}</BrowserShell>
    </Suspense>
  );
}
