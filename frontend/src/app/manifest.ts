// frontend/src/app/manifest.ts
import type { MetadataRoute } from "next";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/marca";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    // Tokens de docs/design-system.md
    background_color: "#FAFAFA",
    theme_color: "#0A0A0A",
    // PLACEHOLDER: generados ampliando el PNG 256x256 de favicon.ico.
    // Pixelado a propósito, reemplazar cuando haya logo definitivo.
    icons: [
      { src: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
