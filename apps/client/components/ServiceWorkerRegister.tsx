"use client";

import { useEffect } from "react";

/**
 * Registers the service worker so the app shell + assets are cached and the
 * game can be opened / reloaded with no network (PWA offline support).
 * Registration is skipped in development to avoid caching the dev bundle.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
    const swUrl = `${basePath}/sw.js`;

    navigator.serviceWorker.register(swUrl).catch(() => {
      // Registration failures are non-fatal — the app still works online.
    });
  }, []);

  return null;
}
