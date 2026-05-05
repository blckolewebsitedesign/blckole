import { Footer } from "components/footer";
import { ProductRail } from "components/product-rail";
import { HIDDEN_PRODUCT_TAG } from "lib/constants";
import { getProduct, getProductRecommendations } from "lib/shopify";
import type { Metadata } from "next";
import Link from "next/link";
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
}) {
  const params = await props.params;
  const product = await getProduct(params.handle);
  if (!product) return notFound();

  const [complementary, related] = await Promise.all([
    getProductRecommendations(product.id, "COMPLEMENTARY").catch(() => []),
    getProductRecommendations(product.id, "RELATED").catch(() => []),
  ]);

  const breadcrumbMid =
    product.productType?.trim() ||
    product.tags.find((t) => !t.startsWith("nextjs-")) ||
    "Shop";

  return (
    <>
      <main className={styles.page}>
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          <Link href="/" className={styles.crumbLink}>
            Home
          </Link>
          <span className={styles.crumbSep} aria-hidden="true">
            ›
          </span>
          <span className={styles.crumbMid}>{breadcrumbMid}</span>
          <span className={styles.crumbSep} aria-hidden="true">
            ›
          </span>
          <span className={styles.crumbCurrent}>{product.title}</span>
        </nav>

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
