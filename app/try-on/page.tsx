import { Footer } from "components/footer";
import { TryOnShell } from "components/tryon/TryOnShell";
import { getSelectedCountryCode } from "lib/currency-server";
import { getTryOnProducts } from "lib/shopify/tryOnProducts";

export const metadata = {
  title: "Virtual Try-On",
  description: "Style BLCKOLE pieces on a 3D avatar.",
};

export const dynamic = "force-dynamic";

export default async function TryOnPage(props: {
  searchParams?: Promise<{ currency?: string }>;
}) {
  const searchParams = await props.searchParams;
  const countryCode = await getSelectedCountryCode(searchParams?.currency);
  const products = await getTryOnProducts(countryCode).catch((error) => {
    console.error("[try-on] Unable to fetch try-on products", error);
    return [];
  });

  return (
    <>
      <TryOnShell products={products} />
      <Footer />
    </>
  );
}
