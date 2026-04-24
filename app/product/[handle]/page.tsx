import { AddToCart } from "components/cart/add-to-cart";
import { Footer } from "components/footer";
import { ProductCard } from "components/product-card";
import { ProductGallery } from "components/product-gallery";
import { ProductOption } from "components/product-option";
import { HIDDEN_PRODUCT_TAG } from "lib/constants";
import { getProduct, getProductRecommendations } from "lib/shopify";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import styles from "./page.module.css";

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

  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: product.priceRange.minVariantPrice.currencyCode,
    minimumFractionDigits: 0,
  }).format(Number(product.priceRange.minVariantPrice.amount));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.featuredImage?.url,
    offers: {
      "@type": "AggregateOffer",
      availability: product.availableForSale
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      priceCurrency: product.priceRange.minVariantPrice.currencyCode,
      highPrice: product.priceRange.maxVariantPrice.amount,
      lowPrice: product.priceRange.minVariantPrice.amount,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className={styles.page}>
        {/* Left: gallery */}
        <div className={styles.gallery}>
          <ProductGallery images={product.images} title={product.title} />
        </div>

        {/* Right: product info — sticky on desktop */}
        <aside className={styles.info}>
          <div className={styles.infoInner}>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{product.title}</h1>
              <span className={styles.price}>{price}</span>
            </div>

            {/* Variant options (size, etc.) */}
            {product.options
              .filter((opt) => opt.name.toLowerCase() !== "color")
              .map((opt) => (
                <Suspense key={opt.id} fallback={null}>
                  <ProductOption
                    name={opt.name}
                    values={opt.values.map((v) => ({
                      value: v,
                      available: product.variants.some(
                        (variant) =>
                          variant.selectedOptions.some(
                            (o) => o.name === opt.name && o.value === v,
                          ) && variant.availableForSale,
                      ),
                    }))}
                  />
                </Suspense>
              ))}

            <Suspense fallback={null}>
              <AddToCart product={product} />
            </Suspense>

            {product.description && (
              <div className={styles.description}>
                <p>{product.description}</p>
              </div>
            )}

            <div className={styles.meta}>
              {product.tags.includes("made-in-france") && (
                <span className={styles.metaTag}>Made in France</span>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Related / shop the look */}
      <Suspense fallback={null}>
        <RelatedProducts id={product.id} />
      </Suspense>

      <Footer />
    </>
  );
}

async function RelatedProducts({ id }: { id: string }) {
  const related = await getProductRecommendations(id).catch(() => []);
  if (!related.length) return null;

  return (
    <section className={styles.related}>
      <h2 className={styles.relatedTitle}>Shop the Look</h2>
      <div className={styles.relatedGrid}>
        {related.slice(0, 4).map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
      </div>
    </section>
  );
}
