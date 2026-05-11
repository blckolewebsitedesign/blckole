import { Footer } from "components/footer";
import {
  type CustomerAccountOrder,
  getCustomerAccountProfile,
  isCustomerAccountConfigured,
} from "lib/customer-account";
import { formatMoney } from "lib/money";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata = {
  title: "Profile",
  description: "View your customer account, orders, and order status.",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function cleanStatus(value?: string | null) {
  if (!value) return "In progress";

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getTracking(order: CustomerAccountOrder) {
  return order.fulfillments
    .flatMap((fulfillment) => fulfillment.trackingInformation)
    .find((tracking) => tracking.number || tracking.url);
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ auth?: string }>;
}) {
  const params = await searchParams;
  const configured = isCustomerAccountConfigured();
  const profile = configured ? await getCustomerAccountProfile() : null;
  const orders = profile?.orders ?? [];
  const activeOrders = orders.filter(
    (order) => order.fulfillmentStatus !== "FULFILLED",
  ).length;

  return (
    <>
      <main className={styles.page}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Profile</p>
          <h1 className={styles.headline}>Your order archive</h1>
          <p className={styles.dek}>
            A BLCKOLE account space for previous orders, shipment progress, and
            profile details, powered by Shopify email OTP sign-in.
          </p>
        </header>

        {!profile ? (
          <section className={styles.signInPanel}>
            <div>
              <p className={styles.panelLabel}>Customer account</p>
              <h2 className={styles.sectionTitle}>Sign in with email OTP</h2>
              <p className={styles.bodyText}>
                We keep the login secure through Shopify, then bring you back
                here to this custom BLCKOLE profile theme.
              </p>
              {!configured ? (
                <p className={styles.notice}>
                  Add the Customer Account API client ID in environment
                  variables to activate OTP login.
                </p>
              ) : null}
              {params?.auth === "failed" ? (
                <p className={styles.notice}>
                  Sign-in did not complete. Try the OTP flow again.
                </p>
              ) : null}
            </div>

            <Link
              href={configured ? "/api/customer-account/login" : "#"}
              className={styles.primaryButton}
              aria-disabled={!configured}
            >
              Continue with email
            </Link>
          </section>
        ) : (
          <section className={styles.dashboard}>
            <aside className={styles.profilePanel}>
              <div className={styles.avatar} aria-hidden="true">
                {profile.displayName.charAt(0)}
              </div>
              <div>
                <p className={styles.panelLabel}>Signed in as</p>
                <h2 className={styles.profileName}>{profile.displayName}</h2>
                <p className={styles.profileMeta}>
                  {profile.emailAddress?.emailAddress || "Email unavailable"}
                </p>
              </div>

              <dl className={styles.statsGrid}>
                <div>
                  <dt>Total orders</dt>
                  <dd>{orders.length}</dd>
                </div>
                <div>
                  <dt>Active</dt>
                  <dd>{activeOrders}</dd>
                </div>
                <div>
                  <dt>Delivered</dt>
                  <dd>{orders.length - activeOrders}</dd>
                </div>
              </dl>

              <div className={styles.addressBlock}>
                <p className={styles.panelLabel}>Default address</p>
                <p className={styles.bodyText}>
                  {profile.defaultAddress?.formatted?.join(", ") ||
                    "No default address saved yet."}
                </p>
              </div>

              <Link
                href="/api/customer-account/logout"
                className={styles.secondaryButton}
              >
                Sign out
              </Link>
            </aside>

            <div className={styles.ordersPanel}>
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.panelLabel}>Previous orders</p>
                  <h2 className={styles.sectionTitle}>Order history</h2>
                </div>
              </div>

              {orders.length === 0 ? (
                <p className={styles.emptyState}>
                  No orders are connected to this account yet.
                </p>
              ) : (
                <div className={styles.orderList}>
                  {orders.map((order) => {
                    const tracking = getTracking(order);
                    const status = cleanStatus(
                      tracking?.number
                        ? tracking.company || "Tracking active"
                        : order.fulfillmentStatus || order.financialStatus,
                    );

                    return (
                      <article key={order.id} className={styles.orderCard}>
                        <div className={styles.orderHeader}>
                          <div>
                            <p className={styles.orderId}>{order.name}</p>
                            <p className={styles.orderDate}>
                              {formatDate(order.processedAt)}
                            </p>
                          </div>
                          <p className={styles.orderTotal}>
                            {formatMoney({
                              amount: order.totalPrice.amount,
                              currencyCode: order.totalPrice.currencyCode,
                            })}
                          </p>
                        </div>

                        <div className={styles.orderBody}>
                          <div>
                            <p className={styles.statusPill}>{status}</p>
                            <p className={styles.bodyText}>
                              {order.lineItems
                                .map((item) => `${item.quantity}x ${item.name}`)
                                .join(" / ")}
                            </p>
                          </div>
                          <div className={styles.orderActions}>
                            {tracking?.url ? (
                              <a
                                href={tracking.url}
                                className={styles.textLink}
                              >
                                Track package
                              </a>
                            ) : null}
                            <a
                              href={order.statusPageUrl}
                              className={styles.textLink}
                            >
                              Order status
                            </a>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
