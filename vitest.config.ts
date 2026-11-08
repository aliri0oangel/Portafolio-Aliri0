import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

/**
 * Configuración de Vitest para el portafolio.
 *
 * - Alias `@/` replica el tsconfig de Next.js.
 * - Entorno `jsdom` simula el DOM del navegador.
 * - Setup global mockea APIs ausentes en jsdom (matchMedia,
 *   IntersectionObserver, ResizeObserver) usadas por framer-motion
 *   y next-themes.
 * - Coverage con umbral 80% sobre lib/ y components/.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/components/**", "src/data/**"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
