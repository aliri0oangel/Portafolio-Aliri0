"use client";

import { useEffect } from "react";
import Link from "next/link";
import { logError } from "@/lib/logger";

/**
 * Error boundary global de Next.js.
 *
 * Captura excepciones no controladas en cualquier segmento y
 * muestra una UI de recuperación. El error se reporta al logger
 * estructurado (base para Sentry u otro APM en el futuro).
 */

/** Props del error boundary (contrato de Next.js). */
interface ErrorPageProps {
  /** Error capturado por React/Next. */
  error: Error & { digest?: string };
  /** Callback de reset: reintenta renderizar el segmento. */
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log estructurado para observabilidad (sin PII)
    logError({
      event: "app.error_boundary",
      message: "Error no controlado capturado",
      errorMessage: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-4 text-center">
      <span className="font-mono text-xs uppercase tracking-widest text-accent-amber">
        Error inesperado
      </span>
      <h1 className="text-3xl font-bold text-text-bright sm:text-4xl">
        Algo salió mal.
      </h1>
      <p className="max-w-md text-base leading-relaxed text-text-dim">
        El sitio encontró un error inesperado. Puedes intentar de nuevo —
        si persiste, escríbeme directamente.
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="min-h-10 rounded-lg bg-btn-primary px-5 text-sm font-semibold text-btn-primary-fg transition-colors hover:bg-btn-primary-hover"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="inline-flex min-h-10 items-center rounded-lg border border-border px-5 text-sm font-medium text-text-dim transition-colors hover:text-text-bright"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
