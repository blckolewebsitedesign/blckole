import { Footer } from "components/footer";
import {
  type CustomerAccountOrder,
  getCustomerAccountProfile,
  isCustomerAccountConfigured,
} from "lib/customer-account";
import { formatMoney } from "lib/money";
import Link from "next/link";
import { buyAgain } from "./actions";
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

function getReturnHref(order: CustomerAccountOrder) {
  const subject = encodeURIComponent(`Return request for ${order.name}`);
  const body = encodeURIComponent(
    [
      `Order: ${order.name}`,
      "",
      "Items to return:",
      order.lineItems
        .filter((item) => item.refundableQuantity > 0)
        .map((item) => `- ${item.name} (${item.refundableQuantity} available)`)
        .join("\n"),
      "",
      "Reason:",
    ].join("\n"),
  );

  return `mailto:support@blckole.com?subject=${subject}&body=${body}`;
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ auth?: string; cart?: string }>;
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
              {params?.auth === "signed_out" ? (
                <p className={styles.notice}>You have been signed out.</p>
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
                  {params?.cart === "updated" ? (
                    <p className={styles.notice}>
                      Items were added to your cart. Open the cart from the
                      header to review them.
                    </p>
                  ) : null}
                  {params?.cart === "unavailable" ? (
                    <p className={styles.notice}>
                      This order has no reorderable variants.
                    </p>
                  ) : null}
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
                    const reorderableItems = order.lineItems.filter(
                      (item) => item.variantId,
                    );
                    const returnable = order.lineItems.some(
                      (item) => item.refundableQuantity > 0,
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
                            <form action={buyAgain}>
                              {reorderableItems.map((item) => (
                                <input
                                  key={item.variantId}
                                  type="hidden"
                                  name="variantId"
                                  value={item.variantId ?? ""}
                                />
                              ))}
                              {reorderableItems.map((item) => (
                                <input
                                  key={`${item.variantId}-quantity`}
                                  type="hidden"
                                  name="quantity"
                                  value={item.quantity}
                                />
                              ))}
                              <button
                                type="submit"
                                className={styles.actionButton}
                                disabled={reorderableItems.length === 0}
                              >
                                Buy again
                              </button>
                            </form>
                            {returnable ? (
                              <a
                                href={getReturnHref(order)}
                                className={styles.textLink}
                              >
                                Request return
                              </a>
                            ) : (
                              <span className={styles.mutedAction}>
                                Return unavailable
                              </span>
                            )}
                            {tracking?.url ? (
                              <a
                                href={tracking.url}
                                className={styles.textLink}
                              >
                                Track package
                              </a>
                            ) : null}
                          </div>
                        </div>
                        <details className={styles.statusDetails}>
                          <summary>Order status</summary>
                          <dl className={styles.statusGrid}>
                            <div>
                              <dt>Payment</dt>
                              <dd>{cleanStatus(order.financialStatus)}</dd>
                            </div>
                            <div>
                              <dt>Fulfillment</dt>
                              <dd>{cleanStatus(order.fulfillmentStatus)}</dd>
                            </div>
                            <div>
                              <dt>Tracking</dt>
                              <dd>
                                {tracking?.number ||
                                  tracking?.company ||
                                  "Not available yet"}
                              </dd>
                            </div>
                          </dl>
                        </details>
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
