import { HIDDEN_PRODUCT_TAG } from "lib/constants";
import { getSelectedCountryCode } from "lib/currency-server";
import { getProduct } from "lib/shopify";
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
  searchParams?: Promise<{ currency?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const countryCode = await getSelectedCountryCode(searchParams?.currency);
  const product = await getProduct(params.slug, countryCode);
  if (!product) return notFound();
  return null;
}
