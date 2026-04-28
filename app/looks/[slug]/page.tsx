import { HomeScene } from "components/home-scene";
import { HIDDEN_PRODUCT_TAG } from "lib/constants";
import { getProduct, getProducts, getCollectionProducts, getProductRecommendations } from "lib/shopify";
import type { Product } from "lib/shopify/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const product = await getProduct(params.slug);
  if (!product) return notFound();

  const { url, width, height, altText: alt } = product.featuredImage || {};
  const indexable = !product.tags?.includes(HIDDEN_PRODUCT_TAG);

  return {
    title: product.seo?.title || product.title,
    description: product.seo?.description || product.description,
    robots: { index: indexable, follow: indexable },
    openGraph: url ? { images: [{ url, width, height, alt }] } : undefined,
  };
}

export default async function LookPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const product = await getProduct(params.slug);
  if (!product) return notFound();

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

  return <HomeScene products={products} recommendationsMap={recommendationsMap} initialHandle={params.slug} featuredProducts={featuredProducts} />;
}
