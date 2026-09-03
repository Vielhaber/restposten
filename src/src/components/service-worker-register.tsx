"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker on the client. Silently no-ops if the
 * browser doesn't support it or registration fails — installability is a
 * progressive enhancement, never a hard requirement for the site to work.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* PWA install/offline support degrades gracefully without a worker. */
    });
  }, []);

  return null;
}
