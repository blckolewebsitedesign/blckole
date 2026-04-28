import { HomeScene } from "components/home-scene";
import { getCollectionProducts, getProducts, getProductRecommendations } from "lib/shopify";
import type { Product } from "lib/shopify/types";

export const metadata = {
  description:
    "Born on the road, made for the city. Technical, protective and unapologetically feminine.",
  openGraph: { type: "website" },
};

export default async function HomePage() {
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
      recommendationsMap[p.id] = await getProductRecommendations(p.id).catch(() => []);
    })
  );

  const featuredProducts = await getProducts({}).catch(() => []);

  return <HomeScene products={products} recommendationsMap={recommendationsMap} featuredProducts={featuredProducts} />;
}
