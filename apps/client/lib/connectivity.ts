/**
 * Connectivity detection — the single source of truth for "is the device
 * actually online right now?".
 *
 * Why this exists: `navigator.onLine` is unreliable when the page is served
 * from a service-worker cache — it can report `true` even with the network
 * down. So we confirm with a real request that the service worker is
 * guaranteed to send to the network (never serve from cache).
 *
 * The `NET_PROBE_PARAM` query flag is the contract between this module and the
 * service worker (`public/sw.js`), which passes any request carrying this flag
 * straight to the network. Keep the value here and in sw.js in sync — it is
 * intentionally owned here and only *referenced* by the SW.
 */

/** Query-string flag that tells the service worker to bypass its cache. */
export const NET_PROBE_PARAM = "__net_probe";

/** Same-origin resource used for the probe (small, always present). */
const PROBE_PATH = "/manifest.webmanifest";

/**
 * Resolves to `true` only if the network is genuinely reachable.
 *
 * Fast path: if the browser is confident it's offline (`navigator.onLine ===
 * false`), trust it and skip the request. Otherwise verify with a cache-
 * bypassing probe that fails fast when offline.
 */
export async function isReallyOnline(timeoutMs = 2000): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return false;
  }
  if (typeof fetch === "undefined") return false;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = `${location.origin}${PROBE_PATH}?${NET_PROBE_PARAM}=${Date.now()}`;
    await fetch(url, { method: "HEAD", cache: "no-store", signal: controller.signal });
    return true;
  } catch {
    return false; // offline / unreachable / timed out
  } finally {
    clearTimeout(timer);
  }
}
