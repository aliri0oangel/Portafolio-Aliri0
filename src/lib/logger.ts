/**
 * Logger estructurado para observabilidad (JSON por línea).
 *
 * Principios de telemetría aplicados:
 * - **Sin PII:** nunca logear email, mensaje ni datos personales (OWASP A01).
 * - **Estructurado:** JSON parseable por herramientas de observabilidad
 *   (Datadog, Grafana Loki, Vercel Log Drains).
 * - **Niveles:** `info`, `warn`, `error` para filtrado por severidad.
 */

/** Niveles de log soportados. */
type LogLevel = "info" | "warn" | "error";

/** Payload estructurado del log. */
interface LogPayload {
  /** Nombre del evento (ej. `contact.rate_limited`). */
  event: string;
  /** Mensaje humano legible. */
  message: string;
  /** Campos adicionales (sin PII). */
  [key: string]: unknown;
}

/**
 * Escribe una línea JSON en stdout/stderr.
 *
 * El timestamp ISO y el nivel permiten correlacionar eventos en
 * dashboards de observabilidad en tiempo real.
 *
 * @param level - Nivel de severidad.
 * @param payload - Evento estructurado.
 */
export function log(level: LogLevel, payload: LogPayload): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    ...payload,
  };

  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

/** Atajo para nivel `info`. */
export const logInfo = (payload: LogPayload) => log("info", payload);
/** Atajo para nivel `warn`. */
export const logWarn = (payload: LogPayload) => log("warn", payload);
/** Atajo para nivel `error`. */
export const logError = (payload: LogPayload) => log("error", payload);
