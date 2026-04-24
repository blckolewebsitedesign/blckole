import { BottomBar } from "components/bottom-bar";
import { Footer } from "components/footer";
import { ScrollStage } from "components/scroll-stage";
import { getCollectionProducts, getProducts } from "lib/shopify";

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

  return (
    <>
      <ScrollStage products={products} />
      <BottomBar count={products.length} />
      <Footer />
    </>
  );
}
