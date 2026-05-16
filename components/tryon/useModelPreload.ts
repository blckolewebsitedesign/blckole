"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";

type Options = {
  priorityUrls: string[];
  deferredUrls?: string[];
  idleDelayMs?: number;
};

function dedupe(urls: string[]) {
  return Array.from(new Set(urls.filter(Boolean)));
}

/**
 * Loads critical GLBs immediately and warms the rest in idle time. Keeps the
 * first paint cheap while still ensuring later product switches never wait
 * on the network.
 */
export function useModelPreload({
  priorityUrls,
  deferredUrls = [],
  idleDelayMs = 600,
}: Options) {
  useEffect(() => {
    const urls = dedupe(priorityUrls);
    for (const url of urls) {
      try {
        useGLTF.preload(url);
      } catch (error) {
        console.warn("[try-on] Failed to preload priority GLB", url, error);
      }
    }
  }, [priorityUrls]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    const urls = dedupe(deferredUrls).filter(
      (url) => !priorityUrls.includes(url),
    );
    if (urls.length === 0) return;

    const run = () => {
      if (cancelled) return;
      // Stagger preloads so we don't open dozens of HTTP connections at once.
      urls.forEach((url, index) => {
        window.setTimeout(() => {
          if (cancelled) return;
          try {
            useGLTF.preload(url);
          } catch (error) {
            console.warn("[try-on] Failed to preload deferred GLB", url, error);
          }
        }, index * 80);
      });
    };

    const idle = (
      window as typeof window & {
        requestIdleCallback?: (
          cb: () => void,
          opts?: { timeout: number },
        ) => number;
        cancelIdleCallback?: (handle: number) => void;
      }
    ).requestIdleCallback;

    if (idle) {
      const handle = idle(run, { timeout: idleDelayMs + 1500 });
      return () => {
        cancelled = true;
        (
          window as typeof window & {
            cancelIdleCallback?: (handle: number) => void;
          }
        ).cancelIdleCallback?.(handle);
      };
    }

    const timer = window.setTimeout(run, idleDelayMs);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [deferredUrls, idleDelayMs, priorityUrls]);
}
