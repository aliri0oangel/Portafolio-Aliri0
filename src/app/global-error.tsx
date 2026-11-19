"use client";

import { useEffect } from "react";
import Link from "next/link";
import { logError } from "@/lib/logger";

/**
 * Error boundary global (Next.js `global-error.tsx`).
 *
 * Reemplaza el root layout cuando hay un error fatal no capturado
 * por `error.tsx`. Contrato Next.js: **debe** renderizar sus
 * propios `<html>` y `<body>` (el layout raíz no está disponible).
 *
 * No imprime `error.message` crudo al cliente en producción
 * (evita filtrar detalles internos — OWASP A05); solo loguea
 * con el logger estructurado para correlación en servidor.
 */

/** Props del error boundary global (contrato de Next.js). */
interface GlobalErrorProps {
  /** Error fatal capturado. */
  error: Error & { digest?: string };
  /** Callback de recuperación: reintenta montar el layout raíz. */
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log estructurado para observabilidad (sin PII)
    logError({
      event: "app.global_error",
      message: "Error fatal en root layout",
      errorMessage: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    // global-error must include html and body tags
    <html lang="es">
      <body
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0a0a0b] px-4 text-center font-sans text-white"
      >
        <span className="font-mono text-xs uppercase tracking-widest text-amber-500">
          Error fatal
        </span>
        <h1 className="text-3xl font-bold sm:text-4xl">
          Algo salió mal.
        </h1>
        <p className="max-w-md text-base leading-relaxed text-neutral-400">
          El sitio encontró un error inesperado. Puedes intentar de nuevo —
          si persiste, escríbeme directamente.
        </p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="min-h-10 rounded-lg bg-white px-5 text-sm font-semibold text-black transition-colors hover:bg-neutral-200"
          >
            Reintentar
          </button>
          {/* Link de Next para navegar al home; si el router también
              falló, el botón Reintentar sigue siendo la vía primaria. */}
          <Link
            href="/"
            className="inline-flex min-h-10 items-center rounded-lg border border-neutral-700 px-5 text-sm font-medium text-neutral-300 transition-colors hover:text-white"
          >
            Volver al inicio
          </Link>
        </div>
      </body>
    </html>
  );
}
