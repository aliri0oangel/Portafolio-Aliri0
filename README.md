# Alirio — Portafolio Full-Stack

Portafolio personal de **Alirio**, desarrollador web Full-Stack. Construido con **Next.js 16 (App Router)**, **React 19**, **TypeScript** y **Tailwind v4**.

> Referencia de layout: cada sección llena la pantalla visible (patrón herasi.dev) con stretch-fill para equilibrio vertical en viewports altos — sin asomo de la sección siguiente.

## Getting Started

```bash
pnpm install
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | Descripción |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm start` | Sirve el build de producción |
| `pnpm lint` | ESLint |
| `pnpm test` | Unit tests (Vitest + Testing Library) |
| `pnpm test:e2e` | E2E (Playwright, 8 viewports) |

## Arquitectura

```
src/
├── app/
│   ├── api/
│   │   ├── contact/route.ts    # Formulario (OWASP A01–A05)
│   │   ├── health/route.ts     # Sonda de salud /uptime
│   │   └── telemetry/route.ts  # Ingesta RUM liviana
│   ├── global-error.tsx        # Error boundary raíz (html/body propios)
│   ├── error.tsx               # Error boundary por segmento
│   ├── layout.tsx              # Root layout + WebVitals RUM
│   └── page.tsx                # Home (AmbientCanvas dynamic)
├── components/
│   ├── providers/WebVitals.tsx # RUM → /api/telemetry (sendBeacon)
│   ├── sections/               # Hero, About, Skills, Projects, Contact
│   └── canvas/AmbientCanvas.tsx # Fondo partículas (dynamic, ssr:false)
├── lib/
│   ├── telemetry/client.ts     # Buffer + sendBeacon batch (sin PII)
│   ├── rateLimiter.ts          # DIP: in-memory | Upstash REST
│   ├── logger.ts               # JSON estructurado sin PII
│   └── sectionNav.ts           # Aterrizaje al ancla (block:"start")
└── proxy.ts                    # Security headers + x-request-id + 405
```

## Observabilidad (Fase 3)

- **`GET /api/health`** — `{ status, timestamp, uptime }` para uptime monitors.
- **`POST /api/telemetry`** — batch de Core Web Vitals (máx. 20, rate-limit 60/5min).
- **RUM propio** (`useReportWebVitals` → buffer 300ms → `sendBeacon`). Sin Sentry/Vercel Analytics.
- **`x-request-id`** en toda respuesta (correlación proxy → API → errores).
- **`global-error.tsx`** — fallback fatal con `<html>`/`<body>` propios.
- Desactivar RUM en e2e: `NEXT_PUBLIC_TELEMETRY_ENABLED=false` (ya en `playwright.config.ts`).

## Seguridad OWASP (Fase 4)

| Control | Implementación |
| --- | --- |
| A01 CSRF | Origin check + `Sec-Fetch-Site` en POST de API |
| A01 405 | Métodos no permitidos bloqueados en `/api/*` |
| A03 | Zod + escape HTML + header-injection check |
| A04 | Rate limit por IP (contacto 3/15min · telemetry 60/5min) |
| A04 serverless | Upstash REST automático si `UPSTASH_REDIS_REST_URL`+`TOKEN` |
| A05 | CSP estricto, HSTS, nosniff, DENY · body ≤ 32KB (413) |
| A05 PII | Logs sin email/nombre/cuerpo · honeypot anti-bot |
| A06 | `/.well-known/security.txt` |

## Rendimiento (Fase 5)

- `AmbientCanvas` y `WebGLMorphCanvas` cargados con `next/dynamic` (`ssr: false`).
- `content-visibility: auto` en About/Skills/Contact (reveal con `contain-intrinsic-size`).
- Stretch-fill: `flex` + `auto-rows-fr` + `h-full` → sin hueco inferior en viewports altos.
- Deps eliminadas: `embla-carousel-*`, `motion-utils`, `scheduler`, `@jridgewell/sourcemap-codec`.

## Layout — receta sin asomo (Fase 1–2)

```ts
// sectionClassNames.ts
export const SECTION_FULL_HEIGHT =
  "min-h-[100svh] sm:min-h-[calc(100svh+0.5rem)] lg:min-h-[calc(100svh+1.5rem)] " +
  "py-20 sm:py-24 lg:py-28 section-contain flex flex-col";
// bumps = py − 88px (scroll-padding) para que el ancla quede al tope
// sin dejar que la sección siguiente asome por el borde inferior.
```

## Variables de entorno

| Variable | Propósito |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canónico, OG, origin check |
| `NEXT_PUBLIC_TELEMETRY_ENABLED` | `"false"` desactiva RUM (e2e) |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Rate limit distribuido (opcional) |

## Tests

- **Unit (Vitest):** 35 archivos · **274 tests** — componentes, lib, APIs, proxy.
- **E2E (Playwright):** **488 tests** en 8 viewports (320 → 2560) · ~476 passed + 12 skipped.

```bash
pnpm test
pnpm exec playwright test                       # todo
pnpm exec playwright test --project=desktop-1920
```

## Deploy

```bash
pnpm build && pnpm start
# o en Vercel: detección automática de Next.js
```

Sin base de datos. En serverless multi-instancia, configura Upstash para rate limit distribuido.
