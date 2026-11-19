import type { TelemetryEvent, TelemetryPayload } from "@/types/telemetry";

/**
 * Cliente de telemetría liviano (RUM propio, sin Sentry/Vercel).
 *
 * Envía Core Web Vitals a `/api/telemetry` vía `sendBeacon`
 * (fallback: `fetch` con `keepalive`) para no bloquear el unload.
 *
 * **Buffering:** las métricas se acumulan en un lote corto (~300 ms)
 * y se despachan en un solo POST. `useReportWebVitals` llama al
 * callback una vez por métrica; sin buffer cada pageview consumiría
 * ~6 requests y agotaría el rate limit del endpoint.
 *
 * Garantías:
 * - **SSR-safe:** no-op cuando `window` no existe.
 * - **Sin PII:** solo métricas numéricas y nombres de campo.
 * - **Filtrado de basura:** eventos sin nombre o con `value`
 *   no numérico se descartan antes de serializar.
 * - **Unload:** el buffer se fuerza a flush en `pagehide`.
 */

/** URL del endpoint de ingesta. */
const ENDPOINT = "/api/telemetry";

/** Ventana de agregación antes de despachar el lote. */
const FLUSH_DELAY_MS = 300;

/** Máx. de eventos por POST (debe alinear con el servidor). */
const MAX_BATCH = 20;

/**
 * Habilitación global del RUM. En e2e (Playwright) se desactiva vía
 * `NEXT_PUBLIC_TELEMETRY_ENABLED=false` para no agotar el rate limit
 * ni ensuciar la consola con 429 en tests de "sin errores".
 */
function isTelemetryConfiguredEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_TELEMETRY_ENABLED;
  return flag !== "false" && flag !== "0";
}

/** Cola pendiente de envío. */
let buffer: TelemetryEvent[] = [];

/** Timer de flush (null = no hay flush programado). */
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/** Flag para registrar el listener de pagehide una sola vez. */
let pagehideBound = false;

/**
 * Indica si el cliente puede enviar telemetría (hay navegador).
 *
 * @returns `true` en browser; `false` en SSR/Node.
 */
export function isTelemetryEnabled(): boolean {
  return typeof window !== "undefined" && isTelemetryConfiguredEnabled();
}

/**
 * Valida un evento mínimo antes de enviarlo.
 *
 * @param event - Evento candidato.
 * @returns `true` si tiene nombre no vacío y value numérico finito.
 */
function isValidEvent(event: TelemetryEvent): boolean {
  return (
    typeof event.name === "string" &&
    event.name.length > 0 &&
    typeof event.value === "number" &&
    Number.isFinite(event.value)
  );
}

/**
 * Despacha el buffer actual en un único POST.
 * Best-effort: nunca lanza al usuario.
 */
function flush(): void {
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (!isTelemetryEnabled() || buffer.length === 0) {
    buffer = [];
    return;
  }

  // Divide en sub-lotes si excede MAX_BATCH (defensa en profundidad)
  const events = buffer;
  buffer = [];

  for (let i = 0; i < events.length; i += MAX_BATCH) {
    const chunk = events.slice(i, i + MAX_BATCH);
    const payload: TelemetryPayload = { events: chunk };
    const body = JSON.stringify(payload);

    try {
      if (typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon(ENDPOINT, body);
      } else {
        void fetch(ENDPOINT, {
          method: "POST",
          body,
          keepalive: true,
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch {
      // Telemetría best-effort: nunca lanzar al usuario.
    }
  }
}

/**
 * Programa un flush único tras la ventana de agregación.
 * Si el lote ya alcanzó MAX_BATCH, despacha de inmediato.
 */
function scheduleFlush(): void {
  if (buffer.length >= MAX_BATCH) {
    flush();
    return;
  }
  if (flushTimer !== null) return;
  flushTimer = setTimeout(flush, FLUSH_DELAY_MS);
}

/**
 * Vincula `pagehide` una sola vez para no perder métricas al cerrar.
 */
function bindPagehide(): void {
  if (pagehideBound || !isTelemetryEnabled()) return;
  pagehideBound = true;
  window.addEventListener("pagehide", flush);
}

/**
 * Acola un evento de telemetría y agenda el despacho del lote.
 *
 * @param events - Métricas a reportar (se filtran las inválidas).
 */
export function sendTelemetry(events: TelemetryEvent[]): void {
  if (!isTelemetryEnabled() || events.length === 0) return;

  const valid = events.filter(isValidEvent);
  if (valid.length === 0) return;

  bindPagehide();
  buffer.push(...valid);
  scheduleFlush();
}

/** Solo para tests: fuerza el despacho inmediato del buffer. */
export function __flushTelemetryForTests(): void {
  flush();
}

/** Solo para tests: limpia estado interno entre casos. */
export function __resetTelemetryForTests(): void {
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  buffer = [];
  pagehideBound = false;
}
