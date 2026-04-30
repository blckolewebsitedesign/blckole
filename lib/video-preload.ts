"use client";

// Module-level cache of fetched videos.
// Keys are the original CDN URLs; values are blob: URLs that point to bytes
// already resident in memory. ChromaKeyCanvas resolves the original URL
// through getPreloadedVideoSrc() so an active <video> swap pays only
// decode cost, not a network round trip.
const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

export function getPreloadedVideoSrc(url: string): string | undefined {
  return cache.get(url);
}

export function preloadVideo(url: string): Promise<string> {
  const cached = cache.get(url);
  if (cached) return Promise.resolve(cached);
  const pending = inflight.get(url);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const res = await fetch(url, { credentials: "omit" });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      cache.set(url, blobUrl);
      return blobUrl;
    } finally {
      inflight.delete(url);
    }
  })();

  inflight.set(url, promise);
  return promise;
}

export async function preloadVideos(
  urls: string[],
  opts: { concurrency?: number; priorityIndex?: number } = {},
): Promise<void> {
  const { concurrency = 2, priorityIndex = 0 } = opts;
  if (urls.length === 0) return;

  // Priority-order: closest to priorityIndex fetches first.
  const indexMap = new Map(urls.map((u, i) => [u, i]));
  const queue = [...urls].sort((a, b) => {
    const ai = indexMap.get(a) ?? 0;
    const bi = indexMap.get(b) ?? 0;
    return Math.abs(ai - priorityIndex) - Math.abs(bi - priorityIndex);
  });

  const workerCount = Math.max(1, Math.min(concurrency, queue.length));
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (queue.length) {
        const url = queue.shift();
        if (!url) break;
        try {
          await preloadVideo(url);
        } catch (e) {
          console.warn("[video-preload] failed:", url, e);
        }
      }
    }),
  );
}
