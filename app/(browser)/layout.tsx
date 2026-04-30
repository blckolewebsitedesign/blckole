import { HomeScene } from "components/home-scene";
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
  const products = await getCollectionProducts({
    collection: "hidden-homepage-featured-items",
  })
    .catch(() => [])
    .then((items) =>
      items.length > 0 ? items : getProducts({}).catch(() => []),
    );

  const recommendationsMap: Record<string, Product[]> = {};
  await Promise.all(
    products.map(async (p) => {
      recommendationsMap[p.id] = await getProductRecommendations(p.id).catch(
        () => [],
      );
    }),
  );

  const featuredProducts = await getProducts({}).catch(() => []);

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
