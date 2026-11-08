import { NextResponse, type NextRequest } from "next/server";
import { contactSchema } from "@/schemas/contactSchema";
import { rateLimit } from "@/lib/rateLimiter";
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

/**
 * Endpoint seguro de contacto.
 *
 * Capas de defensa (OWASP Top 10):
 * - **A01**: solo se acepta `POST`; otros métodos reciben 405.
 * - **A03**: validación Zod estricta + escape de entidades HTML.
 * - **A04**: rate limiting por IP (3 envíos / 15 min) + honeypot.
 * - **A02**: el proveedor de correo vive en el servidor (sin claves en cliente).
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  // --- A04: Rate limiting por IP ---
  const limit = rateLimit(ip);
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
