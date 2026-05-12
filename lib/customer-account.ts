import {
  CUSTOMER_ACCOUNT_CLIENT_ID,
  CUSTOMER_ACCOUNT_CLIENT_SECRET,
  CUSTOMER_ACCOUNT_DOMAIN,
  CUSTOMER_ACCOUNT_REDIRECT_URI,
} from "lib/constants";
import { baseUrl } from "lib/utils";
import { cookies, headers } from "next/headers";
import { createHash, randomBytes } from "node:crypto";

export const CUSTOMER_ACCESS_TOKEN_COOKIE = "customerAccountAccessToken";
export const CUSTOMER_REFRESH_TOKEN_COOKIE = "customerAccountRefreshToken";
export const CUSTOMER_ID_TOKEN_COOKIE = "customerAccountIdToken";
export const CUSTOMER_AUTH_STATE_COOKIE = "customerAccountAuthState";
export const CUSTOMER_AUTH_NONCE_COOKIE = "customerAccountAuthNonce";
export const CUSTOMER_AUTH_VERIFIER_COOKIE = "customerAccountAuthVerifier";
export const CUSTOMER_AUTH_RETURN_COOKIE = "customerAccountAuthReturn";
export const CUSTOMER_AUTH_REDIRECT_URI_COOKIE = "customerAccountRedirectUri";

type DiscoveryConfig = {
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint?: string;
};

type ApiDiscoveryConfig = {
  graphql_api: string;
};

export type CustomerAccountLineItem = {
  title: string;
  name: string;
  quantity: number;
  variantId?: string | null;
  refundableQuantity: number;
  image?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
};

export type CustomerAccountOrder = {
  id: string;
  name: string;
  number: number;
  processedAt: string;
  financialStatus?: string | null;
  fulfillmentStatus?: string | null;
  statusPageUrl: string;
  totalPrice: {
    amount: string;
    currencyCode: string;
  };
  shippingAddress?: {
    formattedArea?: string | null;
    formatted: string[];
  } | null;
  lineItems: CustomerAccountLineItem[];
  fulfillments: {
    latestShipmentStatus?: string | null;
    trackingInformation: {
      company?: string | null;
      number?: string | null;
      url?: string | null;
    }[];
  }[];
};

export type CustomerAccountProfile = {
  id: string;
  displayName: string;
  firstName?: string | null;
  lastName?: string | null;
  emailAddress?: {
    emailAddress?: string | null;
  } | null;
  defaultAddress?: {
    formattedArea?: string | null;
    formatted: string[];
  } | null;
  orders: CustomerAccountOrder[];
};

function cookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(maxAge ? { maxAge } : {}),
  };
}

export function isCustomerAccountConfigured() {
  return Boolean(CUSTOMER_ACCOUNT_DOMAIN && CUSTOMER_ACCOUNT_CLIENT_ID);
}

export function getCustomerAccountRedirectUri(origin?: string) {
  return (
    CUSTOMER_ACCOUNT_REDIRECT_URI ||
    `${origin || baseUrl}/api/customer-account/callback`
  );
}

export function randomUrlSafeString() {
  return randomBytes(32).toString("base64url");
}

export function createCodeChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

function normalizeDomain(domain: string) {
  return domain
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .trim();
}

function uniqueDomains(domains: string[]) {
  return Array.from(new Set(domains.map(normalizeDomain).filter(Boolean)));
}

function getCustomerAccountDiscoveryDomains() {
  const configuredDomain = normalizeDomain(CUSTOMER_ACCOUNT_DOMAIN);
  const shopDomain = normalizeDomain(process.env.SHOPIFY_STORE_DOMAIN || "");
  const fallbackAccountDomain =
    configuredDomain && !configuredDomain.startsWith("account.")
      ? `account.${configuredDomain}`
      : "";

  return uniqueDomains([configuredDomain, fallbackAccountDomain, shopDomain]);
}

async function discoverJson<T>(pathname: string) {
  const domains = getCustomerAccountDiscoveryDomains();
  const failures: string[] = [];

  for (const domain of domains) {
    const url = `https://${domain}${pathname}`;
    const res = await fetch(url, { cache: "no-store" }).catch((error) => {
      failures.push(
        `${url} (${error instanceof Error ? error.message : "network error"})`,
      );
      return null;
    });

    if (res?.ok) {
      return res.json() as Promise<T>;
    }

    if (res) {
      failures.push(`${url} (${res.status})`);
    }
  }

  throw new Error(
    `Unable to discover Shopify customer endpoint ${pathname}. Tried: ${failures.join(", ") || domains.join(", ")}`,
  );
}

export async function discoverCustomerAuth() {
  return discoverJson<DiscoveryConfig>("/.well-known/openid-configuration");
}

export async function discoverCustomerApi() {
  return discoverJson<ApiDiscoveryConfig>("/.well-known/customer-account-api");
}

