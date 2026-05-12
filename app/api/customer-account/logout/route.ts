import {
  clearCustomerSession,
  discoverCustomerAuth,
  getCustomerIdToken,
} from "lib/customer-account";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const idToken = await getCustomerIdToken();
  await clearCustomerSession();

  if (idToken) {
    const authConfig = await discoverCustomerAuth().catch(() => null);

    if (authConfig?.end_session_endpoint) {
      const logoutUrl = new URL(authConfig.end_session_endpoint);
      logoutUrl.searchParams.set("id_token_hint", idToken);
      logoutUrl.searchParams.set(
        "post_logout_redirect_uri",
        new URL("/profile", request.url).toString(),
      );

      return NextResponse.redirect(logoutUrl);
    }
  }

  return NextResponse.redirect(new URL("/profile", request.url));
}
