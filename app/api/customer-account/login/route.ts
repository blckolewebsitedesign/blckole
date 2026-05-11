import {
  CUSTOMER_ACCOUNT_CLIENT_ID,
  CUSTOMER_ACCOUNT_DOMAIN,
} from "lib/constants";
import {
  CUSTOMER_AUTH_NONCE_COOKIE,
  CUSTOMER_AUTH_REDIRECT_URI_COOKIE,
  CUSTOMER_AUTH_RETURN_COOKIE,
  CUSTOMER_AUTH_STATE_COOKIE,
  CUSTOMER_AUTH_VERIFIER_COOKIE,
  createCodeChallenge,
  discoverCustomerAuth,
  getCustomerAccountRedirectUri,
  randomUrlSafeString,
} from "lib/customer-account";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  };
}

export async function GET(request: NextRequest) {
  if (!CUSTOMER_ACCOUNT_DOMAIN || !CUSTOMER_ACCOUNT_CLIENT_ID) {
    return NextResponse.redirect(new URL("/profile?auth=missing", request.url));
  }

  const authConfig = await discoverCustomerAuth();
  const state = randomUrlSafeString();
  const nonce = randomUrlSafeString();
  const verifier = randomUrlSafeString();
  const challenge = createCodeChallenge(verifier);
  const returnTo = request.nextUrl.searchParams.get("return_to") || "/profile";
  const redirectUri = getCustomerAccountRedirectUri(request.nextUrl.origin);
  const cookieStore = await cookies();

  cookieStore.set(CUSTOMER_AUTH_STATE_COOKIE, state, cookieOptions());
  cookieStore.set(CUSTOMER_AUTH_NONCE_COOKIE, nonce, cookieOptions());
  cookieStore.set(CUSTOMER_AUTH_VERIFIER_COOKIE, verifier, cookieOptions());
  cookieStore.set(CUSTOMER_AUTH_RETURN_COOKIE, returnTo, cookieOptions());
  cookieStore.set(
    CUSTOMER_AUTH_REDIRECT_URI_COOKIE,
    redirectUri,
    cookieOptions(),
  );

  const authUrl = new URL(authConfig.authorization_endpoint);
  authUrl.searchParams.set("scope", "openid email customer-account-api:full");
  authUrl.searchParams.set("client_id", CUSTOMER_ACCOUNT_CLIENT_ID);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("nonce", nonce);
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("locale", "en");
  authUrl.searchParams.set("region_country", "IN");

  return NextResponse.redirect(authUrl);
}
