"use client";

import { useReportWebVitals } from "next/web-vitals";
import { sendTelemetry } from "@/lib/telemetry/client";
import type { TelemetryEvent } from "@/types/telemetry";

/**
 * RUM liviano propio (Fase 3 — Observabilidad).
 *
 * Usa el hook built-in `useReportWebVitals` de Next.js (sin
 * dependencias externas) y reenvía los Core Web Vitals a
 * `/api/telemetry` vía `sendBeacon`.
 *
 * Contrato: el callback debe ser **estable por referencia** para
 * no re-registrar observadores en cada render (documentado en
 * `next/web-vitals`). Por eso `handleMetric` se define fuera.
 *
 * `sendTelemetry` es no-op en SSR y best-effort en el navegador.
 */

/**
 * Convierte el metric de Next al payload propio y lo envía.
 *
 * @param metric - Métrica Core Web Vitals reportada por Next.js.
 */
function handleMetric(metric: {
  name: string;
  value: number;
  id: string;
  rating?: string;
  navigationType?: string;
}): void {
  const event: TelemetryEvent = {
    name: metric.name,
    value: metric.value,
    id: metric.id,
    rating: metric.rating as TelemetryEvent["rating"],
    navigationType: metric.navigationType,
  };
  sendTelemetry([event]);
}

/**
 * Componente invisible que inicializa el RUM al montar el layout.
 * No renderiza nada (return null — solo side-effect de medición).
 */
export function WebVitals() {
  useReportWebVitals(handleMetric);
  return null;
}
