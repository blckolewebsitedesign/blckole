"use server";

import {
  CURRENCY_COUNTRY_COOKIE,
  getMarketByCountry,
  isSupportedCountryCode,
  type SupportedCountryCode,
} from "lib/currency";
import { cookies } from "next/headers";

export async function selectCurrency(countryCode: SupportedCountryCode) {
  if (!isSupportedCountryCode(countryCode)) {
    return { ok: false, message: "Unsupported currency market" };
  }

  const market = getMarketByCountry(countryCode);
  const cookieStore = await cookies();

  cookieStore.set(CURRENCY_COUNTRY_COOKIE, countryCode, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });

  return { ok: true, market };
}
