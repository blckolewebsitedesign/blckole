import { Footer } from "components/footer";
import { getSelectedCountryCode } from "lib/currency-server";
import { getProducts } from "lib/shopify";
import styles from "./page.module.css";
import { ShopGrid } from "./shop-grid";

export const metadata = {
  title: "Shop",
  description: "The full line — denim, tops, and layers.",
};

export default async function ProductsIndexPage(props: {
  searchParams?: Promise<{ currency?: string }>;
}) {
  const searchParams = await props.searchParams;
  const countryCode = await getSelectedCountryCode(searchParams?.currency);
  const products = await getProducts({ countryCode }).catch(() => []);

  return (
    <>
      <main className={styles.page}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Shop</p>
          <h1 className={styles.headline}>The full line</h1>
          <p className={styles.dek}>
            Denim, tops, and layers — built to hold attention without asking for
            it.
          </p>
        </header>

        <ShopGrid products={products} />
      </main>

      <Footer />
    </>
  );
}
