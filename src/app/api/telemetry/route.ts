import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rateLimitAsync } from "@/lib/rateLimiter";
import { logInfo, logWarn } from "@/lib/logger";
import type { TelemetryResponse } from "@/types/telemetry";

/**
 * Ingesta de telemetría RUM (Fase 3 — Observabilidad liviana).
 *
 * Capas de defensa (OWASP):
 * - **A01:** solo POST (GET → 405 vía handler).
 * - **A03:** validación Zod estricta del batch.
 * - **A04:** rate limit por IP (cuota más generosa que contacto:
 *   el RUM envía pocas métricas por pageview).
 * - **Sin PII:** solo se loguean nombres de métrica y conteos.
 */

/** Límite de eventos por batch (abuse control). */
const MAX_EVENTS_PER_BATCH = 20;

/** Cuota RUM: 60 batches / 5 min por IP. */
const TELEMETRY_LIMIT = 60;
const TELEMETRY_WINDOW_MS = 5 * 60 * 1000;

/** Esquema de un evento de telemetría. */
const telemetryEventSchema = z.object({
  name: z.string().min(1).max(64),
  value: z.number().finite(),
  id: z.string().max(128).optional(),
  rating: z.enum(["good", "needs-improvement", "poor"]).optional(),
  navigationType: z.string().max(64).optional(),
});

/** Esquema del payload completo. */
const telemetryPayloadSchema = z.object({
  events: z
    .array(telemetryEventSchema)
    .min(1)
    .max(MAX_EVENTS_PER_BATCH),
});

/**
 * Extrae la IP real del cliente detrás del proxy.
 *
 * @param request - Petición entrante.
 * @returns IP identificadora o `"unknown"`.
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Verifica origen confiable (CSRF / A01) — misma regla que /api/contact.
 *
 * @param request - Petición entrante.
 * @returns `true` si el origen es aceptable.
 */
function isTrustedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");

  if (origin !== null) {
    if (origin === "null" || origin.length === 0) return false;
    try {
      const originHost = new URL(origin).host;
      const requestHost =
        request.headers.get("host") ?? request.nextUrl.host;
      if (originHost === requestHost) return true;
      const configured = process.env.NEXT_PUBLIC_SITE_URL;
      if (configured && new URL(configured).host === originHost) return true;
      return false;
    } catch {
      return false;
    }
  }

  if (site !== null) {
    return site === "same-origin" || site === "none";
  }

  return true;
}

/**
 * POST /api/telemetry — recibe un batch de métricas RUM.
 *
 * @param request - Petición con JSON `{ events: [...] }`.
 * @returns 200 si se aceptó; 400/403/422/429 según fallo.
 */
export async function POST(request: NextRequest) {
  // --- A01: Origin check (CSRF) ---
  if (!isTrustedOrigin(request)) {
    logWarn({
      event: "telemetry.origin_rejected",
      message: "Batch rechazado por origen no confiable",
    });
    return NextResponse.json<TelemetryResponse>(
      { ok: false, message: "Origen no permitido." },
      { status: 403 },
    );
  }

  const ip = getClientIp(request);

  // --- A04: Rate limiting por IP (async: Upstash en serverless) ---
  const limit = await rateLimitAsync(
    `telemetry:${ip}`,
    TELEMETRY_LIMIT,
    TELEMETRY_WINDOW_MS,
  );
  if (!limit.allowed) {
    const retryAfterSeconds = Math.ceil(limit.retryAfterMs / 1000);
    logWarn({
      event: "telemetry.rate_limited",
      message: "Batch de telemetría bloqueado por rate limit",
      retryAfterSeconds,
    });
    return NextResponse.json<TelemetryResponse>(
      { ok: false, message: "Demasiadas métricas. Intenta más tarde." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds) },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<TelemetryResponse>(
      { ok: false, message: "Cuerpo de la petición inválido." },
      { status: 400 },
    );
  }

  // --- A03: Validación Zod estricta ---
  const parsed = telemetryPayloadSchema.safeParse(body);
  if (!parsed.success) {
    logWarn({
      event: "telemetry.invalid",
      message: "Payload de telemetría inválido",
      issues: parsed.error.issues.length,
    });
    return NextResponse.json<TelemetryResponse>(
      { ok: false, message: "Payload de telemetría inválido." },
      { status: 422 },
    );
  }

  const { events } = parsed.data;

  // Telemetría del servidor: solo metadatos operativos (sin PII)
  logInfo({
    event: "telemetry.received",
    message: "Batch de telemetría aceptado",
    count: events.length,
    metrics: [...new Set(events.map((e) => e.name))],
  });

  return NextResponse.json<TelemetryResponse>({
    ok: true,
    accepted: events.length,
  });
}

/**
 * GET → 405: la ingesta solo acepta POST (A01).
 */
export function GET() {
  return NextResponse.json<TelemetryResponse>(
    { ok: false, message: "Método no permitido." },
    { status: 405 },
  );
}
