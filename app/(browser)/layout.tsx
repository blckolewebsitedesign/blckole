import { HomeScene } from "components/home-scene";
import { getSelectedCountryCode } from "lib/currency-server";
import {
  getCollectionProducts,
  getProductRecommendations,
  getProducts,
} from "lib/shopify";
import type { Product } from "lib/shopify/types";
import type { ReactNode } from "react";

export default async function BrowserLayout({
  children,
}: {
  children: ReactNode;
}) {
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
