export const CURRENCY_COUNTRY_COOKIE = "currencyCountry";
export const SHOPIFY_CHECKOUT_COUNTRY = "IN";

export type SupportedCurrencyCode = "USD" | "INR";
export type SupportedCountryCode = "US" | "IN";

export type CurrencyMarket = {
  currencyCode: SupportedCurrencyCode;
  countryCode: SupportedCountryCode;
  label: string;
  locale: string;
};

export const CURRENCY_MARKETS = [
  { currencyCode: "INR", countryCode: "IN", label: "INR", locale: "en-IN" },
  { currencyCode: "USD", countryCode: "US", label: "USD", locale: "en-US" },
] as const satisfies readonly CurrencyMarket[];

export const DEFAULT_CURRENCY_MARKET = CURRENCY_MARKETS[0];

export function isSupportedCountryCode(
  value: string | undefined,
): value is SupportedCountryCode {
  return CURRENCY_MARKETS.some((market) => market.countryCode === value);
}

export function isSupportedCurrencyCode(
  value: string | undefined,
): value is SupportedCurrencyCode {
  return CURRENCY_MARKETS.some((market) => market.currencyCode === value);
}

export function getMarketByCountry(
  countryCode: string | undefined,
): CurrencyMarket {
  return (
    CURRENCY_MARKETS.find((market) => market.countryCode === countryCode) ??
    DEFAULT_CURRENCY_MARKET
  );
}

export function getMarketByCurrencyOrCountry(
  value: string | undefined,
): CurrencyMarket {
  const normalized = value?.toUpperCase();

  return (
    CURRENCY_MARKETS.find(
      (market) =>
        market.currencyCode === normalized || market.countryCode === normalized,
    ) ?? DEFAULT_CURRENCY_MARKET
  );
}

export function getMarketByCurrency(
  currencyCode: string | undefined,
): CurrencyMarket | undefined {
  return CURRENCY_MARKETS.find(
    (market) => market.currencyCode === currencyCode,
  );
}
