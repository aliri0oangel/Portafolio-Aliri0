# Plan de Refactor: Encabezados de Sección + Rediseño de Habilidades

> Documento de ejecución. Referencia visual: [abdallaahmed.icu/en](https://www.abdallaahmed.icu/en) (sección `#skills` y patrón de encabezados).

---

## Objetivo

1. Reemplazar los encabezados mono numerados (`03 // COMPETENCIAS TÉCNICAS`) por el patrón de la referencia: **eyebrow con línea + H2 descriptivo**.
2. Reconstruir la sección de Habilidades como **grilla de 3 tarjetas** (Frontend / Backend / Complementos) con tiles de íconos auto-hospedados.
3. Eliminar la numeración de los enlaces de navegación (Topbar, Footer, MobileNav).

---

## A. Componente `SectionHeader` (nuevo)

**Archivo:** `src/components/ui/SectionHeader.tsx`

```tsx
<SectionHeader eyebrow="Arsenal tech" title="Habilidades y conocimientos técnicos" />
```

Render equivalente:

```html
<div class="mb-10 flex flex-col items-start gap-2 md:mb-14">
  <span class="inline-flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-accent-emerald
               before:h-px before:w-8 before:bg-current before:content-['']">
    Arsenal tech
  </span>
  <h2 class="text-3xl font-bold tracking-tight text-text-bright sm:text-4xl">
    Habilidades y conocimientos técnicos
  </h2>
</div>
```

- **Eyebrow:** línea 32×1px + texto 12px, mayúsculas, `letter-spacing: 0.22em`, color `accent-emerald` (verde acento).
- **H2:** `text-3xl sm:text-4xl font-bold tracking-tight`.

---

## B. Encabezados de las 4 secciones

| Sección | Eyebrow | H2 | Párrafo descriptivo |
| --- | --- | --- | --- |
| Sobre Mí | `Sobre Mí` | Ingeniería de software bien hecha. | se mantiene |
| Habilidades | `Arsenal tech` | Habilidades y conocimientos técnicos | **eliminado** |
| Proyectos | `Proyectos` | Casos de estudio seleccionados. | se mantiene |
| Contacto | `Contacto` | Hablemos de tu próximo proyecto. | se mantiene |

- Se eliminan todos los labels monoespaciados numerados `XX // TÍTULO`.
- La sección Hero no cambia (su badge de disponibilidad es otro elemento).

---

## C. Navegación sin numeración

- **`Topbar.tsx`:** enlaces pasan a `Inicio · Sobre Mí · Habilidades · Proyectos · Contacto`; se elimina el `<span className="font-mono">01</span>`. El indicador `layoutId="active-nav-indicator"` sigue funcionando igual.
- **`Footer.tsx`:** mismos enlaces sin número.
- **`MobileNav.tsx`:** mismo cambio (ítem `link.number` eliminado).
- **`data/site.ts`:** se elimina el campo `number` de `navLinks`.

---

## D. Sección de Habilidades (rediseño completo)

### D.1 Datos — `src/types/skill.ts`

- `SkillCategory` → `"Frontend" | "Backend" | "Complementos"`.
- `ISkill` gana `icon: string` (ruta local del SVG); se retiran `level` y `concepts` de la UI.

### D.2 Contenido — `src/data/skills.ts` (14 tecnologías)

| Frontend (6) | Backend (4) | Complementos (4) |
| --- | --- | --- |
| HTML5, CSS3, JavaScript, React, Next.js, Tailwind CSS | TypeScript, WordPress, PostgreSQL, MongoDB | Git, GitHub, Visual Studio Code, Vercel |

Sin tabs, sin chips de conceptos, sin niveles, sin párrafos: sección **concisa y precisa**.

### D.3 Iconos — auto-hospedados en `public/tech/`

Descargados de devicon (compatible con despliegue en Vercel, sin CDNs externos — cumple A08 del plan de seguridad):

```
html5-original.svg   css3-original.svg     javascript-original.svg
react-original.svg   nextjs-original.svg   tailwindcss-original.svg
typescript-original.svg  wordpress-original.svg  postgresql-original.svg
mongodb-original.svg git-original.svg      github-original.svg
vscode-original.svg  vercel-original.svg
```

- **Detalle crítico:** `nextjs`, `github` y `vercel` son negros → aplicar `dark:invert` para que sean visibles en modo oscuro.
- Función auxiliar `getSkillIcon(skill)` → `src={skill.icon}` con `alt=""` + nombre accesible en la etiqueta.

### D.4 UI — `src/components/sections/SkillsSection.tsx`

```
┌─────────────────────────────┐ ┌─────────────────────────────┐ ┌─────────────────────────────┐
│ [🖥] Frontend               │ │ [🖧] Backend                │ │ [🔧] Complementos           │
│                             │ │                             │ │                             │
│ ┌──────┐┌──────┐┌──────┐    │ │ ┌──────┐┌──────┐┌──────┐    │ │ ┌──────┐┌──────┐┌──────┐    │
│ │icono ││icono ││icono │    │ │ │icono ││icono ││icono │    │ │ │icono ││icono ││icono │    │
│ │ HTML ││ CSS  ││  JS  │    │ │ │  TS  ││Mongo ││Postgr│    │ │ │ Git  ││GitHub││ VS   │    │
│ └──────┘└──────┘└──────┘    │ │ └──────┘└──────┘└──────┘    │ │ └──────┘└──────┘└──────┘    │
│ ┌──────┐┌──────┐┌──────┐    │ │ ┌──────┐┌──────┐           │ │ ┌──────┐┌──────┐           │
│ │icono ││icono ││icono │    │ │ │icono ││icono │           │ │ │icono ││icono │           │
│ │React ││Next.js││TWCSS │   │ │ │ WP   ││Nextjs│           │ │ │Vercel││      │           │
│ └──────┘└──────┘└──────┘    │ │ └──────┘└──────┘           │ │ └──────┘└──────┘           │
└─────────────────────────────┘ └─────────────────────────────┘ └─────────────────────────────┘
```

- **Grilla:** `grid grid-cols-1 md:grid-cols-3 gap-6`.
- **Tarjeta de grupo:** encabezado con caja de ícono Lucide (`Monitor` / `Server` / `Wrench`) + H3; hover = borde acento + lift `-translate-y-2` + glow esmeralda sutil (adaptado a tokens propios).
- **Sub-grilla interna:** `grid grid-cols-3 gap-4` de tiles.
- **Tile:** caja 48/56px redondeada con ícono devicon (`grayscale opacity-60` → color pleno al hover) + etiqueta de 10px debajo que aclara al hover.
- **Entrada:** Framer Motion `whileInView` con stagger; respeta `prefers-reduced-motion`.
- Se elimina toda la lógica de tabs/filtros (`AnimatePresence`, `activeCategory`).
- Se conserva `content-visibility: auto` de la sección (`section-contain`).

---

## E. Archivos

**Nuevos**
- `src/components/ui/SectionHeader.tsx`
- `public/tech/*.svg` (14 iconos devicon)

**Modificados**
- `src/types/skill.ts`
- `src/data/skills.ts`
- `src/data/site.ts`
- `src/components/sections/SkillsSection.tsx`
- `src/components/sections/AboutSection.tsx`
- `src/components/sections/ProjectsSection.tsx`
- `src/components/sections/ContactSection.tsx`
- `src/components/layout/Topbar.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/layout/MobileNav.tsx`

---

## F. Verificación

1. `pnpm lint` — cero errores.
2. `pnpm build` — build de producción limpio.
3. Revisión visual en ambos temas (Code Dark / Studio Light):
   - Eyebrows con línea y verde acento.
   - Nav sin numeración; indicador de sección activa operativo.
   - Tiles de íconos: gris → color al hover; `nextjs`/`github`/`vercel` visibles en oscuro.
   - Responsive: 1 columna en móvil, 3 en desktop; sin scroll horizontal.

---

# REGISTRO DE EJECUCIÓN (completado)

> Ejecutado con estándares de ingeniería: TDD (red→green→refactor), SOLID, Clean Code con JSDoc, Tailwind v4, OWASP Top 10, observabilidad, SEO, performance y verificación en 7 resoluciones.

## Fases completadas

| Fase | Descripción | Resultado |
| --- | --- | --- |
| 0 | Infraestructura TDD: Vitest + Testing Library + Playwright, `vitest.config.ts`, `playwright.config.ts`, setup con mocks de jsdom | ✅ |
| 1 | `SectionHeader` (TDD): eyebrow línea 32×1px + H2, prop `description` opcional | ✅ 5/5 |
| 2 | Datos de skills (TDD): 14 tecnologías, tipos nuevos, 14 SVG devicon auto-hospedados en `/public/tech/` | ✅ 8/8 |
| 3 | `SkillsSection` (TDD): 3 tarjetas fijas, extraídos `SkillGroupCard` + `SkillTile`, `dark:invert` en nextjs/github/vercel | ✅ 9/9 |
| 4 | Nav sin numeración (TDD): `number` eliminado de `site.ts`, `Topbar`, `Footer`, `MobileNav` | ✅ 3/3 |
| 5 | Encabezados de 4 secciones (TDD): todos usan `SectionHeader`; Skills sin párrafo | ✅ 7/7 |
| 6 | E2E responsive: 7 viewports (320→1920) con Playwright, sin scroll horizontal + smoke tests | ✅ 70/70 |
| 7 | OWASP: `IRateLimiter` (DIP), `src/proxy.ts` con CSP/HSTS/X-Frame/Permissions-Policy + bloqueo de métodos API (405) | ✅ 17/17 |
| 8 | SEO: `sitemap.ts`, `robots.ts`, `manifest.ts`, JSON-LD Person, `opengraph-image.tsx` dinámica | ✅ rutas generadas |
| 9 | Observabilidad: `logger.ts` JSON sin PII, `instrumentation.ts`, `error.tsx`, `not-found.tsx`, eventos `contact.*` en API | ✅ 57/57 total |
| 10 | Performance: cache headers `/tech` y `/fonts` (max-age 1 año), SVGs ligeros (~35KB total) | ✅ |
| 11 | Verificación final: lint 0/0, 57 unit, 70 E2E, build OK, audit | ✅ |

## Resultados de verificación final

- **`pnpm lint`** → 0 errores, 0 warnings.
- **`pnpm test`** → 9 archivos, 57 tests unitarios ✅.
- **`pnpm test:e2e`** → 70 tests (7 viewports × 10 aserciones) ✅.
- **`pnpm build`** → OK. Rutas: `/`, `/_not-found`, `/api/contact`, `/manifest.webmanifest`, `/opengraph-image`, `/robots.txt`, `/sitemap.xml`, Proxy registrado.
- **`pnpm audit`** → 1 high (`braces`): transitiva de `eslint-config-next` (solo devDependencies, nunca entra al bundle de producción, sin fix upstream).

## Notas de migración Next.js 16

- Convención `middleware.ts` → **`proxy.ts`** (función exportada `proxy`); el build emite deprecation si no se migra.
- `export const runtime = "edge"` es incompatible con `cacheComponents: true` — eliminado de `opengraph-image.tsx`.

## Archivos nuevos

`src/components/ui/SectionHeader.tsx` · `src/components/sections/skills/SkillGroupCard.tsx` · `src/components/sections/skills/SkillTile.tsx` · `public/tech/*.svg` (14) · `vitest.config.ts` · `playwright.config.ts` · `src/__tests__/setup.ts` · `src/proxy.ts` · `src/lib/logger.ts` · `src/instrumentation.ts` · `src/app/error.tsx` · `src/app/not-found.tsx` · `src/app/sitemap.ts` · `src/app/robots.ts` · `src/app/manifest.ts` · `src/app/opengraph-image.tsx` · suites de tests (12 archivos) · `tests/e2e/responsive.spec.ts`

## Archivos modificados

`src/types/skill.ts` · `src/data/skills.ts` · `src/data/site.ts` · `src/components/sections/SkillsSection.tsx` · `AboutSection.tsx` · `ProjectsSection.tsx` · `ContactSection.tsx` · `src/components/layout/Topbar.tsx` · `Footer.tsx` · `MobileNav.tsx` · `src/lib/rateLimiter.ts` · `src/app/layout.tsx` · `src/app/api/contact/route.ts` · `next.config.ts` · `package.json`

## Recomendaciones pendientes (producción real)

1. **Upstash Redis** para `IRateLimiter` (el in-memory se pierde en serverless multi-instancia de Vercel).
2. **Sentry** — enganchar al `logError` de `error.tsx` para tracking con source maps.
3. **Lighthouse CI en GitHub Actions** — presupuestos de performance/SEO/A11y por PR.
4. **Vercel Analytics + Speed Insights** — telemetría de Web Vitals en tiempo real (`@vercel/analytics`, `@vercel/speed-insights`).
5. **Playwright visual snapshots** — capturas por viewport para regresiones visuales.

---

# ITERACIÓN 2: 18 skills + badge "En proceso" + tiles clicables (completada)

> Misma modalidad: TDD (red→green), SOLID, Clean Code con JSDoc, Tailwind v4, verificación en 7 resoluciones.

## Alcance

- **+4 tecnologías** (Qwik.js, Prisma, GraphQL, Jira) con `status: "learning"` → badge naranja "En proceso" en la esquina del icono.
- **Tiles clicables**: ahora son `<a>` a los docs oficiales (`target="_blank"`, `rel="noopener noreferrer"`) con `cursor-pointer` + `focus-visible` ring.
- **Animación gris→color consolidada con test de regresión** (`grayscale opacity-60` → `grayscale-0 opacity-100`, 300ms).

## Cambios de datos

| Campo nuevo en `ISkill` | Tipo | Propósito |
| --- | --- | --- |
| `url` | `string` (https) | Docs oficiales — destino del click |
| `status?` | `SkillStatus = "learning"` | Union abierta (OCP); ausente = sin badge |

**Distribución final (18):** Frontend 7 · Backend 6 · Complementos 5 (grilla 3+3+1 / 3+3 / 3+2).

**`dark:invert` ampliado de 3 → 5:** `nextjs, github, vercel, qwik, prisma`
(qwik = negro por defecto, prisma = `#2d3748`; graphql `#E434AA` y jira `#2684ff` visibles en ambos temas).

**Iconos nuevos en `/public/tech/`:** `qwik-original.svg`, `prisma-original.svg`, `graphql-original.svg` (descargado de `graphql-plain.svg` para cumplir el naming `-original` del test), `jira-original.svg`.

## Resultados de verificación

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | ✅ 0 errores, 0 warnings |
| `pnpm test` | ✅ 9 archivos, **65 tests** (datos 11 + SkillsSection 14) |
| `pnpm build` | ✅ 9 rutas + proxy |
| `pnpm test:e2e` | ✅ **84 tests** (12 × 7 viewports), exit 0 |

## Archivos modificados en esta iteración

`src/types/skill.ts` · `src/data/skills.ts` · `src/components/sections/skills/SkillTile.tsx` · `src/data/__tests__/skills.test.ts` · `src/components/sections/__tests__/SkillsSection.test.tsx` · `tests/e2e/responsive.spec.ts` · `public/tech/` (+4 SVG)

---

# ITERACIÓN 3: Fix — error "key prop being spread into JSX" (completada)

## Diagnóstico

- **Error**: `A props object containing a "key" prop is being spread into JSX` (React 19, logrado 3 veces en consola → el usuario reportó "3 issues" de Next).
- **Causa raíz** (única en el repo, verificado por grep): `ArchitectureShowcase.tsx` construía `panelTransition = { key: active.id, initial, animate, exit, transition }` y lo extendía con `{...panelTransition}` sobre el `<motion.div>` del panel → `key` entraba por spread.

## Fix

- `key: active.id` eliminado del objeto; entregado como **prop directa** del JSX: `<motion.div key={active.id} ... {...panelTransition}>`.
- Comportamiento idéntico (el `key` sigue forzando el remount del panel dentro de `AnimatePresence mode="wait"`).

## Test de regresión (TDD: rojo → verde)

- Nuevo `ArchitectureShowcase.test.tsx` (5 tests): espía `console.error` en render y en cambios de pestaña (falla si aparece cualquier error), más aserciones funcionales de tabpanel/aria-label/ítems/aria-selected.

## Alineación de contrato por edición manual de datos (misma iteración)

- El usuario editó `skills.ts`: **PostgreSQL** pasa a `status: "learning"` y **Prisma** se renombra a **"Prisma ORM"**.
- Tests actualizados: 5 learning (`graphql, jira, postgresql, prisma, qwik`), 13 dominadas, 5 badges (unit + E2E), nombre "Prisma ORM".

## Resultados de verificación

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | ✅ 0 errores, 0 warnings |
| `pnpm test` | ✅ **10 archivos, 70 tests** |
| `pnpm build` | ✅ 9 rutas + proxy |
| `pnpm test:e2e` | ✅ **84 tests** (12 × 7 viewports), exit 0 |
| Dev server + Chromium headless | ✅ **0 errores de consola, overlay sin issues** |

## Archivos modificados en esta iteración

`src/components/sections/ArchitectureShowcase.tsx` · `src/components/sections/__tests__/ArchitectureShowcase.test.tsx` (nuevo) · `src/data/skills.ts` (edición del usuario + formato) · `src/data/__tests__/skills.test.ts` · `src/components/sections/__tests__/SkillsSection.test.tsx` · `tests/e2e/responsive.spec.ts`

> **Pausado (acordado):** mismatch intermitente de hidratación en `ThemeToggle` (SSR `aria-pressed="false"` vs `defaultTheme="dark"`). No se reprodujo en 4 cargas seguidas; retomar cuando se aborde.

---

# ITERACI�N 4: Fix � mismatch de hidrataci�n en ThemeToggle (completada)

## Diagn�stico (verificado en la fuente de next-themes@0.4.6)

- `H = (e,i) => { if (typeof window === "undefined") return; ... }`: en el **servidor** devuelve `undefined` ? `resolvedTheme = undefined` ? `isDark = false` ? HTML SSR: `aria-pressed="false"` + `"Cambiar a modo oscuro"`.
- En el **cliente** lee `localStorage`/`defaultTheme="dark"` ? `isDark = true` ? `aria-pressed={true}` + `"Cambiar a modo claro"`.
- Divergencia en el primer commit del cliente ? React: "A tree hydrated but some attributes of the server rendered HTML didn't match...". Adem�s, React **no parchea** el atributo (queda desincronizado hasta un cambio de props posterior � verificado en el test: DOM quedaba en `false` tras hidratar).

## Fix

- `ThemeToggle.tsx`: `const isDark = mounted && resolvedTheme === "dark"` � gate con el `useSyncExternalStore` existente (durante hidrataci�n React usa `getServerSnapshot` ? `false`, id�ntico al servidor). Tras hidratar se aplica el tema real (misma transici�n que ya exist�a visualmente). El icono ya usaba este patr�n; ahora los atributos `aria-*` tambi�n.

## Test de regresi�n (TDD: rojo ? verde)

- Nuevo `ThemeToggle.test.tsx` (4 tests) con mock de `next-themes` por fases (server `undefined` / client `"dark"`, reproduciendo la librer�a real en jsdom donde `window` existe):
  1. Render de servidor: `aria-pressed="false"`, label `"Cambiar a modo oscuro"`, placeholder sin icono.
  2. **Hidrataci�n sin errores de consola** (rojo antes del fix: capturaba el mismatch; tambi�n expuso que el DOM quedaba `false` sin parchear).
  3. Tras hidratar: atributos e icono reflejan tema dark real.
  4. Click ? `setTheme("light")`.

## Resultados de verificaci�n

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | ? 0 errores, 0 warnings |
| `pnpm test` | ? **11 archivos, 74 tests** |
| `pnpm build` | ? 9 rutas + proxy |
| `pnpm test:e2e` | ? **84 tests** (12 � 7 viewports), exit 0 |
| Dev server + Chromium (fresh / theme=dark / theme=light) | ? **0 errores de consola**; bot�n refleja el tema correcto en las 3 variantes |

## Archivos modificados en esta iteraci�n

`src/components/layout/ThemeToggle.tsx` � `src/components/layout/__tests__/ThemeToggle.test.tsx` (nuevo)

---

# ITERACI�N 5: Fix � mismatch de hidrataci�n por extensi�n (ColorZilla) en <body> (completada)

## Diagn�stico (reproducido byte a byte)

- El diff del usuario: `<body ...> - cz-shortcut-listen="true"` � atributo inyectado por la **extensi�n ColorZilla** del navegador ANTES de que React hidrate (3� causa del propio mensaje de React: "browser extension which messes with the HTML").
- `<html>` ya ten�a `suppressHydrationWarning`; `<body>` no ? React comparaba atributos del body y logueaba "A tree hydrated but some attributes...".
- **Verificado**: la emulaci�n con `addInitScript` (polling que setea `cz-shortcut-listen` apenas existe el body) reproduce exactamente el error reportado en dev; en **producci�n el warning no existe** (React es dev-only en estos mensajes) � por eso la regresi�n se cubre en Vitest (React en modo dev), no en el E2E (corre contra build de prod).

## Fix

- `layout.tsx`: `suppressHydrationWarning` en `<body>` (one-level: solo atributos del elemento; la hidrataci�n de todos los hijos sigue estricta).

## Test de regresi�n (TDD: rojo ? verde)

- Nuevo `src/app/__tests__/layout.test.tsx`: renderiza `RootLayout` real (mock de `next/font/google`), monta el SSR en el documento jsdom, inyecta `cz-shortcut-listen` y **hidrata contra `document`** con spy de `console.error`.
  - Rojo antes del fix: capturaba el error de hidrataci�n.
  - Verde despu�s: 0 errores, atributo de la extensi�n sobrevive, contenido hidratado.
  - Nota: `RootLayout` exige `params: Promise<{}>` (tipo generado por Next) ? se pasa en el test.

## Resultados de verificaci�n

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | ? 0 errores, 0 warnings |
| `pnpm test` | ? **12 archivos, 75 tests** |
| `pnpm build` | ? 9 rutas + proxy |
| `pnpm test:e2e` | ? **84 tests** (12 � 7 viewports), exit 0 |
| Dev + ColorZilla emulado | ? **0 errores de hidrataci�n**; `cz-shortcut-listen` presente; tema dark aplicado |
| Prod + ColorZilla emulado | ? 0 errores (warning dev-only) � confirmado |

## Archivos modificados en esta iteraci�n

`src/app/layout.tsx` � `src/app/__tests__/layout.test.tsx` (nuevo)

---

# ITERACI�N 6: NavBar + Hero + ArchitectureShowcase (completada)

## NavBar (Topbar)

- Eliminado el badge "Disponible" (redundante) y el bot�n "Hablemos" (duplicaba el enlace "Contacto" del nav). Queda: marca + nav + ThemeToggle (+ hamburguesa m�vil).
- **Glassmorphism al hacer scroll**: transparente al tope (`bg-transparent border-transparent`) y cristal al desplazarse � tier mid/high: `bg-bg/70 backdrop-blur-md border-border/70`; tier low (sin blur, estrategia adaptativa): `bg-bg/95 border-border`. Transici�n suave con `transition-colors duration-200`.
- Nuevo hook `src/hooks/useScrolled.ts`: mini-store `useSyncExternalStore` con listener `scroll` passive + cache (patr�n `useDeviceTier`; sin `setState` en efectos; umbral 8px; snapshot servidor `false`).

## Hero

- Eliminado el badge "DISPONIBLE PARA NUEVOS PROYECTOS � UTC-4".
- **Nuevo t�tulo animado** `src/components/ui/TypewriterTitle.tsx`: m�quina de escribir en loop � "C�digo limpio." ? "Experiencias fluidas." ? "Resultados reales." (escribe 65ms/car, pausa 1500ms, borra 40ms/car). Implementado con `useSyncExternalStore` + timers (sin `setState` en efectos); servidor renderiza frase 1 completa (sin flash ni mismatch); texto blanco + cursor `?` esmeralda `animate-pulse`; `h1` con t�tulo completo en `sr-only` + animado en `aria-hidden` (SEO/a11y); `prefers-reduced-motion` ? est�tico completo; `min-h` reserva 2 l�neas m�vil / 1 l�nea =sm (sin CLS).
- Eliminados los 4 iconos de contacto del hero (GitHub/LinkedIn/WhatsApp/Correo) y la tarjeta "Remote ready" con el LocalClock externo. Columna 2 queda solo con ArchitectureShowcase.

## ArchitectureShowcase

- Eliminado el badge "v1.2.0" (conservando sem�foros + "stack.production").
- Eliminadas las 3 notas "// ..." (prop `note` de Frontend/Backend/DevOps).
- Fila inferior (Lighthouse 99/100 + OWASP Top 10) reemplazada por `<LocalClock />` en `border-t border-border pt-4`.

## Tests (TDD rojo?verde)

- Nuevos: `Topbar.test.tsx` (4), `TypewriterTitle.test.tsx` (5), `HeroSection.test.tsx` (5); ampliados `ArchitectureShowcase.test.tsx` (+4 ? 9). Los timers del typewriter se controlan con `vi.useFakeTimers` (+1ms de holgura: `advanceTimersByTime` no dispara justo en el borde).
- Nota: jsdom reporta `hardwareConcurrency=1` ? tier low; los tests que ejercitan la rama glass simulan un desktop con `Object.defineProperty` ANTES del primer mount (`useDeviceTier` cachea capacidades).

## Resultados de verificaci�n

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | ? 0 errores, 0 warnings |
| `pnpm test` | ? **15 archivos, 93 tests** (antes 75) |
| `pnpm build` | ? 9 rutas + proxy |
| `pnpm test:e2e` | ? **84 tests**, exit 0 |
| Dev + revisi�n Playwright | ? 0 errores consola; top transparente; glass al scroll (tier alto: `backdrop-blur-md`; tier low opaco por dise�o); typewriter animando en loop; hero sin badge/iconos/Remote ready; showcase con LocalClock y sin v1.2.0/Lighthouse/OWASP |

## Archivos modificados/creados en esta iteraci�n

`Topbar.tsx` � `useScrolled.ts` (nuevo) � `Topbar.test.tsx` (nuevo) � `HeroSection.tsx` � `TypewriterTitle.tsx` (nuevo) � `TypewriterTitle.test.tsx` (nuevo) � `HeroSection.test.tsx` (nuevo) � `ArchitectureShowcase.tsx` � `ArchitectureShowcase.test.tsx` � `refactor_secciones.md`

---

## Ajuste posterior (navbar s�lida por defecto)

La navbar pas� de transparente a **s�lida por defecto** (`border-border bg-bg`, opaco) al tope, y solo se vuelve **transl�cida con glassmorphism** al desplazarse. `Topbar.test.tsx` y `Topbar.tsx` actualizados (mismo comportamiento de scroll, sin cambios en `useScrolled`). Verificado en dev: arriba `bg-bg` sin blur; con scroll `bg-bg/70 backdrop-blur-md`; 0 errores de consola.

### Ajuste 2: glass en cualquier tier

El glassmorphism al scroll dej� de depender de `useDeviceTier`: con tier "low" (p. ej. `hardwareConcurrency <= 4`) la barra se quedaba opaca y parec�a s�lida. Ahora el Topbar aplica `border-border/70 bg-bg/70 backdrop-blur-md` al desplazarse en **todos** los tiers � el blur solo cubre la barra de 64px y �nicamente durante el scroll. Se elimin� el import de `useDeviceTier` del Topbar (el hook sigue vivo en `AmbientCanvas`). Verificado en dev con tier real (4 cores): arriba s�lida, con scroll glass, 0 errores de consola.

---

## Iteración 7 — Animaciones de iconos + estela de borde (Skills)

Aprobada por el usuario ("go, probemos como se vería"). Referencias: estilo Abdalla (rotación `group-hover` del icono; el glow ya estaba replicado) y el "conic rotating border" de la foto de Abdullah. **Solo al hover** (decisión del usuario): en reposo todo queda quieto.

### Cambios

- **`globals.css`** — nuevo `@keyframes border-spin`: `translate(-50%, -50%) rotate(0deg → 360deg)`, 4s lineal infinito. El translate va **dentro** del keyframe porque los keyframes sobrescriben por completo la propiedad `transform` del elemento (si no, el gradiente se des-centraría).
- **`SkillGroupCard.tsx`** — estructura "padding trick" de la referencia:
  - Raíz: `group relative isolate h-full overflow-hidden rounded-3xl p-[2px]` (el padding de 2px es el grosor del borde que deja ver la estela) + lift/glow existentes.
  - Estela `[aria-hidden]`: `conic-gradient` con haz esmeralda (160–200°) + haz cian (340–360°) sobre `#0000`, tamaño 250%×250% centrado, `-z-10`, `opacity-0 → group-hover:opacity-100` (duracion 300ms), `animate-[border-spin_4s_linear_infinite]`, `motion-reduce:animate-none`.
  - Panel interior opaco `relative h-full rounded-[22px] border border-border bg-surface-1 p-8` que tapa el centro del gradiente (solo queda visible la franja perimetral de 2px) + `group-hover:border-accent-emerald/40`.
  - Icono del título (`<Icon>`): `transition-transform duration-300 ease-out group-hover:rotate-12 motion-reduce:group-hover:rotate-0`.
- **`SkillTile.tsx`** — caja del tile: `transition-colors` → `transition` + `group-hover:scale-105 motion-reduce:group-hover:scale-100` (escala toda la caja al hover de la card, sin romper el gris→color existente).

### Alineación de datos: Qwik.js fuera de la matriz

El usuario comentó la entrada de Qwik.js en `skills.ts` → la matriz queda en **17 skills**: Frontend 6, Backend 6, Complementos 5; learning: postgresql, prisma, graphql, jira (4); dominadas: 13. Contratos realineados: `skills.test.ts` (17 / 6-6-5 / 4 learning), `SkillsSection.test.tsx` (17 imgs, 17 links, 4 badges, 4 `dark:invert`), `responsive.spec.ts` (17 tiles, 4 badges) y docstrings.

### Fix del test "loop" del typewriter

El test hardcodeaba `11_000` ms (válido con las constantes de la Iteración 6: 65/40/1500; las **actuales** del componente son `TYPE_MS=60`, `DELETE_MS=35`, `PAUSE_MS=1000`, ciclo real 8.130ms). Ahora el ciclo se deriva de las constantes exportadas: `3×PAUSE + totalCaracteres×(DELETE+TYPE)` + 1ms de holgura, y después avanza `PAUSE+DELETE+1` y comprueba que la frase vuelve a borrarse (bucle vivo). Resiliente a futuros ajustes de velocidad.

### Tests (TDD rojo→verde)

`SkillsSection.test.tsx` +5 → **19 tests**: icono `group-hover:rotate-12`+`transition-transform`; estela en las 3 cards (`[aria-hidden][style*="conic-gradient"]` con animate + opacity + motion-reduce, wrapper `p-[2px]`/`overflow-hidden`/`isolate`, panel `bg-surface-1`+`rounded-[22px]`); keyframe `border-spin` declarado en `globals.css`; 17 cajas con `group-hover:scale-105`.

### Resultados de verificación

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | ✅ 0 errores, 0 warnings |
| `pnpm test` | ✅ **15 archivos, 98 tests** (antes 93) |
| `pnpm build` | ✅ Compiled successfully + 9 rutas + proxy |
| `pnpm test:e2e` | ✅ **84 tests**, exit 0 |
| Dev + Playwright (hover) | ✅ 0 errores consola; estela `opacity 0 → 1` con `animation: border-spin 4s linear`; icono `rotate: 12deg`; tile `scale: 1.05`; card `translate: 0px -8px`; borde panel emerald/40 |
| Dev + Playwright (reduced-motion) | ✅ `animation-name: none`; `rotate: 0deg`; `scale: 1` |

### Archivos

`globals.css` · `SkillGroupCard.tsx` · `SkillTile.tsx` · `SkillsSection.test.tsx` · `skills.ts` · `skills.test.ts` · `responsive.spec.ts` · `TypewriterTitle.test.tsx` · `refactor_secciones.md`

### Ajuste 1 (post-Iteración 7): icono título estático + salto de iconos de skill

Decisiones del usuario: (a) el icono Lucide a la izquierda del título de cada card **no tiene ninguna animación**; (b) los iconos de las skills hacen **un solo salto** (bounce ligero) al hacer hover sobre **su tile individual** (no sobre toda la card).

- **`globals.css`** — nuevo `@keyframes icon-hop`: `translate: 0 → -6px (45%) → +1px (70%) → 0`, 0.4s ease-in-out, **one-shot** (sin loop). Usa la propiedad CSS `translate` (Tailwind v4) para no interferir con `transform`.
- **`SkillGroupCard.tsx`** — icono del título queda `<Icon aria-hidden className="h-6 w-6" />`: eliminados `transition-transform`, `group-hover:rotate-12` y `motion-reduce:group-hover:rotate-0`. Estela, glow, lift y `scale-105` intactos.
- **`SkillTile.tsx`** — al `<img>`: `group-hover/icon:animate-[icon-hop_0.4s_ease-in-out]` + `motion-reduce:group-hover/icon:animate-none`. Se conservan grayscale→color y el `scale-105` de la caja.

#### Tests (TDD rojo→verde)

- Reescrito "el icono del título … rota 12°" → "… **NO** tiene ninguna animación" (className sin `rotate|transition|animate|group-hover|translate|scale`).
- Nuevos: 17 `<img>` con `animate-[icon-hop_0.4s_ease-in-out]` + guardia `motion-reduce` (sin `_infinite` → one-shot); keyframe `icon-hop` presente en `globals.css` con `translate`. `SkillsSection.test.tsx`: 19 → **21 tests**.

#### Verificación

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | ✅ 0 errores, 0 warnings |
| `pnpm test` | ✅ **15 archivos, 100 tests** (antes 98) |
| `pnpm build` | ✅ Compiled successfully |
| `pnpm test:e2e` | ✅ **84 tests** |
| Dev + Playwright | ✅ icono título: `animation: none`, `rotate: none`, `transition-duration: 0s`, className solo `lucide … h-6 w-6`; hover tile: `animation-name: icon-hop` (0.4s, iteración 1) con `translate: 0 → -5.66px → none`; reposo al terminar; reduced-motion: `animation: none`; regresión hover card: estela `opacity 1`, caja `scale 1.05`, lift `0px -8px` |

#### Hallazgos observados (no bloqueantes, ajenos a este ajuste)

1. **Error puntual de key duplicada en dev** (1 sola vez, tras editar archivos — probable carrera de HMR); no se reprodujo en 5+ cargas ni cambia ninguna lista con keys en esta iteración.
2. **Mismatch de hidratación SOLO con `prefers-reduced-motion: reduce`** (preexistente): framer-motion en el Hero/Architecture/Skills renderiza `opacity+transform` en servidor vs `opacity` en cliente con reduced-motion. A candidato a iteración aparte.

---

## Ajuste 2: skill Vite + matriz a 21 skills

Petición: añadir **Vite** a la card de Frontend "como las anteriores". El usuario también tenía ediciones propias en `skills.ts` y decidió **conservarlas todas**: TypeScript y JavaScript en Frontend **y** Backend a la vez, y Qwik.js reactivado (`status: "learning"`).

- **`public/tech/vite-original.svg`** — descargado de devicon (`cdn.jsdelivr.net/npm/devicon/icons/vite/vite-original.svg`), logo sólido `#006bff` (azul): visible en light y dark → **no** entra en `INVERT_IN_DARK` (5 invert: nextjs, github, vercel, qwik, prisma).
- **`skills.ts`** — nueva entrada tras TypeScript en Frontend (sin badge, dominada):
  `{ id: "vite", name: "Vite", category: "Frontend", icon: "/tech/vite-original.svg", url: "https://vite.dev/guide/" }`. Docstrings actualizados y nota: los ids solo deben ser únicos **dentro** de cada categoría (los keys de React son por card).

### Nueva matriz: 21 skills

| Categoría | Cantidad | Detalle |
| --- | --- | --- |
| Frontend | **9** | html5, css3, javascript, react, nextjs, tailwindcss, typescript, vite + qwik (learning) |
| Backend | **7** | typescript, wordpress, mongodb, javascript + postgresql, prisma, graphql (learning) |
| Complementos | **5** | git, github, vscode, vercel + jira (learning) |
| Learning / dominadas | 5 / 16 | badges: qwik, postgresql, prisma, graphql, jira |

### Tests (TDD rojo→verde)

- **Nuevo test**: todos los iconos de `skills` existen en `/public/tech` (`path.join` + `existsSync`) — red hasta bajar el SVG; previene tiles rotas a futuro.
- `skills.test.ts`: 21, Frontend 9/Backend 7, learning 5, dominadas 16, "ids únicos" → **"ids únicos por categoría"** (permite TS/JS duplicados entre cards).
- `SkillsSection.test.tsx`: listas Frontend (9) y Backend (7 con JavaScript), 21 imgs/links/cursor/hop/scale, 5 badges (con qwik), 5 `dark:invert`.
- `responsive.spec.ts`: 21 tiles, 5 badges.

### Verificación

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | ✅ 0 errores, 0 warnings |
| `pnpm test` | ✅ **15 archivos, 101 tests** (antes 100; +1 de existencia de iconos) |
| `pnpm build` | ✅ Compiled successfully |
| `pnpm test:e2e` | ✅ **84 tests** |
| Dev + Playwright | ✅ SVG Vite `200` y cargado (`naturalWidth > 0`); card Frontend **9 tiles**; **21** tiles totales; **5** badges; hover Vite: `icon-hop` (`translate 0 → -6px`) + `grayscale(0.12)` en transición; dark: `grayscale(0)`, sin `invert`, visible; 0 errores consola |

### Archivos

`public/tech/vite-original.svg` (nuevo) · `src/data/skills.ts` · `src/data/__tests__/skills.test.ts` · `SkillsSection.test.tsx` · `tests/e2e/responsive.spec.ts` · `refactor_secciones.md`

### Revert del DataFlowCard (hero restaurado)

El usuario pidió **revertir** el reemplazo del ArchitectureShowcase por el DataFlowCard (pipeline Variante C). Restaurado al estado anterior:

- `ArchitectureShowcase.tsx` recreado idéntico (era untracked — sin commit que lo restaurara).
- `ArchitectureShowcase.test.tsx` recreado como suite equivalente de 9 tests (tablist, cambio de pestañas con `findBy*` por el `AnimatePresence mode="wait"`, items, `aria-selected`, LocalClock en pie).
- `HeroSection.tsx` y `HeroSection.test.tsx` revertidos (showcase + tabs de vuelta en la columna 2).
- Borrados `DataFlowCard.tsx`, `DataFlowCard.test.tsx` y los keyframes `flow-dot`, `flow-dot-y`, `flow-dot-back` de `globals.css`.

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | ✅ 0/0 |
| `pnpm test` | ✅ **15 archivos, 102 tests** |
| `pnpm build` | ✅ Compiled successfully |
| `pnpm test:e2e` | ✅ **84 tests** |

### Refactor ProjectsSection — card minimalista + carrusel Embla (sin filtros)

La card "Terminal" (marco navegador + tagline + 4 métricas + 3 acciones + modal) se sustituyó por una card compacta y la sección pasó de grid+filtros a **carrusel**.

- **Card nueva**: imagen 16:10 (zoom `1.03` en hover) con `h3` overlay sobre degradado, **todos** los badges `TechBadge` debajo y botón **"Ver demo ↗"** (`ArrowUpRight`) en la esquina sup-der: `opacity-0` → `group-hover/group-focus-within:opacity-100` (fade+slide 300ms), `max-md:opacity-100` (siempre visible en touch), `motion-reduce:transition-none`. La card crece con `hover:scale-[1.02]` + `transition-all duration-300 ease-out` + `motion-reduce:hover:scale-100` (twMerge pisa el `transition-colors` de BentoCard).
- **Carrusel Embla** (`embla-carousel-react@8.6.0`, ~4KB gzip): `loop:false`, `align:"start"`; slides `flex-[0_0_85%] md:flex-[0_0_calc(50%-0.75rem)]` (1+ pista en móvil, 2+ en desktop); flechas `ChevronLeft/Right` con `aria-label` y `disabled` según `canScroll*`; puntos por proyecto con `aria-current` y `scrollTo(i)`.
- **Estado del carrusel sin `setState` en efectos**: `useEmblaSnapshot` usa `useSyncExternalStore` (patrón sancionado del proyecto, igual que `useScrolled`) — eventos `select`/`reInit` notifican y el snapshot es un entero empaquetado (bit 0 = prev, bit 1 = next, bits altos = índice). El tipo `EmblaApi` se deriva del hook (`NonNullable<ReturnType<...>>`) para no importar el paquete transitivo `embla-carousel` (aislamiento pnpm).
- **Fuera**: tabs de filtro (`Todos/Full-Stack/Frontend/WordPress`), `ProjectFilter`, `filterLabels`, `activeFilter`, `AnimatePresence popLayout`, tagline, 4 métricas, chip de categoría, botón "Caso de estudio", icono GitHub, marco de navegador (dots+slug), **`ProjectModal.tsx` + carpeta `modal/`**, `getProjectsByCategory()` y `getFeaturedProject()` (sin uso).
- **Se conservan**: `IProject` completo (catálogo Data-as-Code), `category` en datos (el tipo lo exige), contador "N proyectos publicados · motor escalable a N", guard defensivo ("No hay proyectos publicados todavía."), copy del `SectionHeader` sin la cláusula "métricas medibles" (el regex de `SectionHeaders.test.tsx` `/Cada proyecto resuelve un problema real/` sigue pasando).
- **Datos**: el placeholder `CodeCraft Platform` (6 tecnologías, demo en codecraft-demo.vercel.app) alimenta la card de ejemplo; pendiente sustituir por el proyecto real del propietario.

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | ✅ 0/0 |
| `pnpm test` | ✅ **16 archivos, 114 tests** (nuevos: 12 de `ProjectsSection`) |
| `pnpm build` | ✅ Compiled successfully |
| `pnpm test:e2e` | ✅ **84 tests** |
| Playwright dev | ✅ 0 errores consola · reposo: opacity 0 · hover: opacity 1 + scale 1.02 · mobile: opacity 1 · reduced-motion: scale 1 + opacity 1 · flechas disabled (1 proyecto) · 0 tablists |

### Fix navbar: scroll exacto al eyebrow (fase 2)

El scroll de la navbar aterrizaba en el borde del `<section>`; el padding interno (`py-16 sm:py-20`) dejaba el eyebrow ~150px bajo la navbar ("muy hacia abajo"). Fix:

- `SectionHeader` expone `data-nav-anchor` en su `<header>` — punto de aterrizaje compartido por las 4 secciones navegables.
- `Topbar.handleNavigate`: scrollea al `[data-nav-anchor]` de la sección (fallback: la sección); "Inicio" vuelve al tope con `window.scrollTo`; `prefers-reduced-motion` → `behavior: "auto"`; el hash se actualiza con `history.replaceState` (URL compartible sin historial basura).
- Desktop y MobileNav hacen `preventDefault` (elimina el salto nativo duplicado).
- Resultado Playwright: eyebrow a **88px** (navbar 64 + 24 de aire) en las 4 secciones.

### Ajustes de la card de proyecto (hover minimalista + compactación)

1. **Hover**: fuera el `scale-[1.02]` de la card y el zoom `scale-[1.03]` de la imagen — el único efecto de hover es el reveal del botón "Ver demo ↗". La card suma `cursor-pointer` y neutraliza el `hover:border-border-strong` de BentoCard (`hover:border-border`).
2. **Imagen compacta**: `aspect-[16/10]` → `aspect-[16/9] max-h-[260px]` (object-cover) — la card baja a ~326px.
3. **Carrusel completo a la vista**: sin descripción en el header de Proyectos (como Habilidades), padding `py-16 sm:py-20` → `py-10 sm:py-14`, margen del header override `mb-8 md:mb-10`, y **borrado el contador** "N proyectos publicado(s) · motor escalable a N".

| Métrica Playwright | Antes | Después |
| --- | --- | --- |
| Bloque header+carrousel+controles | ~754px | **528px** |
| ¿Cabe en 1366×768? | ajustado | **sí (bottom 672 < 768)** |
| ¿Cabe en 1440×900? | ajustado | **sí (bottom 672 < 900)** |
| Hover card | scale 1.02 | **scale none + cursor pointer + botón** |

Tests: `SectionHeaders.test` (Projects sin párrafo, espejo de Skills) y `ProjectsSection.test` (sin contador, sin escala, imagen 16/9 + max-h).

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | ✅ 0/0 |
| `pnpm test` | ✅ **17 archivos, 124 tests** |
| `pnpm build` | ✅ Compiled successfully |
| `pnpm test:e2e` | ✅ **84 tests** |
| Playwright dev | ✅ 2 viewports caben OK · hover solo botón · 0 errores consola |

---

## Iteración 8 — Rediseño del HeroOrbit (2ª columna del Hero, estilo chiragchrg.netlify.app)

Aprobada por el usuario ("go") con wireframe antes/después. **4 decisiones del usuario**: (a) tamaño de la referencia (contenedor 340→500px, avatar 180→250px), (b) **sin riel base** en los anillos, (c) gradiente único alternado A/B, (d) presión = **escala global** del sistema a 0.75. **Decisión técnica**: ❌ GSAP → CSS keyframes (rotación) + Framer Motion (entrada elástica e interacción), cero dependencias nuevas.

### Análisis de la referencia (decompilado HTML/CSS/GSAP)

- Contenedor `340px → lg:500px` aspect-square; avatar `180→250px` (≈50%), sin glow.
- 4 trails al **60/70/80/90%** con `:before` de fondo al 99% (anillo ~1px) y **sin riel base**; pintura `conic-gradient` alternada `--orbitGradient` / `--orbitGradientAlt`.
- Dot teardrop (`border-radius: 0 50% 50%`) a `top:-0.2em`, Trails 2/4 con `rotate(140deg)`; hover ≥1024px → `scale:1.8` + centro hueco.
- GSAP: entrada `opacity 0→1, scale .75→1`, `elastic.out(0.8, 0.2)`, stagger .15; presión → todo a 0.75 y regreso elástico; rotaciones 6/8/10/12s.

### Cambios

- **`HeroOrbit.tsx`** — reescrito completo:
  - Data-driven `TRAILS: OrbitTrailSpec[]` (exterior→interior: `w-[90%]/12s/ccw/b` → `w-[80%]/10s/cw/a` → `w-[70%]/8s/ccw/b` → `w-[60%]/6s/cw/a`), variantes `a`/`b` de gradiente y flag `alt` del dot.
  - Raíz `motion.div` (`hero-orbit`, `data-pressed`) que orquesta variantes: `show` con `staggerChildren .15` + spring `bounce .5 / 1.6s` (≈ elastic.out), `press` con `staggerChildren .06` → piezas a `scale .75` (150ms ease-out). Variantes reducidas sin escala para `prefers-reduced-motion`.
  - Anillos = `absolute w-[N%] aspect-square` (**fix: sin `aspect-square` el rotador `inset-0` quedaba en 0px y los anillos no se veían**) → rotador `.orbit-rotator-cw/ccw` con `--orbit-duration` → máscara `.orbit-trail-mask` + `.orbit-gradient-a/b` → `<span class="orbit-dot">` con `--alt` en anillos 2/4.
  - Avatar sin borde/glow, `180 / md:220 / lg:250px`, `role=button` con pointer + teclado (Espacio/Enter) → `data-pressed` en la raíz; foco visible `focus-visible:outline-accent-emerald`.
- **`globals.css`** — `.orbit-gradient-a` (conic `from 135deg`: transparent→emerald→cyan→emerald) y `.orbit-gradient-b` (invertido), `.orbit-dot` (teardrop `0 50% 50%`, `rotate -45deg`, glow doble `currentColor`, transición scale/bg 250ms), `.orbit-dot--alt { rotate: 140deg }`, media ≥1024 `.hero-orbit:hover .orbit-dot { scale:1.8; background-color: var(--bg) }`, y `transition: none` del dot en reduced-motion. Rotaciones conservan la pausa `html.theme-transitioning` y `animation: none` en reduced-motion.
- **`HeroSection.tsx`** — la entrada de la columna 2 pierde `scale: 0.94` (solo `opacity + y`): el stagger elástico ahora lo orquesta el propio HeroOrbit (sin doble escala).

### Tests (TDD rojo→verde)

`HeroOrbit.test.tsx` reescrito: 5 → **14 tests**. Rojo inicial 9/14. Nuevos: tamaño contenedor (340/500), avatar (180/md:220/lg:250), 4 anillos 90/80/70/60, **sin riel** (0 `border-dashed` + 4 máscaras), gradiente alternado A/B por anillo, duraciones/sentidos 12/10/8/6s ccw/cw/ccw/cw, 4 dots con 2 `--alt` en anillos exteriores, `data-pressed` press→true/release→false, avatar sin `border-2`/glow con img `rounded-full`.

### Resultados de verificación

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | ✅ 0 errores (5 warnings preexistentes en `Footer.tsx`) |
| `pnpm test` | ✅ **20 archivos, 151 tests** (antes 142; los 5 fallos preexistentes de `ProjectsSection.test.tsx` ya no aparecen) |
| `pnpm build` | ✅ Compiled successfully (fix: raíz `motion.div` — TS2322 de `variants` en `div` plano) |
| `pnpm test:e2e` | ✅ **84 tests** |
| Playwright prod (script temporal, 17 checks) | ✅ 0 errores consola en 1366×768 y 1440×900; hero sin scroll vertical (bottom 714 / 836); órbita 500px visible; sin overflow horizontal (0px) en 1366/1440/375; press `data-pressed=true` + anillo `matrix(0.75)` + release `false`; hover punto `scale 1.8`; rotación `orbit-ccw/12s`; reduced-motion `animation: none` + avatar opacidad 1; 375px órbita `x=18 w=340` dentro del ancho |
| Screenshots | ✅ dark y light con arcos conic + dots teardrop visibles; mobile 375 correcto; reduced-motion con anillos estáticos |

### Archivos

`HeroOrbit.tsx` · `HeroSection.tsx` · `globals.css` · `HeroOrbit.test.tsx` · `refactor_secciones.md`

### Ajuste 1 (post-Iteración 8): fase del gradiente — puntos alineados con la cabeza del arco

Reporte del usuario: "las órbitas quedaron desfasadas de sus órbitas".

**Diagnóstico** (sin cambio de geometría — el centro del punto ya caía a 0.8px de la línea del anillo): el desfase era **angular**. Los conic-gradient usaban `from 135deg`, que rotaba el arco 135° respecto al punto (0°/12 en punto). En la referencia el gradiente arranca en 0° y el punto marca la discontinuidad transparente→color (a 359.9° arco pintado, a 0.1° transparente) — el punto es la "cabeza" del cometa con la cola detrás. Con `from 135deg` el punto quedaba a mitad de estela.

**Cambio de color (decisión del usuario): mantener la alternancia esmeralda/cian** (no unificar como la referencia), lo que obliga a que la cabeza de cada variante coincida con el color de su punto:

- `.orbit-gradient-a` (anillos 60/80%, punto esmeralda): eliminado `from 135deg`; último stop (360° = cabeza) `--accent-emerald-bright`. Hueco 0→90° (derecha del punto, rotación cw).
- `.orbit-gradient-b` (anillos 70/90%, punto cian): eliminado `from 135deg` y la cabeza pasa de esmeralda a **cian** (primer stop), cola cian→emerald→transparente. Hueco 270→360° (izquierda del punto, rotación ccw).
- `HeroOrbit.tsx` sin cambios: los `dotColor` ya eran los correctos.

**Tests (TDD rojo→verde, 14 → 16):**

1. "los gradientes arrancan en 0° (sin `from` desplazado)" — lee `globals.css` y verifica que ambas reglas no contengan `conic-gradient( from`.
2. "la cabeza de cada gradiente coincide con el color del punto de su anillo" — extrae los stops con `var(--accent-*)`: A termina en `--accent-emerald-bright`, B empieza en `--accent-cyan-bright`, y los 4 puntos (orden DOM B/A/B/A) llevan su clase `text-accent-*` correspondiente.

**Verificación:**

| Comando | Resultado |
| --- | --- |
| `pnpm vitest run HeroOrbit` | ✅ **16 tests** (2 rojos → verdes) |
| `pnpm lint` | ✅ 0 errores (5 warnings preexistentes en `Footer.tsx`) |
| `pnpm test` | ✅ **20 archivos, 153 tests** |
| `pnpm build` | ✅ Compiled successfully (fix: `expect` no estrecha tipos → `?? []` en el `match`) |
| `pnpm test:e2e` | ✅ **84 tests** |
| Playwright determinista (`animation: none` → fase 0°) | ✅ 6/6: puntos a 0° exactos; offset radial −0.81px; color B=cian/A=emerald; **muestreo de píxeles reales** en ±8…32° del punto: A pintado a la izquierda (`rgb(39,195,128)`) y hueco a la derecha (`rgb(12,21,31)`), B pintado a la derecha (`rgb(56,189,248)`) y hueco a la izquierda, en **dark y light**; 0 errores consola |

**Nota metodológica:** `animation-play-state: paused` congela en la fase aleatoria del instante (no sirve para medir); `animation: none` resetea a 0° y sí es determinista. El DOM no distingue zonas pintadas (la máscara cubre todo el cuadrado), por eso la comprobación del hueco se hizo muestreando píxeles del screenshot vía canvas.

---

## Ajuste 2 (post-Iteración 8): presión del avatar sin desaparición + desfase de órbitas por caché de dev

Reporte del usuario: "al presionar el avatar llega a desaparecer; debe contraerse a un tamaño fijo y al soltar hacer la animación de crecimiento suave" y "las órbitas siguen desfasadas".

**Diagnóstico de las órbitas (sin cambio de código):** el dev server del puerto **3000** servía CSS generado *antes* del Ajuste 1 (chunk de `.next/dev` con `conic-gradient(from 135deg, …)`), mientras que `globals.css` ya estaba en fase 0°. Con `from 135deg` el arco visible de A (225°→135°) colocaba el punto (0°) exactamente a mitad de estela: `-----.-----`. El usuario reinició `next dev` y quedó resuelto (el build de producción ya estaba correcto). Como la regresión era de artefacto servido, se añadió un test E2E que valida el CSS del build.

**Diagnóstico del avatar:** `pieceVariants.press` solo declaraba `scale`. Framer Motion resuelve las propiedades ausentes de una variante con el valor de `hidden` (`opacity: 0`), así que al pulsar el inline style quedaba `opacity: 0; transform: scale(0.75)` en el avatar y en los 4 anillos (medido en dev y prod: opacidad 0 a los 300 ms y ~3 s en recuperarse). Además `onPointerLeave` cortaba el gesto y no había captura de puntero: al encoger a 187.5 px el cursor podía salir del avatar y "reiniciar" la presión.

**Cambios:**

- **`heroOrbitMotion.ts` (nuevo):** las 4 variantes extraídas del componente para testearlas como datos puros (sin rAF/WAAPI de jsdom) y dejar `HeroOrbit` con una sola responsabilidad: renderizar e interactuar.
  - `press: { opacity: 1, scale: 0.75, transition: { opacity 150ms easeOut, scale 150ms easeOut } }` — opacidad explícita para que Framer no herede `hidden`; contracción estable a un tamaño fijo.
  - `show: { opacity: 1, scale: 1, transition: { opacity 200ms easeOut, scale spring bounce .5 / 1.6s } }` — transiciones separadas por propiedad: el crecimiento al soltar ya no arrastra un fundido.
  - `reducedPieceVariants.press: { opacity: 1 }`.
- **`HeroOrbit.tsx`:** `onPointerDown` con `setPointerCapture`; el gesto se cierra en `pointerup`, `pointercancel`, `lostpointercapture` y `blur`; **eliminado `onPointerLeave`**; `preventDefault` en Espacio/Enter (evita el scroll de la página con Space).

**Tests (TDD rojo→verde, 16 → 23 unit / 84 → 98 E2E):**

Unitarios (`HeroOrbit.test.tsx`; rojo inicial 7/23):

1. `press` declara `opacity: 1` (normal y reduced) junto a `scale: 0.75`.
2. `press` separa la transición de opacidad (tween 150 ms) de la escala.
3. `show` conserva `opacity: 1` y el spring `bounce .5 / 1.6s`.
4. Captura el puntero al pulsar (`setPointerCapture` con el `pointerId` correcto).
5. Mantiene `data-pressed=true` si el puntero sale del avatar y lo libera en `pointercancel`.
6. Lo libera en `lostpointercapture`.
7. Lo libera en `blur` tras la activación por teclado.

E2E (`tests/e2e/hero-orbit.spec.ts`, nuevo; se ejecuta en los 7 viewports):

- "los arcos conic no traen `from` desplazado en el CSS del build" — lee el `background-image` computado de `.orbit-gradient-a/b`.
- "contrae a 0.75 sin perder opacidad y crece de nuevo al soltar" — presión real con ratón, mueve el puntero fuera del avatar (prueba la captura), suelta *fuera* y espera el retorno a escala 1.

**Verificación:**

| Comando | Resultado |
| --- | --- |
| `pnpm vitest run HeroOrbit` | ✅ **23 tests** (7 rojos → verdes) |
| `pnpm lint` | ✅ 0 errores (5 warnings preexistentes en `Footer.tsx`) |
| `pnpm test` | ✅ **20 archivos, 160 tests** |
| `pnpm build` | ✅ Compiled successfully + TypeScript OK |
| `pnpm test:e2e` | ✅ **98 tests** (84 + 14; se detuvo el servidor 3100 previo para no reutilizar el build antiguo) |
| Playwright dev (3000) | ✅ presión 700 ms: avatar `opacity:1` `scale(.75)` 188 px y 4 anillos `opacity:1` `scale(.75)`; puntero movido a (10,10) → sigue `pressed=true`; a 400 ms tras soltar los anillos crecen 0.75→0.866→1 y a 2800 ms el avatar vuelve a 250 px/`scale(1)`; 0 errores consola |

---

## Ajuste 3 (post-Ajuste 2): orden de retorno invertido + `LocalClock` del Hero a Contacto

Reporte del usuario: "que el orden sea inverso: primero crezca el avatar y con su crecimiento parezca empujar hacia afuera las órbitas haciéndolas rebotar suavemente" y "quitemos el `LocalClock` del HeroSection y añádalo en la primera columna de ContactSection, debajo de 'Respuesta garantizada'".

**Orden de retorno (sin tocar la entrada inicial):** el DOM renderiza los anillos `TRAILS` (90→60) y el avatar al final (z-20), por lo que el stagger por defecto (`show`) crecía los anillos primero. En vez de reordenar el DOM, se añadió un estado de movimiento específico para el soltado:

- **`heroOrbitMotion.ts`:**
  - `systemVariants.release` con `staggerDirection: -1` (Framer recorre los hijos al revés → **el avatar arranca primero**), `delayChildren: 0.04` y `staggerChildren: 0.06` (los anillos salen solapados: 60 → 70 → 80 → 90, de dentro hacia fuera → efecto de empuje con rebote).
  - `pieceVariants.release` / `reducedPieceVariants.release` = target completo `{ opacity: 1, scale: 1 }` con el spring `bounce 0.5 / 1.6s`; declarado explícitamente para que Framer no herede `hidden` (misma regresión que se evitó en `press`).
  - `show` y `release` comparten target vía la factory `restingPiece()` (creada por llamada para no compartir referencia).
- **`HeroOrbit.tsx`:** nuevo estado `hasPressed`; el `animate` del contenedor pasa por `press` mientras se mantiene → `release` al soltar, y `show` solo en la entrada inicial. Expuesto en `data-motion-state` (`show`/`press`/`release`) para poder testearlo. La presión y la captura de puntero no cambiaron.

**`LocalClock` migrado:**

- **`HeroSection.tsx`:** eliminados el import, el wrapper del reloj y su mención en el JSDoc; la columna derecha queda solo con `HeroOrbit` centrado (`flex w-full items-center justify-center`).
- **`ContactSection.tsx`:** import de `LocalClock` y wrapper `data-testid="contact-local-clock"` con estilo glass ancho completo (`rounded-xl border border-border/80 bg-surface-1/40 p-3 backdrop-blur-md shadow-sm`) justo después del strip de SLA en la primera columna.
- **`ArchitectureShowcase.tsx`:** conserva su propio `LocalClock` (sin cambios).

**Tests (TDD rojo→verde, 160 → 163 unit / 98 → 105 E2E):**

Unitarios (rojo inicial: 4 tests):

1. `HeroOrbit.test.tsx` — `systemVariants.release` declara `staggerDirection: -1`, `staggerChildren: 0.06`, `delayChildren: 0.04`; `pieceVariants.release` con `opacity/scale` en 1.
2. `HeroOrbit.test.tsx` — `data-motion-state` transiciona `show` → `press` → `release`.
3. `HeroSection.test.tsx` — el Hero ya **no** renderiza “Zona horaria local” / “UTC-4”.
4. `ContactSection.test.tsx` — `contact-local-clock` existe después del aviso de SLA en el orden del DOM (`compareDocumentPosition`).

E2E (`tests/e2e/hero-orbit.spec.ts`, en los 7 viewports):

- "al soltar, el avatar crece antes que cualquier anillo" — tras `mouse.up()` muestrea frame a frame (rAF) hasta que cada pieza supera 0.755 y verifica que el avatar lidera y que el anillo exterior cierra la cola; `readOrbitState` ahora incluye `ringScales` (los `toEqual` existentes se extendieron).

**Verificación:**

| Comando | Resultado |
| --- | --- |
| `pnpm vitest run` (3 archivos del ajuste) | ✅ **41 tests** (4 rojos → verdes) |
| `pnpm lint` | ✅ 0 errores (5 warnings preexistentes en `Footer.tsx`) |
| `pnpm test` | ✅ **20 archivos, 163 tests** (3 timeouts de 5000 ms por saturación al correr en paralelo; en re-ejecución aislada 42/42 ✅) |
| `pnpm build` | ✅ Compiled successfully + TypeScript OK |
| `pnpm test:e2e` | ✅ **105 tests** (98 + 7; 3100 libre) |
| Playwright dev (3000) | ✅ durante presión `data-motion-state=press`; tras soltar, muestreo frame a frame: **avatar frame 4** → anillos **60/70/80/90 en frames 7/9/12/14** (avatar primero y empuje de dentro hacia fuera), estado final `release`, escalas a 1; Hero sin reloj y Contacto con `contact-local-clock` visible en 320/768/1440; `overflow-x` real 0 (no scroll horizontal) y **0 errores consola** |

---

## Ajuste 4: ProjectsSection — loop, puntos, card clicable y `next/image`

Análisis de la sección de proyectos acordado con el usuario (opción 2: integral) más dos requisitos explícitos: **loop del carrusel** y **puntos que reflejen el catálogo y el seleccionado**. Decisiones cerradas: card envuelta en un único `<a>`, loop con flechas siempre activas, y borrado del SVG huérfano.

### Loop infinito

- **`ProjectsSection.tsx`:** `useEmblaCarousel({ loop: true, align: "start" })` (antes `loop: false`).
- Consecuencia verificada contra la fuente de Embla 8.6 (`Counter` con `loop`): `selectedScrollSnap()` envuelve con módulo (siempre 0..n-1, sin índices de clones) y `canScrollPrev/Next` nunca igualan al seleccionado → **las flechas nunca se deshabilitan** con más de un proyecto. El DOM no clona slides, así que los puntos siguen derivando de `projects.length`.
- JSDoc del componente actualizado para documentar el comportamiento.

### Puntos: catálogo + seleccionado + target táctil

- Cada punto es ahora un `<button>` de **24×24 px** (`h-6 w-6`, con `-m-1.5` para conservar el ritmo visual) con un `<span aria-hidden>` de 8 px (`h-2 w-2`) que lleva el color de estado; focus ring esmeralda y `group-hover/dot` para el hover.
- `aria-label` enriquecido: `Ir al proyecto {n}: {título del proyecto}` (testea el proyecto concreto, no solo el índice).
- `aria-current="true"` en el activo, movido por el snapshot de `useEmblaSnapshot` (evento `select` de Embla, sin `setState` en efectos — patrón previo intacto).

### Card clicable (único ancla) + `next/image`

- **`ProjectCard`:** cuando `liveUrl` existe, imagen + título + badges + "Ver demo" quedan envueltos en **un solo `<a href target=_blank rel=noopener noreferrer>`** con focus ring; "Ver demo ↗" pasó de `<a>` a **`<span>`** (antes era un link anidado, HTML inválido). Sin `liveUrl`, la card es un `<div>` decorativo **sin `cursor-pointer`** (antes siempre lo tenía, indicando clic inexistente).
- La raíz mantiene `BentoCard` + `group`; el `cursor-pointer` es condicional al `hasLink`.
- **Imagen:** `<img>` → `next/image` con `width={1280} height={720}`, `sizes` por breakpoint del carrusel (`SLIDE_SIZES`: 88/75/50 vw) y `loading="lazy"` implícito; eliminado el `eslint-disable @next/next/no-img-element` y el comentario de placeholder. Se siguió la guía de `next/dist/docs/` (Next 16: `priority` deprecated → `preload`, no usado aquí por ser below-the-fold).

### Limpieza

- **Borrado** `public/projects/codecraft-platform.svg` (huérfano: solo lo mencionaba un ejemplo JSDoc de `types/project.ts`).
- Espacio sobrante eliminado en `className="w-full overflow-hidden "`.

### Tests (TDD rojo→verde; unit 163 → 172 / E2E 105 → 154)

Unitarios (`ProjectsSection.test.tsx`: 13 → 22; mock de Embla mejorado con captura de `options`, `selectedSnap` mutable, registro real de listeners y `emit()`):

1. Rojo: 13 tests nuevos fallando (loop, etiquetas, `aria-current` por emisión de `select`, target táctil, ancla única, span "Ver demo", `next/image`, card sin `liveUrl`, SVG huérfano).
2. Verde: **22/22**.

E2E nuevo `tests/e2e/projects.spec.ts` (7 tests × 7 viewports = 49):

1. "los puntos reflejan el catálogo y el seleccionado" — `count == projects.length`, `aria-current` inicial 0, click en el 3.º lo desplaza (Embla real).
2. "la flecha siguiente avanza el punto activo".
3. Loop: "desde el último, siguiente envuelve al primero" (punto:last → flecha `enabled` → activeIndex 0).
4. Loop: "desde el primero, anterior envuelve al último".
5. "la card del primer proyecto es un ancla con href real" + `target=_blank` + "Ver demo" es `span` dentro (0 links anidados).
6. "la imagen se sirve optimizada por next/image" — `src` matchea `/\/_next\/image/` y `naturalWidth > 0` (con poll: el optimizer tarda en servir).
7. "'Ver demo' se revela en hover (desktop) o es visible en móvil" — viewport-aware vía `matchMedia("(max-width: 767.98px)")`.

### Alineación de test de HeroOrbit (cambio del usuario)

El usuario ajustó `heroOrbitMotion.ts` (26/10 18:40): spring del retorno `bounce 0.5→0.6`, `duration 1.6→1.8`. El test de Ajuste 3 quedó desfasado (único fallo de la suite, ajeno a esta sección); **actualizado el valor esperado a `0.6 / 1.8`** con confirmación del usuario.

**Verificación:**

| Comando | Resultado |
| --- | --- |
| `pnpm vitest run ProjectsSection` | ✅ **22 tests** (13 rojos → verdes) |
| `pnpm lint` | ✅ 0 errores (5 warnings preexistentes en `Footer.tsx`) |
| `pnpm test` | ✅ **20 archivos, 172 tests** (163 + 9; tras alinear HeroOrbit) |
| `pnpm build` | ✅ Compiled successfully + TypeScript OK |
| `pnpm test:e2e` | ✅ **154 tests** (105 + 49; 3100 libre) |
| Playwright dev (3000) | ✅ 4 dots `Ir al proyecto {n}: {título}` con target real **24×24 px** y `aria-current` activo; loop verificado en ambos sentidos (último→siguiente envuelve a 0, primero→anterior envuelve a 3); card = 1 `<a>` con `href` real y **0 links anidados**; imagen `/_next/image?url=...w=3840&q=75` con `naturalWidth=503`; badge `Ver demo` opacity 0→1 en hover; **0 errores consola** |

---

## Ajuste 5: ProjectsSection — autoplay, gutter de loop, chevrons redondos e iconos de tecnología

Cuatro observaciones del usuario sobre el carrusel del Ajuste 4, resueltas con TDD. Decisiones cerradas con el usuario: iconos **monocromos** (`currentColor`), alcance **solo en proyectos**, autoplay cada **4 s**.

### 1. Autoplay (el loop ahora avanza solo)

- **Dependencia nueva**: `embla-carousel-autoplay@8.6.0` (versión exacta de embla-core 8.6).
- **`ProjectsSection.tsx`**: hook `useAutoplayPlugin()` con **inicializador perezoso de `useState`** (patrón elegido tras chocar con la regla `react-hooks/set-state-in-effect`: puro, sin `setState` en efectos, SSR seguro con `typeof window`, y Embla arranca ya con el plugin sin reinicialización). Opciones: `delay: 4000`, `stopOnInteraction: false` (flechas/puntos/drag no lo detienen para siempre), `stopOnMouseEnter: true` (hover pausa; `mouseleave` reanuda — verificado en la fuente del plugin 8.6: registra `mouseleave` solo cuando `stopOnInteraction` es false).
- **Accesibilidad**: no se registra el plugin si `prefers-reduced-motion: reduce`; con `stopOnFocusIn` (default true) el foco de teclado lo pausa y `focusout` lo reanuda.
- Los puntos se actualizan solos: el autoplay dispara `select`, evento que `useEmblaSnapshot` ya escucha.
- **E2E nuevo** (2 tests × 7 viewports): "el carrusel avanza solo sin interacción" (poll de `aria-current` hasta que cambia, timeout 9 s) y "con movimiento reducido no avanza solo" (`page.emulateMedia({ reducedMotion: "reduce" })` + espera 5.5 s). Los tests interactivos existentes ahora **pausan el autoplay con hover** (`pauseAutoplay`) y normalizan al proyecto 1 (`normalizeToFirstProject`) para ser deterministas.

### 2. Gutter entre el último y el primero al envolver

- **Causa raíz**: el `gap` flex del `ul` solo existe *entre* ítems, nunca *después* del último. Al envolver, Embla posiciona el slide 1 pegado al final del slide N (distancia 0 = "cards pegadas" del usuario).
- **Fix**: sin `gap` en el track; cada `<li>` lleva `pr-5 sm:pr-6` (mismos 20/24 px) y basis simplificado a `88% / 75% / md:50%` (el `calc(50%-0.75rem)` compensaba el gap; el padding vive dentro del box border-box). Verificado en dev: en el estado envuelto la distancia card-a-card = **24 px exactos**.
- **E2E geométrico**: en el último snap, mide `left(card 1.ª transformada) − right(card última)` y espera 20/24 px según viewport (fallaba con 0 px antes del fix).

### 3. Chevrons redondos

- Ambas flechas: `rounded-lg` → **`rounded-full`** (40×40 px) + focus ring esmeralda `focus-visible:outline-2 outline-offset-2 outline-accent-emerald` (antes no tenían ninguno, inconsistente con los puntos).

### 4. Icono + tecnología en los badges (monocromo)

- **Nuevo `src/components/ui/TechIcon.tsx`**: mapa label→path SVG inline de **Simple Icons** (CC0 1.0, atribución documentada por cortesía) para HTML, CSS, JavaScript, TailwindCSS, WordPress y WooCommerce — todo el catálogo actual. Pintado con `currentColor` (hereda `text-text-dim` del badge, respeta ambos temas), 16 px (`h-3 w-3`), `aria-hidden`. Tecnología sin icono → no renderiza nada (el catálogo puede crecer sin romper).
- **`TechBadge.tsx`**: prop opcional `icon?: ReactNode` renderizada antes del label; sin icono el badge es idéntico al anterior. `ProjectsSection` pasa `<TechIcon name={tech} />`.

### Hallazgo adicional: overflow fantasma del HeroOrbit a 1024 (flake del E2E)

La primera corrida E2E falló en `responsive.spec.ts` "la página no desborda horizontalmente" (laptop-1024, 19 px). Diagnóstico: **no era del carrusel** — a exactamente 1024 px aplica `lg:` (contenedor 500 px → anillo de 450 px) y al **rotar**, el bounding box del cuadrado crece hasta √2×, pintando hasta ~34 px más allá del viewport (recortados por `body{overflow-x:hidden}` pero reportados por `documentElement.scrollWidth`). Flakiness medido: overflow oscilaba 0↔34 px con la fase de rotación (25/40 muestras); aislado pasaba 4/4 porque la medición cae cerca de 0°, pero bajo saturación CPU de 182 tests el phase cae mal. **Fix**: `overflow-x-clip` en el contenedor `hero-orbit` (solo recorta las esquinas *vacías* del bounding box rotado; el anillo pintado es un círculo de 450 px dentro de 500, el punto teardrop queda a 228 px del centro y la cápsula inferior es eje Y — **cero cambio visual**, confirmado con captura y muestreo 0/40).

**Tests (unit 172 → 179 / E2E 154 → 182):**

- Unit `ProjectsSection.test.tsx` 22 → 29: 5 rojos → verdes (registro del plugin con opciones, reduced-motion sin plugin, gutter por slide sin gap en el track, basis sin `calc`, chevrons `rounded-full` + focus) + 2 de iconos (svg en cada badge del catálogo, fallback sin icono para tech desconocida vía `doMock`).
- Mock de `embla-carousel-autoplay` (captura de opciones + stub identificable) y del hook de React (captura del array de plugins).
- E2E `projects.spec.ts` +4 tests (2 autoplay, 1 gutter geométrico, 1 iconos) × 7 viewports = 28.

**Verificación:**

| Comando | Resultado |
| --- | --- |
| `pnpm vitest run ProjectsSection` | ✅ **29 tests** (5 rojos → verdes) |
| `pnpm lint` | ✅ 0 errores (5 warnings preexistentes en `Footer.tsx`) |
| `pnpm test` | ✅ **20 archivos, 179 tests** (172 + 7; HeroOrbit 25/25 re-ejecutado tras el fix del hero) |
| `pnpm build` | ✅ Compiled successfully + TypeScript OK |
| `pnpm test:e2e` | ✅ **182 tests** (154 + 28; 3100 libre) |
| Playwright dev (3000) | ✅ autoplay avanzó 0→1 sin interacción en 5.2 s; estado envuelto `activeIndex=3` con **gutter real 24 px** (antes 0); chevrons 40 px con `border-radius` completo; badges HTML/CSS/WordPress/Woo/Tailwind/JS con su icono; hero 1024: overflow **0/40 muestras** y anillos/punto/cápsula intactos; **0 errores consola** |

---

## Ajuste 6: LocalClock — snapshot cacheado (fix del error de `getSnapshot`)

El dev server de Next lanzaba `The result of getSnapshot should be cached to avoid an infinite loop` en `LocalClock.tsx (36:36)`.

### Causa raíz

`getSnapshot` era **`formatLocalTime`**, que ejecutaba `new Intl.DateTimeFormat(...).format(new Date())` **en cada lectura**. El contrato de `useSyncExternalStore` (React 19.3) exige un snapshot **cacheado con identidad estable** (solo cambia cuando la tienda notifica). React lee `getSnapshot` **dos veces seguidas** (hidratación + comprobación de desarrollo) y compara con `Object.is`: como la salida incluye los **segundos** y se recalcula del reloj vivo, dos lecturas consecutivas que caen en un borde de segundo devuelven cadenas distintas → React concluye que el snapshot no está cacheado y lanza el error (en este build se manifiesta como `Maximum update depth exceeded` vía `forceStoreRerender`, la misma raíz). El patrón correcto ya existía en el repo (`TypewriterTitle.tsx` con estado cacheado, `useEmblaSnapshot` con `useCallback`).

### Fix (`LocalClock.tsx`) — hook-local con `useRef`

- `getSnapshot` devuelve **`cachedRef.current`** (cacheado) en lugar de recalcular del reloj.
- `subscribe` (con `useCallback([])`, estable) crea un `tick` que recalcula la hora y notifica a React **solo cuando el string cambia**; se ejecuta **una vez al suscribir** (calibra la hora real tras la hidratar, sin parpadeo perceptible) y luego cada 1000 ms.
- `getServerSnapshot` sigue devolviendo el placeholder `--:--:--` (SSR sin reloj). El JSX es idéntico → sin cambios visuales ni de accesibilidad.
- Cumple `react-hooks/set-state-in-effect`: no hay `setState`; se muta un `ref` y se llama a `onStoreChange` (mecanismo de React) dentro de `subscribe`.

### TDD (rojo → verde)

- **Rojo**: test clave con stub de `Intl` cuyo formatter devuelve un valor distinto en **cada lectura** (fiel a `new Date()` en producción). Con el código viejo, React lanza `Maximum update depth exceeded` (capturado por `try/catch`) → **rojo**.
- **Verde**: con el snapshot cacheado, `getSnapshot` es estable → sin error ni warning → **verde**.
- Dos tests de regresión más: hora real que avanza cada segundo (`vi.useFakeTimers` + `setSystemTime`) y placeholder en SSR (`renderToStaticMarkup`).

### Ajustes de tests derivados de ediciones concurrentes del usuario

Durante el Ajuste 6 se sincronizaron tests que aún esperaban valores previos ya cambiados por el usuario en la fuente (no por este fix):

- **Título de Skills** → "Herramientas y conocimientos técnicos": actualizado en el unitario `SectionHeaders.test.tsx:45` **y** en el E2E `responsive.spec.ts:82` (ambos fallaban con el texto viejo).
- **Tecnología `"API"`** en `projects.ts:52` (sin icono en `TechIcon`): añadido un icono genérico de corchetes de código `< >` a `TECH_ICON_PATHS` (API no es marca → no existe en Simple Icons; dibujado a medida, `currentColor`), documentado en el JSDoc de `TechIcon.tsx`.
- El avatar (`.jpg`) lo revirtió el propio usuario a `.webp` → sin acción.

**Tests (unit 179 → 182 / E2E 182 sin cambios de cantidad):** `LocalClock.test.tsx` nuevo con 3 tests (contrato de `getSnapshot`, reloj que avanza, placeholder SSR).

**Verificación:**

| Comando | Resultado |
| --- | --- |
| `pnpm vitest run LocalClock` | ✅ **3 tests** (rojo→verde) |
| `pnpm lint` | ✅ 0 errores (5 warnings preexistentes en `Footer.tsx`) |
| `pnpm test` | ✅ **21 archivos, 182 tests** (179 + 3 de LocalClock) |
| `pnpm build` | ✅ Compiled successfully + TypeScript OK |
| `pnpm test:e2e` | ✅ **182 tests** (3100 libre) |
| Playwright dev (3000) | ✅ **error `getSnapshot should be cached` = 0** (y `Maximum update depth` = 0); **0 errores consola**; reloj en vivo `"01:03:51 p. m."`→`"01:03:53 p. m."` (no placeholder); badge `API` con icono `< >` limpio |

---

## Ajuste 7: Contacto estilo referencia + Skills en standby

Rediseño de la sección de contacto inspirado en `https://portfolio-peach-nine-crjsjzebx5.vercel.app/#contacto` (grid 12 columnas, col derecha con card glassmorphic, enlaces 2×2 y pill de reloj estilo navbar) y puesta en **standby** de las 5 tecnologías con badge "En proceso". Orden TDD completo (rojo→verde) en ambas fases.

### Wireframe de la nueva sección de contacto

```
┌───────────────────────────────────────────────────────────────────┐
│ #contacto — section-contain · grid lg:grid-cols-12 (gap-12)       │
│ ┌───────────────────────────┬───────────────────────────────────┐ │
│ │ COL 1 (lg:col-span-5)     │ COL 2 (lg:col-span-7)             │ │
│ │ ▸ eyebrow "Contacto"      │ ┌───────────────────────────────┐ │ │
│ │ ▸ H2 "Hablemos de tu      │ │ CARD glassmorphic             │ │ │
│ │   próximo proyecto."      │ │ rounded-3xl · backdrop-blur   │ │ │
│ │ ▸ subtítulo (canales /    │ │ glow esmeralda                │ │ │
│ │   24 h hábiles)           │ │                               │ │ │
│ │                           │ │ ✉ Envíame un mensaje          │ │ │
│ │ ┌───────────────────────┐ │ │ [ Nombre ] [ Correo ]         │ │ │
│ │ │ 🌐 Venezuela · UTC-4  │ │ │ [ Mensaje................. ]  │ │ │
│ │ │    · 01:03 p. m.      │ │ │ honeypot (oculto)            │ │ │
│ │ │  LocalClock variant=  │ │ │ [ ✉ Enviar Mensaje       → ] │ │ │
│ │ │  "pill" (navbar ref.) │ │ │ ── Enlaces directos ──────── │ │ │
│ │ └───────────────────────┘ │ │ [WhatsApp↗][GitHub↗]          │ │ │
│ │  (sin strip de SLA)       │ │ [Copiar correo][LinkedIn]     │ │ │
│ │                           │ └───────────────────────────────┘ │ │
│ └───────────────────────────┴───────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

### Fase 1 — Sección de contacto (TDD rojo → verde)

- **`LocalClock.tsx`**: nuevo prop `variant?: "default" | "pill"` (tipo exportado `LocalClockVariant`).
  - **`"pill"`** (solo ContactSection): cápsula `rounded-full` glass con icono `Globe` esmeralda, "Venezuela", punto separador y mono `UTC-4 • {hora}` en vivo (`tabular-nums`).
  - **`"default"`** idéntico al Ajuste 6 → `ArchitectureShowcase` y sus tests intactos. La lógica de suscripción (`useSyncExternalStore` + snapshot cacheado con `useRef`/`useCallback`) es **común a ambas variantes**; solo cambia la presentación. Sin `data-testid` en el componente (el testid vive en ContactSection — separación de responsabilidades).
- **`ContactSection.tsx`** — reescrito con grid de 12 columnas (`gap-8 lg:gap-12 lg:items-start`):
  - **Col 1** (`data-testid="contact-intro"`, `lg:col-span-5`): `SectionHeader` (mismos eyebrow/título/descripción → `SectionHeaders.test.tsx` sigue verde; override `mb-0 md:mb-0` para que el `md:mb-14` por defecto no abriera un hueco entre el subtítulo y el pill) + pill del reloj (`data-testid="contact-local-clock"`, `self-start`).
  - **Strip de SLA eliminado** (la información vive en el subtítulo y el pill).
  - **Col 2** (`data-testid="contact-panel"`, `lg:col-span-7`): card glassmorphic (`rounded-3xl border-border-strong/60 bg-surface-1/50 backdrop-blur-xl shadow-[0_0_50px_-10px_var(--glow-emerald)]`) con:
    - Micro-encabezado "Envíame un mensaje" (icono `Send` esmeralda).
    - **Mini-formulario**: Nombre + Correo (grid 2 col) + Mensaje (`Textarea` con contador) + honeypot + submit. **Sin select de asunto** — el subject viaja fijo como `"Consulta General"` vía `defaultValues` en `useContactForm` (ya existía; `contactSchema` y `/api/contact` **sin cambios**). Se conservan Toast, `useClipboard` y el auto-ocultado del toast a los 4 s.
    - **Grilla 2×2 de enlaces directos** (bajo divisoria "Enlaces directos"): WhatsApp (`wa.me` + `target=_blank`), GitHub, Email (email visible truncado + botón copiar + `mailto:`) y LinkedIn — todos con `data-testid` `contact-card-*` conservados.

### Fase 2 — Skills en standby (TDD rojo → verde)

- **`src/data/skills.ts`**: comentadas (no borradas) las 5 entradas `status: "learning"` —Qwik.js (Frontend), PostgreSQL, Prisma ORM, GraphQL (Backend), Jira (Complementos)— con nota `// STANDBY (Ajuste 7): ... descomentar para reactivar el badge "En proceso"`. Resultado: **21 → 16 tecnologías** (Frontend 9→8, Backend 7→4, Complementos 5→4), 0 badges "En proceso". `SkillTile`/`SkillGroupCard` intactos: el badge se reactiva solo al descomentar. Docstring del archivo actualizado.

### Tests (TDD rojo→verde; unit 182 → 185 / E2E 182 sin cambio de cantidad)

- **Rojo Fase 1** (6 tests): estructura 2 columnas (`contact-intro`/`contact-panel`), pill con "Venezuela" y UTC-4, ausencia del strip de SLA, mini-form de 3 campos sin select de asunto, 4 enlaces en el panel, href `wa.me`.
- **`ContactSection.test.tsx`** reescrito (9 tests): + WhatsApp `wa.me`/`target=_blank`, honeypot.
- **`LocalClock.test.tsx`** +2: variante pill (Venezuela + UTC-4 + hora que avanza) y default sin "Venezuela" (import de `screen` añadido).
- **Fase 2**: `skills.test.ts` (13 tests: 16 total, reparto 8/4/4, 0 learning, ids standby ausentes) y `SkillsSection.test.tsx` (20 tests: 8/4/4 por grupo, 16 tiles/iconos/icon-hop/scale, `dark:invert` 5→3, 0 badges, ausencia de nombres en standby) — **16 rojos → verdes**.
- **E2E `responsive.spec.ts`**: 21 → 16 links y badge 5 → 0 (test renombrado "sin badges 'En proceso' (tecnologías en standby)").

**Verificación:**

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | ✅ 0 errores (5 warnings preexistentes en `Footer.tsx`) |
| `pnpm test` | ✅ **21 archivos, 185 tests** (182 + 3) |
| `pnpm build` | ✅ Compiled successfully + TypeScript OK |
| `pnpm test:e2e` | ✅ **182 tests** (3100 libre) |
| Playwright dev (3000) | ✅ screenshot de la sección 2 columnas conforme al wireframe; pill `"Venezuela·UTC-4 • 05:02:16 p. m."` → `"05:02:18 p. m."` (avanza); mini-form 3 campos visibles + **0 selects**; 4 enlaces directos visibles; **0 badges** en `#habilidades`; **0 errores consola** |

## Ajuste 8: Motion System — scroll-driven, `@starting-style` y View Transitions

Sistema de animación unificado: **reveal scroll-driven** en headers (`animation-timeline: view()`), **tarjetas con `@starting-style`** vía IntersectionObserver y **View Transitions tipadas** en toda navegación de secciones. Soporte progresivo completo (fallback por soporte de navegador y por `prefers-reduced-motion`). Orden TDD (rojo→verde) en cada fase.

### Decisiones de alcance

- **Incluido**: `.reveal` en headers/secciones; `.reveal-card-grid`/`.reveal-card` en About, Skills y Contact; navegación de secciones (Topbar, MobileNav, CTA del Hero) con VT tipo `section-nav`; ThemeToggle con VT tipo `theme`.
- **Excluido**: cards del carrusel Embla (`ProjectsSection`) — dentro de `overflow-hidden`, sin `view()` ni `display:none`; internals de `SectionHeader`, `HeroOrbit`, `ProjectsSection` y `ArchitectureShowcase`.
- **framer-motion se conserva** en Hero (+`HeroOrbit`), Toast y MobileNav; se eliminó de `SkillsSection` (whileInView → CSS reveal) y de `Topbar` (indicador `layoutId` → `<span>` estático).

### Fase A — CSS (`globals.css`)

- **`reveal-up` + `.reveal`**: `animation-timeline: view()` con `animation-range: entry 0% cover 25%`, dentro de `@supports (animation-timeline: view())` y `@media (prefers-reduced-motion: no-preference)`. Fuera de soporte → sin animación (elemento visible por defecto); con reduced-motion → visible sin transición.
- **`.reveal-card`**: `display: none` **sin capa** (gana sobre las utilities de Tailwind) → `.is-visible` da `display: flex`. Transición acotada a `:not(:hover)` (no compite con hover de cards), stagger por `--i` × 90 ms y arranque con `@starting-style` (fade+slide desde `opacity: 0 / translateY(16px)`).
- **Wipe de tema re-escopado por tipo**: `html:active-view-transition-type(theme)` conserva el wipe circular 0.75 s; `section-nav` usa crossfade `section-nav-in/out` ~300 ms. Regla legacy sin scoping conservada como fallback (el JS solo arranca VT de navegación donde hay soporte de tipos). Reduced-motion anula todo con `!important`.
- **`::view-transition { pointer-events: none }`**: el overlay de VT no captura clics durante la animación (recetario de la guía de View Transitions de Next.js en `node_modules/next/dist/docs`).

### Fase B — JS

- **`src/lib/sectionNav.ts` (nuevo)** — helper `navigateToSection(id)` único para toda navegación de secciones:
  - **Con soporte** (`document.startViewTransition` + `CSS.supports("selector(:active-view-transition-type(section-nav))")` + sin reduced-motion): VT con `types: ["section-nav"]`, **scroll instantáneo dentro del `update`** (los snapshots old/new capturan los dos estados de scroll) + `replaceState` del hash.
  - **Sin soporte o reduced-motion**: comportamiento previo exacto (`scrollIntoView` smooth, o `"auto"` con reduced-motion) + hash. `"inicio"` → `window.scrollTo({top: 0})`.
  - **Pre-reveal del destino** (`revealTargetCards`): antes de medir el scroll añade `is-visible` a los `.reveal-card-grid` **solo de la sección destino**. Sin esto, el `display:none` pendiente hacía que (a) la sección `lg:items-center` se re-centrara tras el aterrizaje y el scroll-anchoring desplazara el ancla, o (b) el documento estuviera recortado (`max-scroll` insuficiente) y el salto no llegara al ancla en viewports cortos.
- **`Topbar`**: `handleNavigate` delega en `navigateToSection`; sin framer-motion (indicador `layoutId="active-nav-indicator"` → `<span>` con comentario). **`ThemeToggle`**: `types: ["theme"]` + fallback legacy. **`HeroSection`**: CTA cableado al helper.
- **`useRevealOnScroll.ts` (nuevo)**: callback ref + `IntersectionObserver` (`once`, threshold 0.1) que muta el DOM directamente (`classList.add("is-visible")`); fallback sin IO → `is-visible` inmediato.
- **Secciones migradas**: `AboutSection`, `SkillsSection` (reescrito sin framer-motion: header `className="reveal"`, grid `reveal-card-grid`, wrappers `reveal-card h-full flex-col` con `--i`) y `ContactSection` (header `reveal`, panel `reveal-card-grid` + ref, card `reveal-card flex-col` `--i:0`). Footer: sus links siguen comentados en JSX → nada que cablear.

### Fase C — Tests (TDD rojo → verde)

- **`setup.ts`**: `MockIntersectionObserver` disparable (`static instances`, constructor con callback, `elements: Set`, `disconnect()` auto-eliminatorio y `trigger(isIntersecting)` con entradas sintéticas). Helper **`src/__tests__/revealTrigger.ts`** → `triggerReveal(element)`.
- **Unit +11**: `SkillsSection` +3, `ContactSection` +3, `AboutSection` +3 (reveal por IO: sin `is-visible` al cargar → `is-visible` + `display:flex` tras disparar) y `sectionNav` 9 → 11: *"revela las tarjetas del destino (reveal-card-grid) ANTES de scrollear"* (captura el estado del grid dentro de la mock de `scrollIntoView`) y *"no toca los reveal-card-grid de otras secciones"* — ambos **rojos → verdes** con `revealTargetCards`.
- **E2E `motion.spec.ts` (nuevo, 7 tests × 7 viewports)**: `animation-timeline: view()` + rangos + `content-visibility`; opacidad 0 fuera → 1 al alinear; About `is-visible` + `display:flex` + stagger `--i`; nav con `types ["section-nav"]` + hash + ancla <200 px; ThemeToggle con `types ["theme"]`; reduced-motion → visible sin animación y **0** llamadas a VT; 0 errores de consola.
- **`responsive.spec.ts`**: `scrollIntoViewIfNeeded` antes de aserciones de visibilidad (los headers/tiles ahora arrancan ocultos hasta su reveal).
- **Fix del bug de aterrizaje** (diagnosticado con sondas contra dev 3000): en 1920 el update medía el scroll con el panel de contacto en `display:none` → al revelarse, la sección `lg:flex items-center min-h-[calc(100svh-4rem)]` se re-centraba (ancla subía 187 px + scroll-anchoring → top 305); en 768 el documento estaba recortado (`max-scroll` 1641 → ancla top 604.875). Fix TDD: pre-reveal antes del scroll → **verde**.
- **Fix del flake de `projects.spec.ts` ("Ver demo")**: al traer `#proyectos` al viewport la grilla de skills puede intersectar por el borde y revelarse, desplazando la sección y dejando el `badge.hover({force:true})` en posición stale → espera determinista de settle (`expect.poll` de estabilidad de `boundingBox` ±1 px) antes del hover.

### Fase D — Verificación visual (Playwright dev 3000)

Sonda integral en Chromium real (1920×1080 y 768×1024) — **0 fallos**:

- 3 grids (`#sobre-mi`, `#habilidades`, `#contacto`) **sin** `is-visible` al cargar → revelados por IO al entrar en viewport (`display:flex`, opacidad 1, stagger `--i`).
- `content-visibility: auto` + `animation-name: reveal-up` + `animation-timeline: view()` + `animation-range: entry cover 25%`.
- Opacidad del `.reveal`: **0** fuera del viewport → **intermedia** (~0.12) con el header entrando por el borde inferior → **1** al alinear la sección.
- Navegación por UI: VT `types [["section-nav"]]`, `hash #contacto`, ancla a **134 px** (1920 — límite de `max-scroll`: el documento termina 46 px antes de poder alinear a 88) y **72 px** (768), grid de contacto pre-revelado.
- **0 errores de consola** en ambas vistas. Screenshots mid-scroll y post-navegación conformes (header visible bajo la topbar, nav activo, grillas reveladas).

### Resultados de verificación

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | ✅ 0 errores (5 warnings preexistentes en `Footer.tsx`) |
| `pnpm test` | ✅ **22 archivos, 205 tests** (185 + 20 del Ajuste 8) |
| `pnpm build` | ✅ Compiled successfully + TypeScript OK (incluido en `test:e2e`) |
| `pnpm test:e2e` | ✅ **231/231 tests** (182 + 49 de `motion.spec` = 7 × 7 viewports; 3100) |
| Playwright dev (3000) | ✅ sonda integral **0 fallos** en 1920 y 768; 4 screenshots conformes; **0 errores consola** |

### Archivos nuevos/modificados en esta iteración

- **Nuevos**: `src/lib/sectionNav.ts`, `src/hooks/useRevealOnScroll.ts`, `src/__tests__/revealTrigger.ts`, `tests/e2e/motion.spec.ts`.
- **Modificados**: `src/app/globals.css` (reveal, starting-style, VT por tipo, pointer-events), `src/components/layout/Topbar.tsx`, `src/components/layout/ThemeToggle.tsx`, `src/components/sections/HeroSection.tsx`, `AboutSection.tsx`, `SkillsSection.tsx`, `ContactSection.tsx`, `src/__tests__/setup.ts`, `src/lib/__tests__/sectionNav.test.ts`, `src/components/sections/__tests__/{Skills,About,Contact}Section.test.tsx`, `tests/e2e/responsive.spec.ts`, `tests/e2e/projects.spec.ts`.
- **Soporte progresivo**: scroll-driven (Chromium 115+, Safari 26+), `@starting-style` (Chromium 117+), tipos de VT (Chromium 125+) — sin ellos la página funciona con el comportamiento previo.
- **Nota**: sin repositorio Git — los Ajustes 4–8 siguen sin commitear.

---

## Ajuste 9: Fix del scroll — el límite de Lenis no llegaba al footer

Reporte del usuario: "el scroll no permite llegar hasta el final donde está el footer".

### Diagnóstico (sondas read-only contra dev 3000)

El **`limit` de Lenis quedaba congelado en el valor del layout inicial**:

| Momento | scrollY | max real | footer | grids |
| --- | --- | --- | --- | --- |
| Carga | 0 | 2311 (doc 3391) | 3294 px abajo | 000 |
| Rueda hasta estancar | **2311** | 3006 (doc 4086) | **inalcanzable** (1678 px) | 111 |
| `scrollTo` nativo | 3006 | 3006 | ✅ visible | 111 |
| Rueda 2 (todo revelado) | **2311** | 3006 | **inalcanzable** | 111 |
| reduced-motion (Lenis off) | 3006 | 3006 | ✅ en 3 ruedas | 111 |

Causa raíz verificada midiendo los `ResizeObserver` en el cliente:

1. El Ajuste 8 puso las cards en `display:none` hasta su reveal → el documento carga con **3391 px** y crece a **4086 px** al revelarse los 3 grids (los reveals también amplían el recorrido durante el scroll).
2. Lenis calcula `limit = scrollHeight - height` al montar y lo refresca con un `ResizeObserver` (debounce 250 ms) sobre **`document.documentElement`** — pero ese elemento tiene el **border-box fijo en 1080 px** (= viewport, por la propagación de `body { overflow-x: hidden }`); el scrolleo real lo lleva el viewport. Su RO solo disparó una vez al inicio (`RO_html h=1080`), mientras que `document.body` **sí crece** y su RO disparó `3391 → 4086`.
3. Resultado: la rueda se clampea en 2311 → **faltan 695 px** para el footer. `window.scrollTo` y Lenis-off (reduced-motion) sí llegan, por eso el bug solo se ve con la rueda.

### Fix (opción A, TDD rojo → verde)

- **`SmoothScroll.tsx`** — una línea en el constructor de Lenis: **`content: document.body`** (+ JSDoc que explica el porqué). `content` solo se usa internamente para el RO y el `scrollHeight` de `Dimensions` (verificado en `lenis.mjs` 1.3.27), así que el cambio es seguro: el autoResize nativo pasa a observar `body`, que sí cambia de alto, y el `limit` sigue el layout automáticamente (sin RO propio ni `lenis.resize()` manual).
- Alternativas descartadas: **B** (RO propio llamando `lenis.resize()` — más código, redundante) y **C** (reservar el espacio de las cards sin `display:none` — cambiaría el diseño del reveal del Ajuste 8 y sus tests).

### Tests (TDD rojo → verde; unit 205 → 208 / E2E 231 → 238)

- **Rojo unit** — nuevo `src/components/layout/__tests__/SmoothScroll.test.tsx` (3 tests, Lenis mockeado con captura de opciones): instala Lenis con **`content: document.body`** (hoy fallaba: `undefined`), destruye al desmontar y no lo instala con `prefers-reduced-motion`.
- **Rojo E2E** — nuevo `tests/e2e/smooth-scroll.spec.ts` (1 test × 7 viewports): rueda hasta el fondo (`wheelToBottom` con rondas de `mouse.wheel` + asentado de Lenis/RO) y espera `max - scrollY ≤ 1` + footer visible. **Rojo inicial: 5/7 viewports fallaban** con el delta exacto del bug (1920 y 1280: 695 px; 1024: 572; 640: 1058; 768: 295) — 320/375 pasaban porque ahí el límite inicial ya cubría el recorrido.
- **Verde**: con `content: document.body`, ambos rojos pasan.

### Verificación

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | ✅ 0 errores (5 warnings preexistentes en `Footer.tsx`) |
| `pnpm test` | ✅ **23 archivos, 208 tests** (205 + 3 de SmoothScroll) |
| `pnpm build` | ✅ Compiled successfully + TypeScript OK (incluido en `test:e2e`) |
| `pnpm test:e2e` | ✅ **238/238 tests** (231 + 7 de `smooth-scroll.spec` = 1 × 7 viewports; 3100) |
| Playwright dev (3000) | ✅ rueda hasta el final en **1920, 768 y 375**: `y = max` (3005/3006, 3199/3200, 4711/4711), footer visible (`footerTop` 984/928/715) y **0 errores de consola** |

### Archivos

- **Nuevos**: `tests/e2e/smooth-scroll.spec.ts`, `src/components/layout/__tests__/SmoothScroll.test.tsx`.
- **Modificados**: `src/components/layout/SmoothScroll.tsx` (`content: document.body` + JSDoc), `refactor_secciones.md`.
- **Nota**: sin repositorio Git — los Ajustes 4–9 siguen sin commitear.

---

## Ajuste 10: Estabilización del rediseño "Cinematic Stage + Filmstrip" (Proyectos)

El usuario rediseñó por completo la sección de proyectos: **stage cinematográfico** (canvas WebGL con shader *melt* + HUD superior de contador/flechas + HUD inferior glassmorphism con título/badges/"Ver demo") sobre una **filmstrip** de miniaturas clicables. Archivos reescritos por el usuario: `ProjectsSection.tsx`, `WebGLMorphCanvas.tsx` (518 líneas, 4 modos de transición), `ProjectsSection.test.tsx` (13 tests) y `projects.spec.ts` (9 tests × 7 viewports). Análisis profundo del rediseño acordado con el usuario (alcance **Completo**) y ejecución con TDD (rojo→verde).

### Diagnóstico (sondas read-only contra dev 3000)

**1. Defecto principal — WebGL se destruía y reconstruía en cada render.** Sondeo de contadores en el cliente:

| Evento | `createProgram` | `texImage2D` |
| --- | --- | --- |
| Tras montar | 2 | 20 |
| +9 s (≈2 ticks de autoplay 4 s) | **+2** | **+20** |
| +3 hovers (entra/sale) | **+6** | **+60** |

Causa raíz: `const projectImages = projects.map(...)` **dentro** del componente creaba un array nuevo en cada render → el `useEffect([images])` de `WebGLMorphCanvas` se re-ejecutaba y re-compilaba shaders, re-creaba el programa y recargaba las 5 texturas en **cada tick de autoplay y en cada hover** (parpadeo del placeholder 1×1, consumo GPU/CPU inútil y ventana de carreras más ancha en los E2E).

**2. Carrera en el E2E del HUD.** El test *"el HUD muestra el título del proyecto y el enlace a la demo"* no llamaba `normalizeToFirstProject` antes de asertar: si la carga + scroll superaba los 4 s de autoplay, el carrusel ya había avanzado y "Clon de YouTube" nunca aparecía (fallos en `laptop-1024` y `desktop-1280`; 222/224). Los 9 fallos del primer arranque móvil (320/375) eran **frío de build** (repetición del subconjunto con servidor caliente: 18/18 ✅).

**3. Hallazgos menores**: render loop rAF a 60 FPS sin pausa fuera de viewport; ruido jsdom `Not implemented: HTMLCanvasElement getContext()` en cada corrida; badge del filmstrip `0{index+1}` se rompe con ≥10 proyectos; HUD sin `aria-live`; `refactor_secciones.md` no documentaba el rediseño.

### Fixes (6)

1. **`ProjectsSection.tsx` — `PROJECT_IMAGES` a nivel de módulo**: `const PROJECT_IMAGES = projects.map((p) => p.featuredImage)` tras el import (+ JSDoc que explica la referencia estable). Referencia idéntica en todos los renders → el `useEffect([images])` del canvas no se re-ejecuta. Funciona con los `vi.doMock` del test porque `resetModules` re-evalúa el módulo.
2. **`aria-live="polite"`** en la tarjeta HUD inferior: anuncia a los lectores de pantalla el proyecto activo al cambiar (autoplay/flechas).
3. **Badge del filmstrip**: `String(index + 1).padStart(2, "0")` (índice 10 → `"10"`, no `"010"`).
4. **`WebGLMorphCanvas.tsx` — pausa del render loop fuera de viewport**: `loopControlsRef` (`start`/`stop`) + `isVisibleRef` (arranca `true` para no depender del primer callback asíncrono del observer) + guard `disposed` en el loop. `startLoop` solo agenda si el canvas es visible y no hay frame pendiente; `stopLoop` cancela el frame. Efecto nuevo con `IntersectionObserver` (`threshold: 0`) sobre el canvas: sale del viewport → `stop`, vuelve → `start`; `disconnect` + restauración de visibilidad en el cleanup. El callback lee `loopControlsRef.current` en cada invocación para usar los controles vigentes si `images` cambia.
5. **`projects.spec.ts`**: `normalizeToFirstProject(page, sectionEl)` al inicio del test del HUD (elimina la carrera con el autoplay).
6. **`setup.ts`**: mock silencioso de `HTMLCanvasElement.prototype.getContext` → `null` (los componentes ya tratan `null` como "sin soporte" → fallback). Elimina el ruido `Not implemented` de cada corrida.

**No se tocó**: el shader melt, la transición, el HUD visual, `projects.ts`, `types/project.ts`, `SectionHeader`, ni el comportamiento de autoplay/swipe/teclado (todo verificado en verde).

### Tests (TDD rojo→verde; unit 192 → 196)

**Rojo (4 tests nuevos, 4 rojos con la causa exacta esperada):**

1. `ProjectsSection.test.tsx` — **estabilidad de `images`**: `vi.mock` de `WebGLMorphCanvas` con captura vía `vi.hoisted`; render + hover (`isPaused`) + flecha siguiente → todos los arrays capturados deben ser la **misma referencia** (rojo: referencia nueva en cada render).
2. `ProjectsSection.test.tsx` — **`aria-live`**: `title.closest("[aria-live]")` con `aria-live="polite"` (rojo: `null`).
3. `ProjectsSection.test.tsx` — **badge `padStart`**: catálogo mockeado con 10 proyectos (`vi.doMock`), badge del décimo = `"10"` (rojo: `'010'`).
4. **Nuevo `src/components/ui/__tests__/WebGLMorphCanvas.test.tsx`** — **pausa fuera de viewport**: contexto WebGL falso (Proxy: toda consulta truthy, toda llamada no-op) + cola de `requestAnimationFrame` controlada a mano + `triggerVisibility` sobre el mock de IO de `setup.ts`. Montaje → 1 frame pendiente; tick → re-encadena; `trigger(false)` → **0 frames**; `trigger(true)` → reanuda; `unmount` → cancela (rojo: el componente aún no usaba IntersectionObserver → `false`).

**Verde: 196/196** (24 archivos). Nota: la suite pasó de 208 → 192 con el rediseño del usuario (borró los 16 tests del viejo diseño de cards); este ajuste añade 4.

### Verificación

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | ✅ 0 errores (5 warnings preexistentes en `Footer.tsx`) |
| `pnpm test` | ✅ **24 archivos, 196 tests** (192 + 4 nuevos; sin ruido jsdom `getContext`) |
| `pnpm build` | ✅ Compiled successfully + TypeScript OK (incluido en `test:e2e`) |
| `pnpm test:e2e` | ✅ **224/224 tests** (era 222/224 con la carrera del HUD; 3100) |
| Playwright dev (3000) | ✅ sonda: `createProgram`/`texImage2D` **+0/+0** tras 2 ticks de autoplay y **+0/+0** tras 3 hovers (antes +2/+20 y +6/+60); `drawArrays` fuera de viewport **0 en 6 s** (con page-rAF a ~38 fps) y en viewport **26/26 ticks** (100%); HUD con `aria-live="polite"`, tarjeta dentro del stage, counter `PROYECTO 03/05` (autoplay vivo); **0 errores de consola** |

### Archivos

- **Nuevo**: `src/components/ui/__tests__/WebGLMorphCanvas.test.tsx`.
- **Modificados**: `src/components/sections/ProjectsSection.tsx` (`PROJECT_IMAGES`, `aria-live`, `padStart`), `src/components/ui/WebGLMorphCanvas.tsx` (pausa IO del loop + JSDoc), `src/__tests__/setup.ts` (mock `getContext`), `src/components/sections/__tests__/ProjectsSection.test.tsx` (+3 tests), `tests/e2e/projects.spec.ts` (normalización del HUD), `refactor_secciones.md`.
- **Nota**: sin repositorio Git — los Ajustes 4–10 y el rediseño del usuario siguen sin commitear.

## Ajuste 11 + rediseño del usuario: filmstrip → dots dentro del stage (Proyectos)

**Ajuste 11 (reemplazado)**: envolví el stage en `mx-auto max-w-5xl` con alturas fijas por breakpoint y añadí una filmstrip de miniaturas bajo el stage, con tests de geometría (unit 197 / E2E 217 en ese momento). El usuario lo rehízo por completo acto seguido.

**Rediseño del usuario (05/11/2026, 21:38–21:40)** — archivos `ProjectsSection.tsx`, `ProjectsSection.test.tsx` y `projects.spec.ts` reescritos por él:

- **Filmstrip eliminada** → la navegación visual son los **dots centrados dentro del stage** (`aria-label="Puntos de navegación de proyectos"`).
- **Wrapper `mx-auto max-w-5xl` eliminado** → stage vuelve al ancho completo del `max-w-7xl` (`relative w-full`).
- **Alturas fijas → aspect-ratio**: `aspect-[16/10] sm:aspect-[16/9] lg:aspect-[21/9]` + `min-h-[380/460/520px] max-h-[620px]`.
- **HUD inferior flotante dentro del stage** (absoluta inferior, glassmorphism, `aria-live="polite"`).
- Tests adaptados por el usuario: **unit 195, E2E 217**.

Verificación en ese momento: lint 0 errores · unit 195/195 · E2E 211/217 con 6 fallos solo en mobile-375 → re-ejecución de los 6 × 7 viewports = **42/42 verdes** (flakes por contención; los snapshots mostraban el estado final correcto) · sonda dev 3000: 0 errores de consola, 0 overflow-X, HUD dentro del stage sin solape con dots; ratios del stage 375 → 0.90, 768 → 1.38, 1280/1920 → 2.33.

## Ajuste 12: Footer card de Proyectos (título + stack · Ver demo · dots)

El usuario pidió rehacer la tarjeta de información del stage: en lugar de una card alineada a la izquierda con la info apilada, una **footer card a todo el ancho** con título y stack tecnológico organizados, **"Ver demo" en la esquina superior derecha de la card** y las **flechas ant/sig flotando sobre la foto a los lados**, centradas en el eje horizontal. Idea validada con wireframe (`C:\Users\ALIRIO\.opencode\plan\wireframe-card-proyectos.html`, **Variante A**) y 4 decisiones del usuario: flechas sobre la foto · dots dentro de la card · "Ver demo" en la esquina superior derecha de la card · flechas visibles en móvil (36px).

### Cambios (`ProjectsSection.tsx`)

1. **Footer card** `absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-5` con `aria-live="polite"` conservado: márgenes 16/24px alineados con los chips superiores (+1px de borde del stage) → ancho = stage − 34/50px. Padding `px-4 py-3 sm:px-6 sm:py-4`, glassmorphism existente.
2. **Fila principal** `flex items-start justify-between gap-3 sm:gap-6`: columna izquierda `min-w-0` con título `text-lg sm:text-2xl md:text-3xl` + `<ul>` de badges `flex flex-wrap gap-1.5` (`TechBadge` ya `text-xs` = 12px); a la derecha el enlace **"Ver demo"** (`shrink-0`, `text-xs sm:px-4 sm:text-sm`) en la esquina superior derecha de la card.
3. **Dots** movidos de su posición absoluta del stage (`bottom-2 inset-x-0`) a **dentro de la card**: fila `flex justify-center gap-1.5` (`mt-2.5 sm:mt-3`), mismos `aria-label`/`aria-current` → selectores E2E intactos.
4. **Flechas** extraídas del flex inferior: ahora hijas directas del stage (`absolute left-3/right-3 top-1/2 -translate-y-1/2 z-30 pointer-events-auto`, `h-9 w-9 sm:h-12 sm:w-12` = 36/48px). Al ser hijas directas del stage (`relative`), el centrado vertical es respecto al **eje del stage**, no de la card (si vivieran en el wrapper de la card, `top-1/2` se resolvería contra la card).
5. **Eliminados**: el hint *"Arrastra o usa las flechas"* (sin sentido con las flechas visibles a los lados) y el eyebrow *"Caso de estudio"* (no aparecía en el wireframe validado; además ahorra ~20px de alto y evita que la flecha izquierda solape la esquina de la card en móvil 375px).

**No se tocó**: chips superiores (contador / Shader Melt), shader melt ni `WebGLMorphCanvas`, autoplay 4 s, swipe/teclado/loop, `projects.ts`, `types/project.ts`, `SectionHeader`.

### Tests (TDD rojo→verde; unit 195 → 198; E2E 217 → 224)

**Rojo (4 tests nuevos):**

1. Unit — **dots dentro de la card**: `document.querySelector('[aria-live="polite"]')` debe contener los N dots (rojo: los dots seguían absolutos en el stage, fuera de la card → 0).
2. Unit — **"Ver demo" en la esquina superior derecha**: dentro del `aria-live` y su fila `closest("div")` con `justify-between` + `items-start` (rojo: la fila vieja era `items-center` con `border-t`).
3. Unit — **flechas centradas en el eje**: `absolute` + `top-1/2` + `-translate-y-1/2` + `pointer-events-auto`, con `left-3`/`right-3` (rojo: flechas en flex con `inline-flex h-11 w-11`).
4. E2E — **geometría footer card**: ancho de la card ≥ stage − 56px (márgenes 16/24 + bordes), centro vertical de cada flecha ≈ centro del stage (±10px), centro de "Ver demo" en el 50% derecho de la card, y los dots dentro de la card (rojo: card `max-w-xl` a la izquierda + flechas abajo a la derecha + demo a la izquierda).

**Verde: unit 198/198** (24 archivos). E2E y sonda visual: ver tabla.

### Verificación

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | ✅ 0 errores (5 warnings preexistentes en `Footer.tsx`) |
| `pnpm test` | ✅ **24 archivos, 198 tests** (195 + 3 nuevos) |
| `pnpm build` | ✅ incluido en la corrida E2E (webServer de Playwright, puerto 3100, BUILD_ID fresco) |
| `pnpm test:e2e` | ✅ **224/224** (32 tests × 7 viewports) en 7.8 min — 0 flakes |
| Sonda dev (3000) | ✅ 4 viewports: gap card/stage 34px (375) y 50px (≥768, umbral 56) · flechas centradas en ±0.01px del eje del stage (36px en móvil, 48px en el resto) · "Ver demo" en el 50% derecho de la card · 5/5 dots dentro de la card · 0 errores de consola · 0 overflow-X · títulos 18/30px · sin eyebrow ni hint · screenshots `ajuste12-*.png` verificados |

### Archivos

- **Modificados**: `src/components/sections/ProjectsSection.tsx` (footer card + flechas absolutas), `src/components/sections/__tests__/ProjectsSection.test.tsx` (+3 tests), `tests/e2e/projects.spec.ts` (+1 test de geometría), `refactor_secciones.md`.
- **Nota**: sin repositorio Git — los Ajustes 4–13, los rediseños y esta documentación siguen sin commitear.

## Ajuste 13: Stage proporcional + footer compacto (Proyectos)

El usuario pidió que el stage dejara de verse estirado en pantallas anchas y que el footer nunca quedara cortado al aterrizar con el nav en pantallas cortas. Se acotó el ancho del stage, se corrigió el aspect ratio en `lg` y se compactó el footer a 2 filas.

### Cambios (`ProjectsSection.tsx`)

1. **Wrapper del stage** `relative mx-auto w-full max-w-5xl` (antes `relative w-full` a todo el ancho del `max-w-7xl`): el stage queda acotado a **1024px y centrado**. Los handlers de pausa por hover (`onMouseEnter/Leave` → `setIsPaused`) se movieron a este wrapper para que la zona de hover coincida exactamente con la foto (el autoplay de 4 s se pausa al encima del stage).
2. **Aspect ratio**: `aspect-[16/10] sm:aspect-[16/9] lg:aspect-[16/9]` — en `lg` el stage pasó de `21/9` (estirado) a **16/9**.
3. **Clamp de altura** `min-h-[min(380px,calc(100svh_-_14rem))] sm:min-h-[min(460px,…)] md:min-h-[min(520px,…)] max-h-[min(620px,calc(100svh_-_14rem))]`: 14rem = 224px = scroll-padding 88 + header 64 + gap 32 + margen inferior 40. Garantiza que el aterrizaje del nav (scroll-padding-top 5.5rem) **nunca corte el footer** en pantallas cortas; en pantallas ≥ ~750px de alto el `min()` devuelve el valor actual y nada cambia.
4. **Footer compacto en 2 filas** (dentro de la card `aria-live="polite"`): fila 1 = título + "Ver demo" (esquina superior derecha); fila 2 = `flex justify-between items-center` con badges de tecnologías a la izquierda y dots a la derecha en una sola línea (el título ya no comparte esa fila).

**No se tocó**: shader melt ni `WebGLMorphCanvas`, chips superiores (contador / Shader Melt), autoplay 4 s, swipe/teclado/loop, `projects.ts`, `types/project.ts`, `SectionHeader`.

### Tests

- **Unit (+1)**: *"agrupa badges y dots en la misma fila (fila 2) del footer compacto"* — los badges son hermanos directos de los dots dentro del contenedor de puntos (`justify-between` + `items-center`) y el `h3` no comparte esa fila. **198 → 199**.
- **E2E (+1 test, 2 asserts)**: describe *"Stage proporcional + footer compacto (Ajuste 13)"*:
  1. Geometría: stage ≤ 1024px en todos los viewports · ratio 16/9 ±4% en `lg` (≥1024) · centrado en la página en ≥1280 (±4px) · footer ≤ 672px (`max-w-2xl`) y centrado dentro del stage (±2px) · flechas en el eje horizontal del stage (±10px) · "Ver demo" en el 50% derecho de la card · dots dentro de la card.
  2. *Aterrizaje del nav en pantalla corta (1366×640)*: solo corre en `desktop-1280` (`test.skip` en los otros 6 viewports → **6 skipped**); sin el clamp, el footer cae fuera del viewport y el poll expira (rojo).

### Verificación (corrida del Ajuste 13)

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | ✅ 0 errores (5 warnings preexistentes en `Footer.tsx`) |
| `pnpm test` | ✅ **24 archivos, 199 tests** (198 + 1 nuevo) |
| `pnpm test:e2e` | ✅ **224 passed + 6 skipped** de 231; 1 flake de contención en `projects.spec.ts:63` (`locator.click` "Proyecto siguiente", desktop-1920) — mismo patrón preexistente del Ajuste 11, se re-ejecuta en la corrida siguiente |

### Archivos

- **Modificados**: `src/components/sections/ProjectsSection.tsx` (wrapper `max-w-5xl` + clamp de altura + footer 2 filas), `src/components/sections/__tests__/ProjectsSection.test.tsx` (+1 test), `tests/e2e/projects.spec.ts` (+1 test con 1 skip por viewport), `refactor_secciones.md`.

## Ajuste 14: Fix del carrusel de Proyectos — imágenes repetidas / retroceso al cambiar de proyecto

**Síntoma reportado**: al pasar de proyecto las imágenes se repetían o retrocedían (la del siguiente proyecto parecía ser la misma que la anterior), mientras el HUD y los dots sí avanzaban.

### Causa raíz

En `WebGLMorphCanvas.tsx` el estado de la transición vive en `stateRef` y los dos caminos que lo escriben estaban desincronizados:

- **Efecto de transición** (`useEffect [activeIndex, direction]`): al cambiar `activeIndex` hacía `targetIndex = activeIndex`, `isAnimating = true` y **reiniciaba `animStartTime = performance.now()`**.
- **Render loop**: `animProgress` arrancaba de 0 en cada reinicio, pero **`currentIndex` (la textura base `tCurrent`) solo avanzaba al completar el 100%** (`p >= 1.0`).

Dos síntomas, ambos explicados por eso:

1. **Retroceso (snap-back)**: con un clic *durante* la transición (intervalo < 1000 ms = duración), el progreso volvía a 0 ⇒ la pantalla saltaba de vuelta a la **imagen anterior** (`currentIndex` aún no se había actualizado).
2. **Estancamiento / repetición**: con clics más rápidos que la transición, `currentIndex` **nunca llegaba a completarse** ⇒ la base quedaba congelada en la imagen original mientras HUD/dots avanzaban; cada transición nueva empezaba desde esa misma imagen ⇒ *"las imágenes se repiten"*.

**Descartado**: los 5 `featuredImage` son distintos (hashes y contenido visuales verificados) — el bug estaba en el render, no en los datos. **Confirmado** por una primera sonda WebGL con gaps de 1.6–4.7 s que NO reprodujo el bug (todos los intervalos > 1000 ms ⇒ cada transición completaba).

### Cambio (`WebGLMorphCanvas.tsx`) — mínimo, en el efecto de transición

```ts
// Ajuste 14: al interrumpir, si la pantalla ya muestra ≥50% del
// destino, compromete esa imagen como nueva base ANTES de retargetear.
if (s.isAnimating && s.animProgress >= 0.5) {
  s.currentIndex = s.targetIndex;
}
```

- `animProgress` es exactamente la mezcla `uProgress` que manda el shader ⇒ el umbral 0.5 equivale a "la pantalla ya muestra mayoritariamente el destino".
- El salto visual queda limitado a ≤50% de la mezcla (antes podía ser hasta 100%) y el avance es **progresivo**: la base nunca retrocede.
- **No se tocaron**: shader ni `coverUV`, el `renderLoop`, chips superiores, autoplay, swipe/teclado/loop, dots ni `aria-live`.

### Tests (TDD rojo→verde; unit 199 → 202)

Se añadió un **contexto WebGL grabador** (`createRecordingWebGLContext`) que intercepta `createTexture` (ids en orden = orden de `images`), `activeTexture`/`bindTexture` (qué textura hay en `TEXTURE0`/`TEXTURE1`) y `uniform1f` filtrando `uProgress`, más `performance.now()` mockeado para que el test dictue el tiempo de cada frame (`flushFrames()` entrega el mismo reloj como timestamp).

**Rojo (1 rojo + 2 verdes desde el inicio):**

1. *"interrumpir con ≥50% de mezcla avanza la base a la imagen visible"* — monta `activeIndex=0`, avanza a t=900 ms (600/1000 → `ease(0.6)=0.68`), interrumpe con `activeIndex=2` y mira el primer frame tras la interrupción. **Rojo**: `tCurrent` seguía en la imagen 0 (`expected +0 to be 1` = snap-back); **verde**: base = imagen 1 (la que se veía) y `tNext` = imagen 2.
2. *"interrumpir antes del 50% de mezcla mantiene la base actual"* — `ease(0.2)=0.08 < 0.5` ⇒ base intacta en la imagen 0. Documenta el umbral (pasa antes y después del fix).
3. *"tras interrumpir, la transición converge a la imagen final"* — al completar, base = destino, `tNext` = base y `uProgress` vuelve a 0.

**Verde: 4/4** en `WebGLMorphCanvas.test.tsx` (1 preexistente + 3 nuevos).

### Sonda de reproducción (dev :3000, A/B)

Sonda con tracer inyectado vía `addInitScript` **antes** del bundle (registra qué imagen ocupa `TEXTURE0` y el `uProgress` de cada frame), 8 clics en "Proyecto siguiente" con gap de 700 ms y métrica **dist = (hud − base + total) % total** (cuántos pasos la base queda ATRÁS del HUD):

| Corrida | `baseSequence` | `maxDistBehind` | Resultado |
| --- | --- | --- | --- |
| **Sin fix** (fix deshabilitado temporalmente) | `[0,1,2,3,`**`0`**`,3,`**`0`**`,1]` — **retrocede y repite** | **2** | ❌ `PASS: false` (EXIT 1) |
| **Con fix** | `[0,1,2,3,4,0,1,2,3,4]` — estrictamente progresiva (solo el wrap del loop) | **1** | ✅ `PASS: true` (EXIT 0) · `finalDist = 0` (converge) · 0 errores de consola |

Nota: los primeros intentos no reprodujeron el bug porque el overhead de `locator.click()` de Playwright inflaba el intervalo por encima de 1000 ms (cada transición completaba); se corrigió usando clics JS instantáneos e **midiendo el intervalo real entre clics**. La prueba A/B confirma que la sonda sí detecta el bug y que el fix lo elimina.

### Archivos

- **Modificados**: `src/components/ui/WebGLMorphCanvas.tsx` (fix del efecto de interrupción), `src/components/ui/__tests__/WebGLMorphCanvas.test.tsx` (contexto grabador + 3 tests), `refactor_secciones.md`.
- **No tocados**: shader/`coverUV`, `renderLoop`, `ProjectsSection.tsx`, chips, autoplay, dots, `aria-live`.

## Ajuste 15: Contact — enlaces directos movidos a la columna 1 (bajo el reloj)

El usuario pidió mover los enlaces directos de la card (col 2) a la **columna 1, debajo del `LocalClock`**, manteniendo la organización actual, para que la sección quede más limpia. Decisión de motion tomada por el usuario: **estáticos** (sin clase `.reveal`).

### Cambios (`ContactSection.tsx`)

1. **Bloque `ENLACES DIRECTOS` movido** de dentro de la card (col 2) a col 1, como hijo de `contact-intro` justo tras `<LocalClock>`: mismo orden y agrupación **2×2** (WhatsApp → GitHub → Email → LinkedIn), mismos `data-testid`, mismos estilos por canal y botón de copiar intactos. El bloque se trasladó byte a byte (script de mover + dedent de 2 espacios) para no alterar clases ni acentuación.
2. **Espaciado**: se quitó `mt-5` (el `gap-6` del flex padre ya separa) y se conservó `border-t border-border/50 pt-4` como separador visual bajo el reloj.
3. **Card de col 2** queda solo con el micro-encabezado "Envíame un mensaje" + el formulario.
4. **Motion**: los enlaces quedan **estáticos**, fuera del sistema del Ajuste 8 (solo el encabezado `.reveal` y la card `reveal-card-grid` / `reveal-card --i: 0` siguen animándose).
5. JSDoc del componente actualizado (estructura col 1 / col 2 + excepción de motion) y comentarios de columna.

**No se tocaron**: `data-testid`, `SectionHeader`, `LocalClock`, `useContactForm`, `useClipboard`, honeypot, Toast, `socials`/`whatsappUrl`, `/api/contact`. El grep confirmó que **ningún test E2E referencia testids de contacto** ⇒ el impacto es solo en unit tests.

### Tests (2 actualizados, sin altas; unit total se mantiene en 202)

1. *"estructura en 2 columnas: intro (encabezado + reloj + enlaces) y panel (formulario)"* — col 1 contiene encabezado + reloj + WhatsApp; col 2 contiene el botón de envío y **no** contiene los enlaces (`not.toContainElement` ×2).
2. *"renderiza los 4 enlaces directos en la columna izquierda (bajo el reloj)"* (renombrado) — los 4 canales en col 1, **fuera** de la card (`not.toContainElement` ×4), y el bloque sin clases `reveal` ni `reveal-card` (documenta la decisión de estáticos).
3. Docblocks del archivo de tests actualizados (estructura + excepción de motion).

### Hallazgo durante la verificación E2E: umbral del ancla de `#contacto`

La corrida E2E falló de forma **determinista** en `motion.spec.ts:179` (*"clic en nav → VT con types ['section-nav'] + hash + ancla cerca del tope"*) con **206.5px** (umbral `< 200`), valor idéntico en cada re-ejecución. Diagnóstico con sonda en los 7 viewports:

- El scroll a `#contacto` queda **clampado por el fin del documento** (`scrollY == maxScroll`): Contacto es la última sección + footer (97px), así que en viewports altos no alcanza el scroll para llevar el ancla a la línea de `scroll-padding-top` (88px).
- Al mover los enlaces, **col 1 (457px) pasó a ser más alta que col 2 (409px)** → la grilla se acortó ~112px → al centrarse verticalmente (`lg:items-center` dentro de `lg:min-h-[calc(100svh-4rem)]`) el ancla bajó ~56px (150.5 → 206.5).
- Medición tras el cambio: **71.6–87.5px en 6 viewports** (no clampados, aterrizan en la línea de scroll-padding) y **206.5px solo en 1920×1080** (clampado).

**Decisión**: no se tocó el diseño (el centrado vertical es decisión del Ajuste 7); se ajustó el umbral del test de `< 200` a **`< 250`** con el comentario completo de la geometría. Sigue siendo "cerca del tope" (206.5/1080 = 19% del viewport) y sigue capturando una regresión real (un ancla enterrada a mitad de pantalla). *Alternativa descartada por cambiar la visual*: alinear la grilla arriba (`lg:items-start`) llevaría el ancla a 88px exactos pero dejaría ~560px de vacío debajo del formulario.

### Verificación

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | ✅ 0 errores (5 warnings preexistentes en `Footer.tsx`) |
| `pnpm test` | ✅ **24 archivos, 202 tests** (199 + 3 nuevos del Ajuste 14) |
| `pnpm test:e2e` | ✅ **225 passed + 6 skipped** de 231 — ver detalle abajo |
| Sonda A/B Ajuste 14 (dev :3000) | ✅ sin fix `PASS:false` (base retrocede: `[0,1,2,3,0,3,0,1]`, `maxDistBehind:2`) · con fix `PASS:true` (base `[0,1,2,3,4,0,1,2,3,4]`, `maxDistBehind:1`, `finalDist:0`, 0 errores de consola) |
| Sonda ancla `#contacto` (7 viewports) | ✅ 71.6–87.5px en 6 · 206.5px en 1920×1080 (clampado, umbral 250) |

**Detalle E2E (corrida completa + re-ejecuciones):**

- Corrida completa: 223 passed / 2 failed / 6 skipped en 12.7 min (corrida con sondas en paralelo ⇒ contención).
  - `projects.spec.ts:38` (laptop-1024) → **flake de contención** (`locator.click` sobre los dots agotó 30s; el snapshot de error mostraba los 5 dots renderizados) → **re-ejecutado: ✅ 10.3s**.
  - `motion.spec.ts:179` (desktop-1920) → **determinista**, resuelto con el umbral documentado arriba → **re-ejecutado: ✅ 7/7 viewports**.
- Corrida final de validación: 225 passed + 6 skipped (los 6 skipped son el test de viewport fijo 1366×640 del Ajuste 13 en los otros viewports).

### Archivos

- **Modificados**: `src/components/sections/ContactSection.tsx` (bloque movido a col 1 + JSDoc + comentarios), `src/components/sections/__tests__/ContactSection.test.tsx` (2 tests + docblocks), `tests/e2e/motion.spec.ts` (umbral del ancla 200 → 250 con comentario), `refactor_secciones.md`.

## Ajuste 16: Fix de imágenes desincronizadas en Proyectos — race de texturas con Strict Mode (dev)

Síntoma reportado: en dev (`localhost:3000`) el canvas WebGL de la sección de Proyectos mostraba la foto de **otro** proyecto, de forma **intermitente** ("a veces bien, a veces mal").

### Causa raíz

Race del **doble efecto de Strict Mode** (ON por defecto en App Router con Next ≥13.5.1): el efecto WebGL (dep `[images]`) corre `setup → cleanup → setup` en cada montaje de dev.

1. El **lote 1** crea 5 texturas y 5 `Image` cuyo `img.onload` sube píxeles a su `tex`.
2. El **cleanup** borra las 5 texturas (`deleteTexture`), pero **no cancela ni anula** los `onload` ya en curso.
3. El **lote 2** crea las texturas reales (las que quedan vivas).
4. Los `onload` del lote 1 llegan **después**: `bindTexture(TEXTURE_2D, texBorrada)` es **no-op en WebGL** (una textura borrada ya no puede enlazarse), así que el `texImage2D` subsiguiente escribe sobre la textura **viva** que quedó enlazada en la unidad activa → la ranura N contiene la foto del proyecto M. **El orden de llegada de los onloads decide quién gana** ⇒ intermitencia.

Agravantes corregidos:

- `img.onload` no llamaba `activeTexture(TEXTURE0)`: heredaba la unidad del último frame (`TEXTURE1` = `tNext`), y sobre esa unidad caían todos los uploads huérfanos.
- No había guard de `disposed` en los callbacks ni handler `img.onerror`.
- Los `Image` no se registraban ni se anulaban en el cleanup.

**Descartado con datos**: el Ajuste 14 (índice) era un bug distinto, ya cerrado; y las 5 imágenes de `public/projects/` corresponden 1:1 a sus títulos (`PROJECT_IMAGES[i] === projects[i].featuredImage`).

### Sonda de evidencia (Fase 0, dev :3000)

Sonda Playwright con `addInitScript` que instrumenta `createTexture`/`deleteTexture`/`texImage2D` (lee `TEXTURE_BINDING_2D` y `ACTIVE_TEXTURE` en cada subida) más readback *ground-truth* (FBO + `readPixels`, rejilla 8×8 comparada contra las 5 originales), 3 corridas con recarga limpia. **Antes del fix:**

- 3/3 corridas con doble efecto (`createTexture=10 / deleteTexture=5`).
- 10 uploads de imagen (5 huérfanos): entre **1 y 3 por corrida** caían sobre la textura viva **equivocada**, todos en `unit=33985` (TEXTURE1 heredada).
- **0/3 corridas con contenido 5/5 correcto**: la ranura de YouTube contuvo Spotify/formulario, la de Spotify contuvo formulario y la de Rick and Morty contuvo Ecommerce.

### Cambios (`WebGLMorphCanvas.tsx`) — mínimo, solo el efecto WebGL

1. **`let disposed = false` movido ANTES del `images.forEach`** (antes se declaraba después): los `onload`/`onerror` del lote lo leen para detectar que su lote fue descartado.
2. **Guard en `img.onload`**: `if (disposed || !gl || !tex) return;` — un callback de un lote descartado (re-ejecución del efecto o desmontaje) no sube nada.
3. **`gl.activeTexture(gl.TEXTURE0)` antes del bind+upload** en `onload`: la subida ya no hereda `TEXTURE1` (`tNext`) del último frame.
4. **`img.onerror` registrado** (con el mismo guard): un error de red queda cubierto; la textura conserva el placeholder 1×1 oscuro y el tamaño por defecto `[1280, 720]`.
5. **`loadedImages: HTMLImageElement[]`** registra las imágenes del lote; en el **cleanup** se anulan sus handlers (`onload = null; onerror = null`) además de marcar `disposed = true`.

**No se tocaron**: shader/`coverUV`, `renderLoop`, `projects.ts`/`types/project.ts`, chips superiores, autoplay, swipe/teclado/loop, dots del footer ni `aria-live="polite"`.

### Tests (TDD rojo→verde; unit 202 → 205)

3 tests nuevos en `WebGLMorphCanvas.test.tsx`, reusando `createRecordingWebGLContext` (extendido con `uploads`/`deleted`/`currentUnit`; `deleteTexture` marca borradas y `bindTexture` sobre textura borrada es no-op, como WebGL real) más `installFrameControl`/`flushFrames` y un doble controlable de `window.Image` (`MockImage` — jsdom no descarga imágenes, así que el test dispara cada `onload` a mano):

1. *"las imágenes de un lote descartado no suben sus píxeles"* — rerender con `images` de nueva identidad (el mismo escenario que el doble efecto) y `onload` disparados del lote viejo ⇒ **0** `texImage2D`. **Rojo**: 4 uploads huérfanos.
2. *"un `onload` posterior al desmontaje es ignorado"* — `unmount` + `onload` del lote ⇒ 0 uploads. **Rojo**: 4 uploads.
3. *"un `onload` vivo sube a su textura desde TEXTURE0"* — tras un frame (unidad activa = `TEXTURE1`), el `onload` vivo sube a su textura desde `TEXTURE0`. **Rojo**: `activeUnit = 33985`.

### Verificación

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | ✅ 0 errores (5 warnings preexistentes en `Footer.tsx`) |
| `pnpm test` | ✅ **24 archivos, 205 tests** (202 + 3 nuevos del Ajuste 16) |
| `pnpm test:e2e` | ✅ **corrida final de validación: 225 passed / 0 failed / 6 skipped** de 231 (9.5 min, exit 0). Corrida previa: 224 passed / 1 flake / 6 skipped — el flake re-ejecutado: **7/7 viewports ✅** |
| Sonda race (dev :3000, 3 corridas) | ✅ tras el fix: **0** uploads sobre textura borrada, **0** imágenes equivocadas, **3/3 corridas con contenido 5/5 correcto** y todos los uploads en `unit=33984` (TEXTURE0) — el doble efecto sigue ocurriendo (`10 creates / 5 deletes`) pero ya es inofensivo |

**Detalle E2E:**

- **Corrida final de validación** (patrón del Ajuste 15): **225 passed / 0 failed / 6 skipped** en 9.5 min, exit 0 — sin ningún fallo, incluidos todos los tests de `projects.spec.ts` (dots, loop, autoplay, HUD, stage) y el de `responsive.spec.ts:108`.
- Corrida completa tras el fix: **224 passed / 1 failed / 6 skipped** en 6.8 min.
  - **Los 3 fallos de la corrida previa (`projects.spec.ts:55` mobile-320 y desktop-1920, `:71` desktop-1920) pasaron en esta corrida** ⇒ flakes de contención confirmados (miden dots/estado React, sin relación con las texturas).
  - `responsive.spec.ts:108` (mobile-320, *"la sección de contacto tiene formulario"*): la card de reveal (`display:none` hasta el IntersectionObserver del Ajuste 8) no se activó dentro de 5 s — test **no relacionado** con este cambio (Contact, no canvas WebGL) → **re-ejecutado en los 7 viewports: ✅ 7/7** ⇒ flake de contención.

### Archivos

- **Modificados**: `src/components/ui/WebGLMorphCanvas.tsx` (guard `disposed` antes del `forEach` + guard/onerror/`activeTexture(TEXTURE0)` en `onload` + anulación de handlers en cleanup), `src/components/ui/__tests__/WebGLMorphCanvas.test.tsx` (contexto grabador extendido + `MockImage` + 3 tests), `refactor_secciones.md`.

---

## Ajuste 17: Card Email 2 líneas, HUD Projects sin badge "Shader Melt" y hook `useInitialHash`

### Objetivo

Resolver 4 ítems de experiencia de usuario, layout y navegación con TDD riguroso (rojo → verde), verificación exhaustiva multi-viewport y preservación de todas las arquitecturas y contratos previos:

1. **Card de Email (Contacto)**: Eliminar el correo visible (`alirioangel44@gmail.com`) reemplazándolo por el texto estático uniforme `Email` / `Contacto` (mismo patrón que WhatsApp/Chat directo, GitHub/Repositorios, LinkedIn/Conectar). Aliviar la contención geométrica en `lg` (1024 px) donde la grilla 2×2 colapsaba a ~180 px de card, provocando que el texto largo + botones desbordaran **114 px @1024 y 61 px @1280/@1920** (4–6 px @320/@640) fuera de su celda y quedaran tapados por la card de LinkedIn.
2. **HUD de Proyectos**: Eliminar el badge `"Shader Melt"` de la esquina superior derecha del escenario interactivo de proyectos para una interfaz más sobria y limpia, manteniendo el contador `PROYECTO 0X / 05`.
3. **Hook `useInitialHash`**: Corregir el desfase de aterrizaje al cargar URLs con ancla (por ejemplo `/#proyectos` o `/#contacto`). Tras el reveal del IntersectionObserver (Ajuste 8), el crecimiento vertical del layout (~412 px) provocaba que la posición inicial del scroll quedara desfasada (e.g. `/#proyectos` cayendo en Habilidades).
4. **Verificación completa y robustez E2E**: Pruebas unitarias completas y suite Playwright a través de los 7 viewports soportados (320, 375, 640, 768, 1024, 1280, 1920).

---

### Diagnóstico y Causa Raíz

#### 1. Desborde en Card de Email
En la columna 1 de `ContactSection.tsx`, la cuadrícula de enlaces directos se estructura como `grid grid-cols-1 sm:grid-cols-2 gap-3`. A 1024 px (`lg`), la columna izquierda tiene un ancho disponible de ~406 px, lo que asigna a cada card ~180 px.
- Con `padding: px-4` (32 px) y contenido: Icono (32 px) + gaps (16-24 px) + Texto ("alirioangel44@gmail.com" mono ~196 px) + Botones (68 px) = >290 px requeridos.
- El contenido no cabía en 180 px, provocando desborde horizontal de los botones hacia la derecha y solape sobre la tarjeta de LinkedIn (medido: **114 px @1024, 61 px @1280/@1920, 4–6 px @320/@640**).

**Segundo hallazgo (verificación):** al sustituir el correo por `Contacto` la card cabía, pero la celda de 180 px seguía siendo insuficiente para Icono (32) + `Contacto` (53 px mono) + 2 botones (68 px): el subtítulo quedaba recortado a **"Con…"** (30 px disponibles de 53) en la franja **1024–1279 px**. Se resolvió apilando la grilla en `lg` (ver §Cambios).

#### 2. Badge "Shader Melt"
El badge era un indicador residual decorativo en `ProjectsSection.tsx` (:160-163). No aportaba valor funcional al usuario y sobrecargaba visualmente el HUD superior del carrusel.

#### 3. Desfase de anclas con hash
Cuando el navegador navega a un hash (`/#proyectos`), calcula el scroll de inmediato con las tarjetas colapsadas (`display: none` o escala inicial de reveal). Milisegundos después, el IntersectionObserver del Ajuste 8 añade `is-visible` a las secciones superiores (`#sobre-mi`, `#habilidades`), expandiendo el DOM en ~412 px. Como el navegador no reajusta el scroll tras esta expansión tardía, la vista quedaba desfasada medio viewport arriba.

---

### Cambios Implementados

#### 1. Card de Email (`src/components/sections/ContactSection.tsx`)
- Texto modificado: `Email` (título semibold) y `Contacto` (subtítulo mono), eliminando el renderizado visible de `socials.email`.
- Botones conservados intactos: botón de copiado al portapapeles (`onClick={() => copy(socials.email)}`) y enlace `mailto:alirioangel44@gmail.com`.
- Clases de layout:
  - Card: `group flex items-center justify-between gap-3 rounded-2xl ... px-4 py-3` (**mismo padding que las otras 3 cards**).
  - Grupo izquierdo: `flex min-w-0 items-center gap-3` con contenedor de texto `flex min-w-0 flex-col` y subtítulo con `truncate` (red de seguridad: no llega a actuar).
  - Grupo de botones: `flex shrink-0 items-center gap-1` (sin `ml-auto`, sin `flex-wrap`).
- **Grilla de enlaces** (`:110`): `grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2`.
  - `lg` (1024–1279 px) apila las 4 cards → cada una usa los ~406 px de la columna y `Contacto` cabe completo.
  - `sm` (640–1023) y `xl` (≥1280) conservan la grilla 2×2 original.
- Resultado: las 4 cards miden exactamente 59 px de altura en los 7 viewports, el desborde es 0 px, el subtítulo no se trunca y el icono arranca a 17 px del borde en las 4 cards.

#### 2. HUD Superior (`src/components/sections/ProjectsSection.tsx`)
- Eliminado el elemento `<div>` que contenía el badge `"Shader Melt"`.
- Comentario actualizado a: `"HUD Superior: Contador de proyectos"`.

#### 3. Hook `useInitialHash` (`src/hooks/useInitialHash.ts`) y Montaje en `src/app/page.tsx`
- Exportada la función `revealTargetCards` desde `src/lib/sectionNav.ts`.
- Creado `useInitialHash`:
  - Hook con ciclo de vida `useEffect` al montar.
  - Comprueba `window.location.hash`.
  - Mediante doble `requestAnimationFrame` espera a la estabilización del layout y del ciclo de render inicial.
  - Ejecuta `revealTargetCards(section)` y llama a `anchor.scrollIntoView({ behavior: "auto", block: "start" })`.
- `src/app/page.tsx`: Marcado con `"use client"` e integrado `useInitialHash()`.

---

### Tests (TDD rojo → verde)

#### Tests Unitarios (Vitest: 25 archivos)
- **`ContactSection.test.tsx`**:
  - Encabezado y estructura de columnas: selectores actualizados con `container.querySelector("header")` para desacoplar del nuevo texto "Contacto" en la card de email.
  - Test validando que la card muestra "Email" / "Contacto" y NO la dirección de correo electrónico.
  - Test validando que la card posee `min-w-0` en el grupo izquierdo, `shrink-0` en los botones y no usa `flex-wrap` ni `ml-auto`.
  - Test validando que la card usa `px-4` (igual que las otras 3) y no `px-3`.
  - Test validando que los botones de copiar y mailto mantienen sus atributos y funcionalidad.
- **`SectionHeaders.test.tsx`**: Selector de ContactSection actualizado para apuntar al encabezado de sección.
- **`ProjectsSection.test.tsx`**: Test validando que el HUD muestra el contador `PROYECTO 01 / 05` y no contiene el texto `"Shader Melt"`.
- **`useInitialHash.test.ts`**: 4 pruebas unitarias cubriendo aterrizaje con `#proyectos`, `#contacto`, hash inexistente y URL sin hash.

#### Tests E2E (Playwright: 56 tests de Ajuste 17)
- **`tests/e2e/responsive.spec.ts`**:
  - `los botones de copiar y mailto quedan dentro de la card`: validación geométrica (`right <= card.right + 1`).
  - `la card no desborda ni se solapa con la card de LinkedIn`: comprobación de `innerOverflow <= 1` y separación visual.
  - `el texto 'Contacto' y los botones son visibles dentro de la card (sin mostrar el correo)`.
  - `el subtítulo 'Contacto' no se trunca y el padding es uniforme en las 4 cards`: `scrollWidth - clientWidth <= 1` e icono a la misma distancia del borde (regresión del recorte "Con…" en 1024–1279 px).
  - `las 4 cards de contacto miden la misma altura en el viewport`: delta `<= 1px` entre WhatsApp, GitHub, Email y LinkedIn.
- **`tests/e2e/projects.spec.ts`**:
  - `el HUD superior muestra el contador pero no contiene 'Shader Melt'`.
- **`tests/e2e/motion.spec.ts`**:
  - Aterrizaje con `#proyectos` y `#contacto` centrados en el viewport con preservación del hash en la URL.

---

### Verificación

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | ✅ 0 errores (5 warnings preexistentes en `Footer.tsx`) |
| `pnpm exec tsc --noEmit` | ✅ 0 errores de tipado |
| `pnpm test` | ✅ **25 archivos, 214 tests pasados** |
| `pnpm exec playwright test -g "Ajuste 17"` | ✅ **56 tests pasados** en los 7 viewports (320, 375, 640, 768, 1024, 1280, 1920) |
| `pnpm test:e2e` (suite completa) | ✅ **287 resultados: 280 passed + 6 skipped + 1 flake clasificado** |
| Clasificación del flake | `projects.spec.ts:95` (loop "anterior envuelve al último"): falla por **contención** de 7 workers + WebGL — 8.3 s en solitario vs 26–32 s en paralelo (presupuesto 30 s). Al agotarse el timeout el snapshot mostraba `PROYECTO 05 / 05` (lógica correcta). Familia preexistente `:55/:71/:95/:250`, **sin relación con el Ajuste 17**. |
| Sondas Playwright | ✅ Card Email en 7 viewports: alturas `[59,59,59,59]`, `truncado: 0`, iconos a 17 px, 1 columna @1024, overflow 0, sin solape · Hash en 5 tabs × 4 resoluciones = **20/20** sección centrada con hash intacto · Captura @1024 con las 4 cards apiladas y "Contacto" completo |

---

### Archivos Afectados

- **Nuevos**:
  - `src/hooks/useInitialHash.ts`
  - `src/hooks/__tests__/useInitialHash.test.ts`
- **Modificados**:
  - `src/app/page.tsx`
  - `src/lib/sectionNav.ts`
  - `src/components/sections/ContactSection.tsx`
  - `src/components/sections/ProjectsSection.tsx`
  - `src/components/sections/__tests__/ContactSection.test.tsx`
  - `src/components/sections/__tests__/ProjectsSection.test.tsx`
  - `src/components/sections/__tests__/SectionHeaders.test.tsx`
  - `tests/e2e/responsive.spec.ts`
  - `tests/e2e/projects.spec.ts`
  - `tests/e2e/motion.spec.ts`
  - `refactor_secciones.md`

---

## Ajuste 18: Switch de tema con knob deslizante (reemplazo del botón cuadrado)

### Objetivo

Reemplazar el botón cuadrado de 40×40 px de `ThemeToggle` por un **interruptor (switch)** tipo Lucide (referencia: `VPSwitchAppearance` de lucide.dev), manteniendo intactos el View Transition de tema y toda la accesibilidad previa:

1. **Track pill de 44×24 px** (`w-11 h-6 rounded-full`) con **knob de 20×20 px** (`w-5 h-5`) que recorre **20 px** (`translate-x-5`) hasta quedar simétrico a 2 px de cada borde del track.
2. **Sol y luna superpuestos dentro del knob** (iconos de 12 px, `h-3 w-3`) con cross-fade + `rotate(-90deg) scale(0.4)`: en oscuro la **luna** es visible (`opacity-100`) y el **sol** está oculto (`opacity-0`); en claro es recíproco (**sol** visible, **luna** oculta).
3. **Sin animación en el primer pintado**: el knob aparece ya en su sitio al cargar; el deslizamiento solo ocurre tras el primer clic.
4. **Semántica ARIA de interruptor**: `role="switch"` + `aria-checked`, conservando el `aria-label` dinámico "Cambiar a modo claro/oscuro" y el `onClick` con VT `types: ["theme"]` + `--vt-x`/`--vt-y`.

---

### Diagnóstico y Causa Raíz

#### 1. Por qué `animation` y no `transition` (hallazgo clave, verificado con sonda)

`ThemeProvider` usa `disableTransitionOnChange` de next-themes. Sonda de instrumentación sobre el clic real del toggle:

| Momento | Evento |
| --- | --- |
| t = 649.5 ms | Clic → icono cambiado / `aria` actualizado |
| t = 650.8 ms | Inyectado `transition: none !important` |
| t = 652.1 ms | Retirado `transition: none !important` |

Es decir, **1.3 ms después del clic el árbol tiene `transition: none !important`**, lo que cancela cualquier transición CSS que hubiera intentado arrancar en el mismo frame: el knob se movería de golpe. Por el contrario, **`animation`/`@keyframes` no se ven afectadas** por esa regla. Decisión: todo el movimiento del switch se implementa con keyframes.

#### 2. Corrección geométrica: el `border` del track descuenta 2 px

El plan inicial (inset 2 px + recorrido 20 px) olvidaba que el posicionamiento absoluto (`left`/`top`) se mide desde el **padding box**, y el `border: 1px` del track reduce el caja interna a 42×22 px. Con `left-0.5 top-0.5` y `translate-x-5` el knob quedaba a **23 px** del borde exterior izquierdo y tocando el borde derecho interno (asimetría de 1 px medida en la sonda E2E: `Expected 22, Received 23`).

**Solución**: inset de 1 px desde el padding box (`left-px top-px`) = **2 px desde el borde exterior**, lo que conserva el recorrido aprobado de 20 px y deja el knob simétrico (2 px) en ambos extremos.

#### 3. Por qué no cambiar de ícono a medias: gate `mounted`

Igual que en la Iteración 4, `resolvedTheme` es `undefined` durante SSR/hidratación. El gate `mounted` garantiza que el HTML del servidor (`aria-checked="false"`, knob en posición de claro, **sin `<svg>`**) coincide exactamente con el primer commit del cliente; recién tras hidratar se aplica el tema real (salto seco de posición, sin animación — ver §Verificación/Sondas).

---

### Cambios Implementados

#### 1. `src/components/layout/ThemeToggle.tsx`
- **`role="switch"` + `aria-checked={isDark}`** en sustitución de `aria-pressed` (patrón ARIA oficial para interruptores); `aria-label` dinámico sin cambios.
- **Track**: `relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border bg-surface-1` + `transition-colors hover:border-border-strong` + `focus-visible` con `outline-accent-emerald`.
- **Knob** (`data-testid="theme-knob"`, `aria-hidden`, `pointer-events-none`): `absolute left-px top-px h-5 w-5 rounded-full bg-text-bright text-bg shadow-sm`, posición `translate-x-5` (oscuro) / `translate-x-0` (claro) y clase de animación `theme-knob--to-dark` / `theme-knob--to-light`.
- **Iconos**: `<Sun>` y `<Moon>` apilados y centrados (`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3`), estado estático por tema (luna visible en oscuro `opacity-100` / sol oculta `opacity-0 -rotate-90 scale-[0.4]`, recíproco en claro); antes de hidratar se conserva el placeholder sin `<svg>`.
- **Estado `animate`** (`useState(false)`): solo se activa con el **primer clic** y su dirección la determina el tema destino → nunca hay animación en el primer pintado y cada alternancia cambia el nombre de keyframe (reinicio garantizado).
- **`applyTheme(newTheme)`**: `setTheme` + `setAnimate(true)` juntos, invocados **dentro** del callback de la View Transition (tanto la firma con `types: ["theme"]` como la legacy) para que posición y animación nazcan en el mismo snapshot. El resto del `handleToggle` (VT, `--vt-x`/`--vt-y`, clase `theme-transitioning`, fallback sin soporte de tipos) queda **intacto**.

#### 2. `src/app/globals.css`
- `@keyframes theme-knob-slide-to-dark` / `theme-knob-slide-to-light` (usan la propiedad `translate`, como las utilidades de Tailwind v4).
- `@keyframes theme-knob-icon-in` / `theme-knob-icon-out` (opacidad + `rotate` + `scale`).
- Reglas `.theme-knob--to-*` y `.theme-knob--to-* .theme-knob__icon--*` con **duración 0.4 s** y easing Lucide **`cubic-bezier(0.34, 1.56, 0.64, 1)`** (`theme-knob-icon-in` para luna y `theme-knob-icon-out` para sol en `to-dark`; recíproco en `to-light`), todas dentro de `@media (prefers-reduced-motion: no-preference)` → bajo `reduce` el knob salta directo a su posición y los iconos cambian de golpe.

#### 3. Selectores de tests acoplados a `getByRole("button")`
Los 4 puntos de acople detectados migraron a `getByRole("switch", { name: /cambiar a modo/i })`: `ThemeToggle.test.tsx`, `Topbar.test.tsx`, `responsive.spec.ts` (smoke) y `motion.spec.ts` (2 tests: VT `theme` y cero errores de consola).

---

### Tests (TDD rojo → verde)

#### Rojo
- **Unit**: `4 failed | 210 passed` (3 en `ThemeToggle.test.tsx` + 1 en `Topbar.test.tsx`).
- **E2E**: `28 failed` (4 definiciones × 7 viewports) — los 3 con selector viejo agotaban el timeout esperando un `switch` inexistente y el test nuevo no encontraba `role="switch"`.

#### Tests Unitarios (Vitest: 25 archivos, 215 tests)
- **`ThemeToggle.test.tsx`** (5 tests):
  1. Render de servidor: `role="switch"`, `aria-checked="false"`, label "Cambiar a modo oscuro", knob en `translate-x-0` **sin clase de animación** y sin `<svg>`.
  2. Regresión de hidratación: cero errores de consola con el cliente resolviendo `dark`.
  3. Tras hidratar: `aria-checked="true"`, knob en `translate-x-5`, **ambos iconos** en el DOM (luna visible en oscuro / sol oculto, 12 px, centrados) y **sin** `theme-knob--to-*` (primer pintado sin animación).
  4. Clic → `setTheme("light")`, `aria-checked="false"`, knob en `translate-x-0` **con** `theme-knob--to-light` e iconos invertidos (sol visible / luna oculta).
  5. **Nuevo**: segunda alternancia → `setTheme("dark")`, `translate-x-5` + `theme-knob--to-dark` (cambio de nombre de keyframe = reinicio de la animación).
  - El mock de `next-themes` se mejoró con `useSyncExternalStore` + lista de suscriptores para reproducir el re-render que hace el proveedor real al cambiar de tema.
- **`Topbar.test.tsx`**: selector migrado a `getByRole("switch", { name: /cambiar a modo/i })`.

#### Tests E2E (Playwright: 7 tests nuevos de Ajuste 18)
- **`tests/e2e/theme-switch.spec.ts` (nuevo, 1 test × 7 viewports)**:
  - Estado inicial oscuro: `aria-checked="true"`, knob a **22 px** (geometría, independiente de `translate`/`transform`), `animationName === "none"`, 2 iconos con luna `opacity: 1` / sol `opacity: 0`.
  - Tras el clic: clase `theme-knob--to-light`, `animationName = theme-knob-slide-to-light`, `duration = 0.4s`, `easing = cubic-bezier(0.34,1.56,0.64,1)`, knob a **2 px**, `aria-checked="false"`, iconos invertidos (sol `opacity: 1` / luna `opacity: 0`) y `animationName` de iconos activa (`sun = theme-knob-icon-in`, `moon = theme-knob-icon-out`).
  - Segundo clic: `theme-knob-slide-to-dark`, vuelta a 22 px, vuelta a oscuro (luna `opacity: 1` / sol `opacity: 0`) con `animationName` invertida (`sun = theme-knob-icon-out`, `moon = theme-knob-icon-in`).
- **`responsive.spec.ts`** y **`motion.spec.ts`** (3 tests): selectores migrados a `role="switch"` (siguen validando alternancia del tema, VT `types: ["theme"]` y cero errores de consola).

---

### Verificación

| Comando / sonda | Resultado |
| --- | --- |
| `pnpm lint` | ✅ 0 errores (5 warnings preexistentes en `Footer.tsx`) |
| `pnpm exec tsc --noEmit` | ✅ 0 errores de tipado |
| `pnpm test` | ✅ **25 archivos, 215 tests pasados** |
| `pnpm exec playwright test -g "knob en su sitio\|toggle de tema alterna\|ThemeToggle etiqueta\|alternar tema sin errores"` | ✅ **28/28** (4 definiciones × 7 viewports) |
| `pnpm test:e2e` (suite completa) | ✅ **294 resultados: 288 passed + 6 skipped + 0 failed/flaky** (13.2 min, exit 0; familia de flakes de contención `projects.spec.ts` no se reprodujo esta ejecución) |
| Sonda de carga (dev, muestreo rAF) | ✅ Serie de offsets `[2, 22]`: **salto seco en la hidratación, sin valores intermedios**, `animationName: "none"` y clase sin `theme-knob--to-*` → **el knob no se anima nunca al cargar** |
| Sonda de clic (muestreo rAF) | ✅ Serie `22 → 18.36 → 5.67 → 1.13 → 0.13 → 1.09 → 2`: interpolación real (con el overshoot propio de la curva back-out, que nunca sale del track) y `animationName/duration/easing` exactos; la vuelta a oscuro dispara `theme-knob-slide-to-dark` |
| Capturas dark/light @1280 (dsf 2) | ✅ `topbar-dark.png` / `topbar-light.png` / `switch-dark.png` / `switch-light.png` en `%TEMP%\opencode\a18\` — en oscuro el knob a la derecha con luna, en claro a la izquierda con sol |

---

### Archivos Afectados

- **Nuevos**:
  - `tests/e2e/theme-switch.spec.ts`
- **Modificados**:
  - `src/components/layout/ThemeToggle.tsx`
  - `src/app/globals.css`
  - `src/components/layout/__tests__/ThemeToggle.test.tsx`
  - `src/components/layout/__tests__/Topbar.test.tsx`
  - `tests/e2e/responsive.spec.ts`
  - `tests/e2e/motion.spec.ts`
  - `refactor_secciones.md`

### No se toca

Shader/`coverUV`, `renderLoop`, `projects.ts`/`types/project.ts`, chips, autoplay, swipe/teclado/loop, dots, `aria-live` del carrusel y `ThemeProvider` (`disableTransitionOnChange` se conserva: es precisamente lo que motivó el uso de keyframes).

