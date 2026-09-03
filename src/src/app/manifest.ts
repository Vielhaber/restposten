import type { MetadataRoute } from "next";

/**
 * Web App Manifest (served at /manifest.webmanifest via Next's file convention).
 * Makes the marketplace installable to a phone's home screen — standalone
 * display (no browser chrome), brand icons, brand theme color. This is what
 * lets a mobile browser offer "Zum Startbildschirm hinzufügen" / "Add to
 * Home Screen" so the site opens and feels like an app, without a native
 * iOS/Android build.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Restposten Platform",
    short_name: "Restposten",
    description: "Gated B2B Clearance- & Liquidations-Marktplatz für die DACH-Region",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    lang: "de",
    background_color: "#ffffff",
    theme_color: "#1f3350",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
