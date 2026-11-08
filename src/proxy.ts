import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy global (antes "middleware"): headers de seguridad OWASP + control de métodos.
 *
 * En Next.js 16 la convención `middleware` fue reemplazada por `proxy`.
 * La lógica es idéntica; solo cambia el nombre del archivo y la función exportada.
 *
 * Capas:
 * - **A05 (Security Misconfiguration):** headers estrictos en toda respuesta.
 * - **A01 (Broken Access Control):** solo GET/POST/OPTIONS permitidos en /api/*.
 * - **A06 (Vulnerable Components):** HSTS fuerza HTTPS en navegadores compatibles.
 */

/** Métodos HTTP permitidos para rutas de API. */
const ALLOWED_API_METHODS = new Set(["GET", "POST", "OPTIONS"]);

/**
 * Headers de seguridad aplicados a todas las respuestas.
 *
 * CSP: `default-src 'self'` bloquea todo recurso externo por defecto.
 * `img-src 'self' data:` permite SVGs auto-hospedados y data URIs.
 * `style-src 'self' 'unsafe-inline'` es necesario por las clases
 * dinámicas de Tailwind (build-time inline styles).
 */
const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

/**
 * Proxy Next.js: se ejecuta antes de cada request.
 *
 * 1. Aplica headers de seguridad a todas las respuestas.
 * 2. Bloquea métodos no permitidos en rutas /api/* (405).
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // 1. Headers de seguridad en toda respuesta
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  // 2. Control de métodos en API
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const method = request.method;
    if (!ALLOWED_API_METHODS.has(method)) {
      return NextResponse.json(
        { ok: false, message: `Método ${method} no permitido.` },
        { status: 405, headers: { Allow: "GET, POST, OPTIONS" } },
      );
    }
  }

  return response;
}

/** Configuración: el proxy aplica a todas las rutas. */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
