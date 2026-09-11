"use client";

import { useEffect } from "react";
import { isReallyOnline } from "@/lib/connectivity";

const CF_TOKEN = "136e08eeda5c4767885f149528781334";

/**
 * Cloudflare Web Analytics beacon, injected client-side and ONLY when the
 * device is actually online, so offline / on-device play stays fully
 * network-free. Connectivity detection lives in `lib/connectivity`.
 */
export default function Analytics() {
  useEffect(() => {
    let cancelled = false;

    async function maybeInject() {
      if (document.querySelector("script[data-cf-beacon]")) return;
      if (!(await isReallyOnline())) return; // offline — never load the beacon
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
