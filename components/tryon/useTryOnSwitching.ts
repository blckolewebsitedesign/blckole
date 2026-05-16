"use client";

import { useCallback, useRef, useState } from "react";

export type SwitchType = "topwear" | "bottomwear";

type PendingMap = Partial<Record<SwitchType, string>>;

type Options = {
  cooldownMs?: number;
};

/**
 * Single source of truth for "can the user change this category right now?".
 *
 * Both wheel scrolling and arrow / direct clicks ask `tryStart` before they
 * mutate selection. While a switch is in flight (`pending[type]` is the new
 * product id) we ignore extra requests; we also enforce a short cooldown after
 * a switch finishes so a 20x-per-second wheel never queues 20 swaps.
 */
export function useTryOnSwitching({ cooldownMs = 340 }: Options = {}) {
  const [pending, setPending] = useState<PendingMap>({});
  const lastStartedRef = useRef<Record<SwitchType, number>>({
    topwear: 0,
    bottomwear: 0,
  });

  const canSwitch = useCallback(
    (type: SwitchType) => {
      if (pending[type]) return false;
      if (performance.now() - lastStartedRef.current[type] < cooldownMs) {
        return false;
      }
      return true;
    },
    [cooldownMs, pending],
  );

  const tryStart = useCallback(
    (type: SwitchType, productId: string) => {
      if (!canSwitch(type)) return false;
      lastStartedRef.current[type] = performance.now();
      setPending((prev) => ({ ...prev, [type]: productId }));
      return true;
    },
    [canSwitch],
  );

  const finish = useCallback((type: SwitchType, productId: string) => {
    setPending((prev) => {
      if (prev[type] !== productId) return prev;
      const next = { ...prev };
      delete next[type];
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setPending({});
    lastStartedRef.current = { topwear: 0, bottomwear: 0 };
  }, []);

  return { pending, canSwitch, tryStart, finish, reset };
}
