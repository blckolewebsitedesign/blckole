"use client";

import {
  getMarketByCurrencyOrCountry,
  isSupportedCurrencyCode,
  type SupportedCurrencyCode,
} from "lib/currency";
import { formatMoney } from "lib/money";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

function getCurrencyFromSearchParam(
  value: string | null,
): SupportedCurrencyCode | undefined {
  if (!value) return undefined;

  const normalized = value.toUpperCase();
  if (isSupportedCurrencyCode(normalized)) return normalized;

  return getMarketByCurrencyOrCountry(normalized).currencyCode;
}

export function useDisplayMoney() {
  const searchParams = useSearchParams();
  const currencyParam = searchParams.get("currency");
  const displayCurrencyCode = useMemo(
    () => getCurrencyFromSearchParam(currencyParam),
    [currencyParam],
  );

  return useCallback(
    (amount: string | number, currencyCode: string) =>
      formatMoney({ amount, currencyCode, displayCurrencyCode }),
    [displayCurrencyCode],
  );
}
