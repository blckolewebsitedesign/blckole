import {
  CURRENCY_COUNTRY_COOKIE,
  DEFAULT_CURRENCY_MARKET,
  getMarketByCountry,
  getMarketByCurrencyOrCountry,
  isSupportedCountryCode,
  type CurrencyMarket,
  type SupportedCountryCode,
} from "lib/currency";
import { cookies } from "next/headers";

export async function getSelectedCurrencyMarket(
  currencyOrCountry?: string,
): Promise<CurrencyMarket> {
  if (currencyOrCountry) {
    return getMarketByCurrencyOrCountry(currencyOrCountry);
  }

  const countryCode = (await cookies()).get(CURRENCY_COUNTRY_COOKIE)?.value;
  return getMarketByCountry(countryCode);
}

export async function getSelectedCountryCode(
  currencyOrCountry?: string,
): Promise<SupportedCountryCode> {
  if (currencyOrCountry) {
    return getMarketByCurrencyOrCountry(currencyOrCountry).countryCode;
  }

  const countryCode = (await cookies()).get(CURRENCY_COUNTRY_COOKIE)?.value;
  return isSupportedCountryCode(countryCode)
    ? countryCode
    : DEFAULT_CURRENCY_MARKET.countryCode;
}
