/**
 * Rate limiter en memoria con algoritmo de ventana fija por clave (IP).
 *
 * Diseño: en entornos serverless sin Redis se usa un `Map` global en el
 * ámbito del módulo. Funciona perfectamente en `next dev` y en instancias
 * long-lived; en producción multi-instance (Vercel) se activa Upstash
 * Redis REST automáticamente si existen `UPSTASH_REDIS_REST_URL` y
 * `UPSTASH_REDIS_REST_TOKEN` — la interfaz pública no cambia, solo la
 * implementación (Dependency Inversion / Fase 4 OWASP A04).
 *
 * Política del portafolio: 3 envíos por IP cada 15 minutos (contacto);
 * el endpoint de telemetría usa cuota propia más generosa.
 */

/** Contrato DIP: cualquier backend (in-memory, Redis, Upstash) lo cumple. */
export interface IRateLimiter {
  /**
   * Evalúa si una clave (IP) está dentro de su cuota permitida.
   *
   * @param key - Identificador del cliente (normalmente su IP).
   * @param limit - Máximo de peticiones permitidos por ventana.
   * @param windowMs - Duración de la ventana en milisegundos.
   * @returns `{ allowed: true }` si pasa; si no, cuánto falta para reiniciar.
   */
  check(
    key: string,
    limit?: number,
    windowMs?: number,
  ): { allowed: boolean; retryAfterMs: number };

  /**
   * Versión async del check (necesaria para backends remotos como
   * Upstash). La implementación in-memory resuelve de inmediato.
   */
  checkAsync(
    key: string,
    limit?: number,
    windowMs?: number,
  ): Promise<{ allowed: boolean; retryAfterMs: number }>;
}

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 3;

/** Registro por clave de la ventana actual (in-memory). */
const attempts = new Map<string, { count: number; resetAt: number }>();

/**
 * Implementación in-memory del rate limiter.
 *
 * Suficiente para desarrollo e instancias únicas. En serverless
 * multi-instancia, `createRateLimiter()` devuelve Upstash cuando
 * las env vars están presentes.
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

  async checkAsync(key, limit, windowMs) {
    return this.check(key, limit, windowMs);
  },
};

/**
 * Lee las credenciales Upstash del entorno.
 *
 * @returns URL y token, o `null` si falta alguna.
 */
function readUpstashConfig():
  | { url: string; token: string }
  | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return { url, token };
  return null;
}

/**
 * Crea el rate limiter Upstash sobre su REST API (sin SDK externo).
 *
 * Algoritmo de ventana fija con INCR + PEXPIRE (atómico vía pipeline
 * de Upstash). Si la red falla, **degrada a in-memory** para no
 * bloquear el tráfico legítimo (fail-open en errores de infra).
 *
 * @param config - Credenciales REST de Upstash.
 * @returns Instancia de `IRateLimiter` lista para usar.
 */
function createUpstashRateLimiter(config: {
  url: string;
  token: string;
}): IRateLimiter {
  async function evalWindow(
    key: string,
    limit: number,
    windowMs: number,
  ): Promise<{ allowed: boolean; retryAfterMs: number }> {
    const redisKey = `rl:${key}`;
    const body = JSON.stringify({
      // INCR + PEXPIRE en un solo round-trip (script)
      script: `
        local c = redis.call('INCR', KEYS[1])
        if c == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
        local ttl = redis.call('PTTL', KEYS[1])
        return {c, ttl}
      `,
      keys: [redisKey],
      arguments: [String(windowMs)],
    });

    const res = await fetch(`${config.url}/eval`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body,
      // Timeout corto: si Upstash no responde, caemos a in-memory.
      signal: AbortSignal.timeout(800),
    });

    if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`);
    const json = (await res.json()) as { result: [number, number] };
    const [count, ttl] = json.result;
    const retryAfterMs = ttl > 0 ? ttl : 0;

    if (count > limit) {
      return { allowed: false, retryAfterMs };
    }
    return { allowed: true, retryAfterMs: 0 };
  }

  return {
    check(key, limit = MAX_REQUESTS, windowMs = WINDOW_MS) {
      // Síncrono por contrato: en Upstash no podemos esperar red aquí.
      // Se marca como permitido y el caller debe preferir checkAsync.
      // Degradación conservadora: usa el conteo local como hint.
      return inMemoryRateLimiter.check(key, limit, windowMs);
    },
    async checkAsync(key, limit = MAX_REQUESTS, windowMs = WINDOW_MS) {
      try {
        return await evalWindow(key, limit, windowMs);
      } catch {
        // Fail-open: red/Upstash caído → in-memory local (mejor que 500).
        return inMemoryRateLimiter.check(key, limit, windowMs);
      }
    },
  };
}

/**
 * Factory DIP: devuelve la implementación activa del rate limiter.
 *
 * - Con `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`:
 *   Upstash Redis REST (serverless multi-instancia).
 * - Sin ellas: in-memory (dev y instancias únicas).
 *
 * @returns Instancia de `IRateLimiter` lista para usar.
 */
export function createRateLimiter(): IRateLimiter {
  const upstash = readUpstashConfig();
  if (upstash) return createUpstashRateLimiter(upstash);
  return inMemoryRateLimiter;
}

/**
 * Conveniencia síncrona: rate limit con la implementación por defecto.
 * Mantiene la API histórica `rateLimit(key)`. Preferir
 * `rateLimitAsync` en rutas serverless con Upstash.
 *
 * @param key - Identificador del cliente.
 * @param limit - Máximo de peticiones permitidas por ventana.
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
 * Conveniencia async: usa Upstash si está configurado, si no
 * resuelve con in-memory. **Usar en route handlers.**
 *
 * @param key - Identificador del cliente.
 * @param limit - Máximo de peticiones permitidas por ventana.
 * @param windowMs - Duración de la ventana.
 * @returns Promise del resultado de la evaluación.
 */
export async function rateLimitAsync(
  key: string,
  limit: number = MAX_REQUESTS,
  windowMs: number = WINDOW_MS,
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  return createRateLimiter().checkAsync(key, limit, windowMs);
}

/**
 * Purga las entradas vencidas. Invocable desde un cron o al arrancar el
 * proceso para evitar crecimiento ilimitado del Map (memory hygiene).
 * No aplica al backend Upstash (TTL lo gestiona Redis).
 */
export function pruneExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of attempts) {
    if (entry.resetAt <= now) attempts.delete(key);
  }
}