export async function exchangeCustomerCode(code: string, verifier: string) {
  const redirectUri =
    (await cookies()).get(CUSTOMER_AUTH_REDIRECT_URI_COOKIE)?.value ||
    getCustomerAccountRedirectUri();
  const config = await discoverCustomerAuth();
  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("client_id", CUSTOMER_ACCOUNT_CLIENT_ID);
  body.set("redirect_uri", redirectUri);
  body.set("code", code);
  body.set("code_verifier", verifier);

  const requestHeaders = new Headers({
    "content-type": "application/x-www-form-urlencoded",
    origin: baseUrl,
    "user-agent": "BLCKOLE Storefront",
  });

  if (CUSTOMER_ACCOUNT_CLIENT_SECRET) {
    const credentials = Buffer.from(
      `${CUSTOMER_ACCOUNT_CLIENT_ID}:${CUSTOMER_ACCOUNT_CLIENT_SECRET}`,
    ).toString("base64");
    requestHeaders.set("authorization", `Basic ${credentials}`);
  }

  const res = await fetch(config.token_endpoint, {
    method: "POST",
    headers: requestHeaders,
    body,
  });

  if (!res.ok) {
    throw new Error("Unable to exchange Shopify customer authorization code.");
  }

  return res.json() as Promise<{
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    id_token?: string;
  }>;
}

export async function saveCustomerTokens(tokens: {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
}) {
  const cookieStore = await cookies();
  cookieStore.set(
    CUSTOMER_ACCESS_TOKEN_COOKIE,
    tokens.access_token,
    cookieOptions(tokens.expires_in),
  );

  if (tokens.refresh_token) {
    cookieStore.set(
      CUSTOMER_REFRESH_TOKEN_COOKIE,
      tokens.refresh_token,
      cookieOptions(60 * 60 * 24 * 30),
    );
  }

  if (tokens.id_token) {
    cookieStore.set(
      CUSTOMER_ID_TOKEN_COOKIE,
      tokens.id_token,
      cookieOptions(tokens.expires_in),
    );
  }
}

export async function clearCustomerSession() {
  const cookieStore = await cookies();
  [
    CUSTOMER_ACCESS_TOKEN_COOKIE,
    CUSTOMER_REFRESH_TOKEN_COOKIE,
    CUSTOMER_ID_TOKEN_COOKIE,
    CUSTOMER_AUTH_STATE_COOKIE,
    CUSTOMER_AUTH_NONCE_COOKIE,
    CUSTOMER_AUTH_VERIFIER_COOKIE,
    CUSTOMER_AUTH_RETURN_COOKIE,
    CUSTOMER_AUTH_REDIRECT_URI_COOKIE,
  ].forEach((name) => cookieStore.delete(name));
}

export async function getCustomerAccessToken() {
  return (await cookies()).get(CUSTOMER_ACCESS_TOKEN_COOKIE)?.value;
}

export async function getCustomerIdToken() {
  return (await cookies()).get(CUSTOMER_ID_TOKEN_COOKIE)?.value;
}

const customerProfileQuery = /* GraphQL */ `
  query CustomerProfile {
    customer {
      id
      displayName
      firstName
      lastName
      emailAddress {
        emailAddress
      }
      defaultAddress {
        formattedArea
        formatted(withName: true, withCompany: true)
      }
      orders(first: 20, reverse: true, sortKey: PROCESSED_AT) {
        edges {
          node {
            id
            name
            number
            processedAt
            financialStatus
            fulfillmentStatus
            statusPageUrl
            totalPrice {
              amount
              currencyCode
            }
            shippingAddress {
              formattedArea
              formatted(withName: true, withCompany: true)
            }
            lineItems(first: 8) {
              edges {
                node {
                  title
                  name
                  quantity
                  variantId
                  refundableQuantity
                  image {
                    url
                    altText
                    width
                    height
                  }
                }
              }
            }
            fulfillments(first: 5) {
              edges {
                node {
                  latestShipmentStatus
                  trackingInformation {
                    company
                    number
                    url
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

function nodes<T>(connection?: { edges?: { node: T }[] } | null): T[] {
  return connection?.edges?.map((edge) => edge.node) ?? [];
}

export async function getCustomerAccountProfile() {
  const accessToken = await getCustomerAccessToken();
  if (!accessToken) return null;

  const apiConfig = await discoverCustomerApi();
  const res = await fetch(apiConfig.graphql_api, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: accessToken,
    },
    body: JSON.stringify({ query: customerProfileQuery }),
    cache: "no-store",
  });

  if (!res.ok) return null;

  const body = (await res.json()) as {
    data?: {
      customer?: Omit<CustomerAccountProfile, "orders"> & {
        orders?: {
          edges?: {
            node: Omit<CustomerAccountOrder, "lineItems" | "fulfillments"> & {
              lineItems?: {
                edges?: { node: CustomerAccountLineItem }[];
              };
              fulfillments?: {
                edges?: {
                  node: CustomerAccountOrder["fulfillments"][number];
                }[];
              };
            };
          }[];
        };
      };
    };
    errors?: unknown[];
  };

  if (!body.data?.customer || body.errors?.length) return null;

  const { orders, ...customer } = body.data.customer;

  return {
    ...customer,
    orders: nodes(orders).map((order) => ({
      ...order,
      lineItems: nodes(order.lineItems),
      fulfillments: nodes(order.fulfillments),
    })),
  } satisfies CustomerAccountProfile;
}

export async function getRequestOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "https";
  return host ? `${protocol}://${host}` : baseUrl;
}
