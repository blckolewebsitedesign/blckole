import { getShopPolicies } from "lib/shopify";
import type { Metadata } from "next";
import styles from "../privacy-policy/page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const policies = await getShopPolicies();
  const title = policies.shippingPolicy?.title ?? "Shipping Policy";

  return {
    title,
    description: `${title} for BLCKOLE store.`,
  };
}

export default async function ShippingPolicyPage() {
  const policies = await getShopPolicies();
  const policy = policies.shippingPolicy;

  if (!policy) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.heading}>Shipping Policy</h1>
          <p className={styles.empty}>
            No shipping policy has been published yet.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>{policy.title}</h1>
        <article
          className={styles.body}
          dangerouslySetInnerHTML={{ __html: policy.body }}
        />
      </div>
    </main>
  );
}
