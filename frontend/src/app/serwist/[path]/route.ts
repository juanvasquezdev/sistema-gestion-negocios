// frontend/src/app/serwist/[path]/route.ts
// Sirve el service worker compilado desde src/app/sw.ts en /serwist/sw.js.
import { createSerwistRoute } from "@serwist/turbopack";

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  swSrc: "src/app/sw.ts",
  // Usa el paquete `esbuild` instalado; sin esto, fuera de Windows buscaría `esbuild-wasm`.
  useNativeEsbuild: true,
});
