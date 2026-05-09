"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  CURRENCY_MARKETS,
  getMarketByCurrencyOrCountry,
  type CurrencyMarket,
  type SupportedCountryCode,
} from "lib/currency";
import { selectCurrency } from "./currency-actions";
import styles from "./index.module.css";

type Props = {
  activeMarket?: CurrencyMarket;
  markets?: readonly CurrencyMarket[];
};

export function CurrencySelector({
  activeMarket = CURRENCY_MARKETS[0],
  markets = CURRENCY_MARKETS,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [activeCountry, setActiveCountry] = useState(activeMarket.countryCode);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const currencyParam = searchParams.get("currency");
  const activeCurrency =
    markets.find((market) => market.countryCode === activeCountry) ??
    activeMarket;

  useEffect(() => {
    setActiveCountry(
      currencyParam
        ? getMarketByCurrencyOrCountry(currencyParam).countryCode
        : activeMarket.countryCode,
    );
  }, [activeMarket.countryCode, currencyParam]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function pick(countryCode: SupportedCountryCode) {
    const market = markets.find((item) => item.countryCode === countryCode);
    setActiveCountry(countryCode);
    setOpen(false);
    startTransition(async () => {
      const result = await selectCurrency(countryCode);
      if (!result.ok) return;
      const params = new URLSearchParams(searchParams.toString());

      if (market) {
        params.set("currency", market.currencyCode);
      }

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      router.refresh();
    });
  }

  return (
    <div className={styles.currencySelector} ref={wrapperRef}>
      <button
        type="button"
        className={styles.currencyTrigger}
        disabled={isPending}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Select currency"
        onClick={() => setOpen((value) => !value)}
      >
        <span>{activeCurrency.label}</span>
        <span className={styles.currencyChevron} aria-hidden="true">
          ▾
        </span>
      </button>

      {open ? (
        <div className={styles.currencyMenu} role="menu">
          {markets.map((market) => {
            const active = market.countryCode === activeCountry;

            return (
              <button
                key={market.countryCode}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                className={`${styles.currencyOption} ${
                  active ? styles.currencyOptionActive : ""
                }`}
                onClick={() => pick(market.countryCode)}
              >
                <span>{market.label}</span>
                <span className={styles.currencyCountry}>
                  {market.countryCode}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
