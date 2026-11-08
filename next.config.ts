import type { NextConfig } from "next";

/**
 * Configuración de Next.js 16.
 *
 * - `cacheComponents` + `partialPrefetching`: streaming y prefetch óptimos.
 * - Turbopack con loader de Tailwind v4 (CSS-first).
 * - Headers de cache para assets estáticos (Fase 10 — rendimiento).
 */
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        // Iconos SVG y assets públicos: cache inmutable a largo plazo.
        // Los archivos de /public no llevan hash, pero al ser versionados
        // manualmente se sirven con max-age agresivo + revalidación.
        source: "/tech/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, stale-while-revalidate=592000",
          },
        ],
      },
      {
        // Fuentes Geist auto-hospedadas por next/font: cache largo.
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  allowedDevOrigins: ["192.168.10.2"],
};


export default nextConfig;
