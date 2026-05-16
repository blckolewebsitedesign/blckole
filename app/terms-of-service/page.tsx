import { Footer } from "components/footer";
import { getShopPolicies } from "lib/shopify";
import type { Metadata } from "next";
import styles from "../privacy-policy/page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const policies = await getShopPolicies();
  const title = policies.termsOfService?.title ?? "Terms of Service";

  return {
    title,
    description: `${title} for BLCKOLE store.`,
  };
}

export default async function TermsOfServicePage() {
  const policies = await getShopPolicies();
  const policy = policies.termsOfService;

  if (!policy) {
    return (
      <>
        <main className={styles.page}>
          <div className={styles.container}>
            <h1 className={styles.heading}>Terms of Service</h1>
            <p className={styles.empty}>
              No terms of service have been published yet.
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <main className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.heading}>{policy.title}</h1>
          <article
            className={styles.body}
            dangerouslySetInnerHTML={{ __html: policy.body }}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
