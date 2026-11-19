import { NextResponse, type NextRequest } from "next/server";
import { contactSchema } from "@/schemas/contactSchema";
import { rateLimitAsync } from "@/lib/rateLimiter";
import { createEmailProvider } from "@/lib/emailService";
import { containsHeaderInjection, escapeHtmlEntities } from "@/lib/sanitize";
import { logInfo, logWarn, logError } from "@/lib/logger";
import type { ContactResponse } from "@/types/contact";

/**
 * Extrae la IP real del cliente detrás del proxy de Vercel/Next.
 *
 * @param request - Petición entrante.
 * @returns IP identificadora o `"unknown"` como último recurso.
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Límite máximo del cuerpo del request (32 KB — el form real es < 2 KB). */
const MAX_BODY_BYTES = 32 * 1024;

/**
 * Verifica que la petición provenga del propio sitio (CSRF / A01).
 *
 * Reglas:
 * - Si hay `Origin`: debe coincidir con el host de la petición
 *   (o ser el siteUrl configurado). `Origin: null` se rechaza.
 * - Si no hay Origin pero hay `Sec-Fetch-Site`: debe ser
 *   `same-origin` o `none` (navegación directa).
 * - Sin ambos headers (curl/scripts): se acepta — el rate limit
 *   sigue aplicando. Los browsers siempre envían uno de los dos.
 *
 * @param request - Petición entrante.
 * @returns `true` si el origen es aceptable.
 */
function isTrustedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");

  if (origin !== null) {
    // `null` viene de sandboxed iframes o file:// — siempre sospechoso.
    if (origin === "null" || origin.length === 0) return false;
    try {
      const originHost = new URL(origin).host;
      const requestHost =
        request.headers.get("host") ?? request.nextUrl.host;
      if (originHost === requestHost) return true;
      // También permite el siteUrl canónico (dominio de producción).
      const configured = process.env.NEXT_PUBLIC_SITE_URL;
      if (configured) {
        if (new URL(configured).host === originHost) return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  if (site !== null) {
    return site === "same-origin" || site === "none";
  }

  // Sin Origin ni Sec-Fetch-Site: request no-browser (rate limit aplica).
  return true;
}

/**
 * Extrae el límite de Content-Length declarado (si existe).
 *
 * @param request - Petición entrante.
 * @returns bytes declarados o `null` si no hay header.
 */
function getContentLength(request: NextRequest): number | null {
  const raw = request.headers.get("content-length");
  if (raw === null) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Endpoint seguro de contacto.
 *
 * Capas de defensa (OWASP Top 10):
 * - **A01**: solo se acepta `POST`; origin check CSRF + 405 en GET.
 * - **A03**: validación Zod estricta + escape de entidades HTML.
 * - **A04**: rate limiting por IP (3 envíos / 15 min) + honeypot.
 * - **A05**: límite de Content-Length (413) + sin PII en logs.
 * - **A02**: el proveedor de correo vive en el servidor (sin claves en cliente).
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  // --- A01: Origin check (CSRF) ---
  if (!isTrustedOrigin(request)) {
    logWarn({
      event: "contact.origin_rejected",
      message: "Request rechazado por origen no confiable",
    });
    return NextResponse.json<ContactResponse>(
      { ok: false, message: "Origen no permitido." },
      { status: 403 },
    );
  }

  // --- A05: Límite de tamaño de cuerpo ---
  const contentLength = getContentLength(request);
  if (contentLength !== null && contentLength > MAX_BODY_BYTES) {
    logWarn({
      event: "contact.body_too_large",
      message: "Cuerpo de petición excede el límite",
      contentLength,
    });
    return NextResponse.json<ContactResponse>(
      { ok: false, message: "Cuerpo de la petición demasiado grande." },
      { status: 413 },
    );
  }

  // --- A04: Rate limiting por IP (async: Upstash en serverless) ---
  const limit = await rateLimitAsync(ip);
  if (!limit.allowed) {
    const retryAfterSeconds = Math.ceil(limit.retryAfterMs / 1000);
    // Telemetría: evento de rate limit (sin IP completa — solo longitud para debug)
    logWarn({
      event: "contact.rate_limited",
      message: "Envío bloqueado por rate limit",
      retryAfterSeconds,
    });
    return NextResponse.json<ContactResponse>(
      {
        ok: false,
        message: `Demasiados envíos. Intenta de nuevo en ${Math.ceil(retryAfterSeconds / 60)} minuto(s).`,
      },
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
    return NextResponse.json<ContactResponse>(
      { ok: false, message: "Cuerpo de la petición inválido." },
      { status: 400 },
    );
  }

  // --- A04: Honeypot — los bots rellenan el campo oculto "website" ---
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    // Si el honeypot fue rellenado, fingimos éxito para no delatar la defensa.
    const honeypotTriggered =
      typeof body === "object" &&
      body !== null &&
      "website" in body &&
      Boolean((body as Record<string, unknown>).website);

    if (honeypotTriggered) {
      // Telemetría: bot detectado (sin delatar la defensa al cliente)
      logWarn({
        event: "contact.honeypot",
        message: "Honeypot rellenado — posible bot",
      });
      return NextResponse.json<ContactResponse>({
        ok: true,
        message: "¡Mensaje enviado con éxito!",
      });
    }

    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      (fieldErrors[key] ??= []).push(issue.message);
    }

    // Telemetría: validación fallida (nombres de campo, no valores)
    logWarn({
      event: "contact.invalid",
      message: "Validación Zod fallida",
      invalidFields: Object.keys(fieldErrors),
    });

    return NextResponse.json<ContactResponse>(
      {
        ok: false,
        message: "Revisa los campos del formulario.",
        fieldErrors,
      },
      { status: 422 },
    );
  }

  const { name, email, subject, message } = parsed.data;

  // --- A03: Header injection check sobre campos usados en cabeceras SMTP ---
  if (containsHeaderInjection(name) || containsHeaderInjection(email)) {
    return NextResponse.json<ContactResponse>(
      { ok: false, message: "Contenido no permitido en los campos de identidad." },
      { status: 422 },
    );
  }

  const provider = createEmailProvider();
  const result = await provider.send({
    // Escape defensivo en profundidad antes de despachar.
    name: escapeHtmlEntities(name),
    email,
    subject,
    message: escapeHtmlEntities(message),
  });

  if (!result.success) {
    // Telemetría: fallo del proveedor (sin datos del mensaje)
    logError({
      event: "contact.provider_failed",
      message: "Fallo del proveedor de correo",
      providerError: result.error,
    });
    return NextResponse.json<ContactResponse>(
      { ok: false, message: "No se pudo enviar el mensaje. Intenta más tarde." },
      { status: 502 },
    );
  }

  // Telemetría: envío exitoso (sin PII — solo metadatos operativos)
  logInfo({
    event: "contact.sent",
    message: "Mensaje aceptado por el proveedor",
    id: result.id,
    subjectLength: subject.length,
  });

  return NextResponse.json<ContactResponse>({
    ok: true,
    message: "¡Mensaje enviado con éxito! Te responderé en menos de 24 horas hábiles.",
  });
}

/**
 * Rechaza cualquier método distinto de POST con 405 (A01).
 */
export function GET() {
  return NextResponse.json<ContactResponse>(
    { ok: false, message: "Método no permitido." },
    { status: 405 },
  );
}
