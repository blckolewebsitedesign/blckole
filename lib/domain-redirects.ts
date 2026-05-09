import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const MAIN_HOST = "blckole.com";
const SHOP_HOST = "shop.blckole.com";

const CHECKOUT_PATH_PATTERNS = [
  /^\/checkouts?(?:\/|$)/i,
  /^\/cart\/c(?:\/|$)/i,
  /^\/\d+\/checkouts?(?:\/|$)/i,
];

function getHostname(request: NextRequest) {
  return request.headers.get("x-forwarded-host") ?? request.nextUrl.host;
}

function stripPort(host: string) {
  return host.split(":")[0]?.toLowerCase() ?? "";
}

export function isShopHost(request: NextRequest) {
  return stripPort(getHostname(request)) === SHOP_HOST;
}

export function isCheckoutPath(pathname: string) {
  return CHECKOUT_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
}

export function redirectShopThemeFallback(request: NextRequest) {
  if (!isShopHost(request)) return NextResponse.next();
  if (isCheckoutPath(request.nextUrl.pathname)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.hostname = MAIN_HOST;
  url.port = "";

  return NextResponse.redirect(url, 308);
}
