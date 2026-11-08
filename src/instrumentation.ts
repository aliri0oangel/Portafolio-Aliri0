/**
 * Hook de instrumentación de Next.js.
 *
 * Se ejecuta una sola vez al arrancar el servidor. Es el punto
 * de entrada para configurar observabilidad: métricas, tracing,
 * y logs de arranque.
 *
 * Documentación: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

/** Se ejecuta al iniciar el runtime del servidor. */
export async function register() {
  // Evita registrar dos veces en dev (HMR de Turbopack)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logInfo } = await import("@/lib/logger");
    logInfo({
      event: "server.startup",
      message: "Servidor iniciado",
      env: process.env.NODE_ENV,
      nodeVersion: process.version,
    });
  }
}
