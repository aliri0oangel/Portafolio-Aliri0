/**
 * Rate limiter en memoria con algoritmo de ventana fija por clave (IP).
 *
 * Diseño: en entornos serverless sin Redis se usa un `Map` global en el
 * ámbito del módulo. Funciona perfectamente en `next dev` y en instancias
 * long-lived; en producción multi-instance (Vercel Edge) debe sustituirse
 * por Upstash Redis — la interfaz pública no cambia, solo la implementación
 * (Dependency Inversion).
 *
 * Política del portafolio: 3 envíos por IP cada 15 minutos.
 */

/** Contrato DIP: cualquier backend (in-memory, Redis, Upstash) lo cumple. */
export interface IRateLimiter {
  /**
   * Evalúa si una clave (IP) está dentro de su cuota permitida.
   *
   * @param key - Identificador del cliente (normalmente su IP).
   * @param limit - Máximo de peticiones permitidas por ventana.
   * @param windowMs - Duración de la ventana en milisegundos.
   * @returns `{ allowed: true }` si pasa; si no, cuánto falta para reiniciar.
   */
  check(
    key: string,
    limit?: number,
    windowMs?: number,
  ): { allowed: boolean; retryAfterMs: number };
}

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 3;

/** Registro por clave de la ventana actual. */
const attempts = new Map<string, { count: number; resetAt: number }>();

/**
 * Implementación in-memory del rate limiter.
 *
 * Suficiente para desarrollo e instancias únicas. Para serverless
 * multi-instancia, implementar `IRateLimiter` con Upstash Redis y
 * inyectarlo en `createRateLimiter()`.
 */
const inMemoryRateLimiter: IRateLimiter = {
  check(key, limit = MAX_REQUESTS, windowMs = WINDOW_MS) {
    const now = Date.now();
    const entry = attempts.get(key);

    if (!entry || entry.resetAt <= now) {
      attempts.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, retryAfterMs: 0 };
    }

    if (entry.count >= limit) {
      return { allowed: false, retryAfterMs: entry.resetAt - now };
    }

    entry.count += 1;
    return { allowed: true, retryAfterMs: 0 };
  },
};

/**
 * Factory DIP: devuelve la implementación activa del rate limiter.
 * Hoy retorna in-memory; en producción se sustituye por Upstash sin
 * tocar los callers.
 *
 * @returns Instancia de `IRateLimiter` lista para usar.
 */
export function createRateLimiter(): IRateLimiter {
  return inMemoryRateLimiter;
}

/**
 * Conveniencia: rate limit con la implementación por defecto.
 * Mantiene la API histórica de `rateLimit(key)`.
 *
 * @param key - Identificador del cliente.
 * @param limit - Máximo de peticiones por ventana.
 * @param windowMs - Duración de la ventana.
 * @returns Resultado de la evaluación.
 */
export function rateLimit(
  key: string,
  limit: number = MAX_REQUESTS,
  windowMs: number = WINDOW_MS,
): { allowed: boolean; retryAfterMs: number } {
  return createRateLimiter().check(key, limit, windowMs);
}

/**
 * Purga las entradas vencidas. Invocable desde un cron o al arrancar el
 * proceso para evitar crecimiento ilimitado del Map (memory hygiene).
 */
export function pruneExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of attempts) {
    if (entry.resetAt <= now) attempts.delete(key);
  }
}
