/**
 * Tipado de los payloads de telemetría (RUM liviano propio).
 *
 * Principios: sin PII (OWASP A01), tamaño acotado por batch
 * y campos mínimos necesarios para Core Web Vitals.
 */

/** Métricas Core Web Vitals + custom soportadas por el cliente. */
export type TelemetryMetricName =
  | "TTFB"
  | "FCP"
  | "LCP"
  | "CLS"
  | "INP"
  | "Next.js-hydration"
  | "Next.js-route-change-to-render"
  | "Next.js-render";

/** Calificación cualitativa del Core Web Vitals. */
export type TelemetryRating = "good" | "needs-improvement" | "poor";

/**
 * Un evento de telemetría individual (una métrica medida).
 * `value` es ms para tiempos y el score para CLS.
 */
export interface TelemetryEvent {
  /** Nombre de la métrica (ej. `LCP`). */
  name: string;
  /** Valor numérico de la métrica. */
  value: number;
  /** Identificador único del pageview/métrica (opcional). */
  id?: string;
  /** Calificación según umbrales de web.dev (opcional). */
  rating?: TelemetryRating;
  /** Tipo de navegación que disparó la métrica (opcional). */
  navigationType?: string;
}

/** Payload del POST /api/telemetry. */
export interface TelemetryPayload {
  /** Batch de eventos (1..20 por request). */
  events: TelemetryEvent[];
}

/** Respuesta estándar del endpoint de telemetría. */
export type TelemetryResponse =
  | { ok: true; accepted: number }
  | { ok: false; message: string };

/** Respuesta estándar del endpoint /api/health. */
export interface HealthResponse {
  status: "ok";
  timestamp: string;
  uptime: number;
}
