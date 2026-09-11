"use client";

import { useEffect } from "react";

const CF_TOKEN = "136e08eeda5c4767885f149528781334";

/**
 * Cloudflare Web Analytics beacon, injected client-side and ONLY when the
 * device is actually online. This keeps offline / on-device play fully
 * network-free — no external requests are made when there is no connectivity.
 *
 * Note: `navigator.onLine` is unreliable when the page is served from a
 * service-worker cache (it can report `true` even with the network down), so
 * we confirm connectivity with a real, same-origin, no-store probe before
 * loading the third-party beacon.
 */
export default function Analytics() {
  useEffect(() => {
    let cancelled = false;

    async function maybeInject() {
      if (typeof navigator !== "undefined" && navigator.onLine === false) return;
      if (document.querySelector("script[data-cf-beacon]")) return;

      // Confirm we can actually reach the network before loading anything
      // external. This probe bypasses the service-worker cache (see sw.js
      // __net_probe handling) so it fails fast when genuinely offline.
      try {
        const probe = new AbortController();
        const t = setTimeout(() => probe.abort(), 2000);
        await fetch(`${location.origin}/manifest.webmanifest?__net_probe=${Date.now()}`, {
          method: "HEAD",
          cache: "no-store",
          signal: probe.signal,
        });
        clearTimeout(t);
      } catch {
        return; // offline / unreachable — never load the external beacon
      }

      if (cancelled || document.querySelector("script[data-cf-beacon]")) return;

      const script = document.createElement("script");
      script.src = "https://static.cloudflareinsights.com/beacon.min.js";
      script.defer = true;
      script.setAttribute("data-cf-beacon", JSON.stringify({ token: CF_TOKEN }));
      document.body.appendChild(script);
    }

    maybeInject();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
