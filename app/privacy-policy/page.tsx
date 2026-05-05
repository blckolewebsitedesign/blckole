import { getShopPolicies } from "lib/shopify";
import type { Metadata } from "next";
import styles from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const policies = await getShopPolicies();
  const title = policies.privacyPolicy?.title ?? "Privacy Policy";

  return {
    title,
    description: `${title} for BLCKOLE store.`,
  };
}

export default async function PrivacyPolicyPage() {
  const policies = await getShopPolicies();
  const policy = policies.privacyPolicy;

  if (!policy) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.heading}>Privacy Policy</h1>
          <p className={styles.empty}>
            No privacy policy has been published yet.
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
