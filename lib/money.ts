import {
  DEFAULT_CURRENCY_MARKET,
  getMarketByCurrency,
  isSupportedCurrencyCode,
  type SupportedCurrencyCode,
} from "lib/currency";

const INR_PER_CURRENCY: Record<SupportedCurrencyCode, number> = {
  INR: 1,
  USD: 95,
};

function getFractionDigits(currencyCode: string) {
  return currencyCode === "INR" ? 0 : 2;
}

export function convertMoneyAmount({
  amount,
  fromCurrency,
  toCurrency,
}: {
  amount: string | number;
  fromCurrency: string;
  toCurrency: SupportedCurrencyCode;
}) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) return 0;
  if (fromCurrency === toCurrency) return numericAmount;
  if (!isSupportedCurrencyCode(fromCurrency)) return numericAmount;

  const amountInInr = numericAmount * INR_PER_CURRENCY[fromCurrency];
  return amountInInr / INR_PER_CURRENCY[toCurrency];
}

export function formatMoney({
  amount,
  currencyCode,
  displayCurrencyCode,
}: {
  amount: string | number;
  currencyCode: string;
  displayCurrencyCode?: SupportedCurrencyCode;
}) {
  const targetCurrency =
    displayCurrencyCode ??
    (isSupportedCurrencyCode(currencyCode)
      ? currencyCode
      : DEFAULT_CURRENCY_MARKET.currencyCode);
  const convertedAmount = convertMoneyAmount({
    amount,
    fromCurrency: currencyCode,
    toCurrency: targetCurrency,
  });

  const market = getMarketByCurrency(targetCurrency) ?? DEFAULT_CURRENCY_MARKET;

  return new Intl.NumberFormat(market.locale, {
    style: "currency",
    currency: targetCurrency,
    minimumFractionDigits: getFractionDigits(targetCurrency),
    maximumFractionDigits: getFractionDigits(targetCurrency),
  }).format(convertedAmount);
}
