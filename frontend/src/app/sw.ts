// frontend/src/app/sw.ts
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Nunca guardar datos de negocio en el caché del navegador: defaultCache cachearía
// las respuestas del backend (otro origen) y las páginas del dashboard, y quedarían
// disponibles después de cerrar sesión. Van primero porque gana la primera regla que coincide.
const sinCache: RuntimeCaching[] = [
  {
    matcher: ({ sameOrigin }) => !sameOrigin,
    handler: new NetworkOnly(),
  },
  {
    matcher: ({ sameOrigin, url: { pathname } }) => sameOrigin && pathname.startsWith("/dashboard"),
    handler: new NetworkOnly(),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [...sinCache, ...defaultCache],
});

serwist.addEventListeners();
