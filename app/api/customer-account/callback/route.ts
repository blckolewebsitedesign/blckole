import {
  CUSTOMER_AUTH_RETURN_COOKIE,
  CUSTOMER_AUTH_REDIRECT_URI_COOKIE,
  CUSTOMER_AUTH_STATE_COOKIE,
  CUSTOMER_AUTH_VERIFIER_COOKIE,
  exchangeCustomerCode,
  saveCustomerTokens,
} from "lib/customer-account";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(CUSTOMER_AUTH_STATE_COOKIE)?.value;
  const verifier = cookieStore.get(CUSTOMER_AUTH_VERIFIER_COOKIE)?.value;
  const returnTo =
    cookieStore.get(CUSTOMER_AUTH_RETURN_COOKIE)?.value || "/profile";

  if (
    !code ||
    !state ||
    !expectedState ||
    state !== expectedState ||
    !verifier
  ) {
    return NextResponse.redirect(new URL("/profile?auth=failed", request.url));
  }

  try {
    const tokens = await exchangeCustomerCode(code, verifier);
    await saveCustomerTokens(tokens);
  } catch {
    return NextResponse.redirect(new URL("/profile?auth=failed", request.url));
  }

  [
    CUSTOMER_AUTH_STATE_COOKIE,
    CUSTOMER_AUTH_VERIFIER_COOKIE,
    CUSTOMER_AUTH_RETURN_COOKIE,
    CUSTOMER_AUTH_REDIRECT_URI_COOKIE,
  ].forEach((name) => cookieStore.delete(name));

  return NextResponse.redirect(new URL(returnTo, request.url));
}
