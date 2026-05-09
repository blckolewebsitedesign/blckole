import { Footer } from "components/footer";
import { ProductRail } from "components/product-rail";
import { HIDDEN_PRODUCT_TAG } from "lib/constants";
import { getSelectedCountryCode } from "lib/currency-server";
import { getProduct, getProductRecommendations } from "lib/shopify";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import styles from "./page.module.css";
import { ProductPageClient } from "./product-client";

export async function generateMetadata(props: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const product = await getProduct(params.handle);
  if (!product) return notFound();

  const { url, width, height, altText: alt } = product.featuredImage || {};
  const indexable = !product.tags.includes(HIDDEN_PRODUCT_TAG);

  return {
    title: product.seo.title || product.title,
    description: product.seo.description || product.description,
    robots: { index: indexable, follow: indexable },
    openGraph: url ? { images: [{ url, width, height, alt }] } : undefined,
  };
}

export default async function ProductPage(props: {
  params: Promise<{ handle: string }>;
  searchParams?: Promise<{ currency?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const countryCode = await getSelectedCountryCode(searchParams?.currency);
  const product = await getProduct(params.handle, countryCode);
  if (!product) return notFound();

  const [complementary, related] = await Promise.all([
    getProductRecommendations(product.id, "COMPLEMENTARY", countryCode).catch(
      () => [],
    ),
    getProductRecommendations(product.id, "RELATED", countryCode).catch(
      () => [],
    ),
  ]);

  return (
    <>
      <main className={styles.page}>
        <ProductPageClient product={product} />

        {complementary.length > 0 && (
          <ProductRail
            title="Complete the look"
            products={complementary}
            viewAllHref="/indexes/products"
          />
        )}

        {related.length > 0 && (
          <ProductRail
            title="Related products"
            products={related}
            viewAllHref="/indexes/products"
          />
        )}
      </main>
      <Footer />
    </>
  );
}
