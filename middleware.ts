import type { NextRequest } from "next/server";
import { redirectShopThemeFallback } from "lib/domain-redirects";

export function middleware(request: NextRequest) {
  return redirectShopThemeFallback(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
