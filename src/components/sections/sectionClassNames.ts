/**
 * Clases comunes de las secciones de contenido (Fase 1 — patrón de
 * la referencia herasi.dev).
 *
 * ## Altura: llenar la pantalla sin dejar asomar la siguiente
 *
 * `min-h-[100svh]` (+ bump por breakpoint) + la escala de respiro
 * `py-20 sm:py-24 lg:py-28` (80/96/112px, literal de la referencia).
 *
 * La nav aterriza en el `data-nav-anchor` (eyebrow) alineado a
 * 88px (`scroll-padding-top: 5.5rem`). Con el contenido alineado
 * al tope, el eyebrow queda a `py` del borde de la sección, así
 * que el borde inferior de esta tras aterrizar es:
 *
 *   88 − py + alto  ≥  viewport   ⟺   alto ≥ viewport − 88 + py
 *
 * De ahí el bump: `100svh` (py=80 ≤ 88 → sobra 8px),
 * `+0.5rem` en sm (py=96 → exacto) y `+1.5rem` en lg (py=112 →
 * exacto). **Ninguna sección deja asomar la siguiente** en ningún
 * alineamiento (tope natural, aterrizaje por ancla o hash).
 * Se usa `svh` (no `vh`) porque en móvil la barra URL cambia la
 * altura del viewport: `svh` es el valor estable. El topbar fijo
 * (h-16 = 64px) flota sobre la sección.
 *
 * ## Sin centrado vertical (a diferencia de la referencia)
 *
 * herasi centra con `flex justify-center`, pero con el aterrizaje
 * por eyewbrow eso desplazaría el eyebrow a media sección y
 * rompería el contrato del Ajuste 8 (eyebrow a 88px, "cerca del
 * tope") — y reintroduciría el asomo (el centrado añade medio
 * hueco al offset del ancla). El equilibrio vertical se logra
 * estirando el contenido a la altura disponible
 * (Fase 2: `flex flex-col` en la sección + `flex-1` en el
 * contenedor/grilla + `auto-rows-fr` + `h-full` en las tarjetas,
 * como herasi con sus grids): cuando el contenido llena el área,
 * centrar o alinear al tope es idéntico.
 *
 * - `section-contain`: utilidad existente de `globals.css`
 *   (`content-visibility: auto` para omitir paint fuera del primer
 *   pliegue; su `contain-intrinsic-size` se sincroniza con este
 *   alto en globals.css). Solo aplica cuando el contenido real
 *   ≤ min-h (About/Skills/Contacto): si el contenido lo supera,
 *   el reveal cambiaría la altura y desplazaría las secciones
 *   siguientes (layout shift en el 1er aterrizaje). Proyectos
 *   usa {@link SECTION_FULL_HEIGHT_NO_CONTAIN} por ese motivo.
 *
 * @example
 * <section className={SECTION_FULL_HEIGHT}>…</section>
 */
export const SECTION_FULL_HEIGHT =
  "section-contain flex flex-col min-h-[100svh] sm:min-h-[calc(100svh+0.5rem)] lg:min-h-[calc(100svh+1.5rem)] py-20 sm:py-24 lg:py-28";

/**
 * Variante sin `content-visibility` para secciones cuyo contenido
 * real puede superar el min-h (Proyectos: el stage 16/9 + header
 * miden ~1185px en 1920×1080 > min-h 1104px). Con
 * `content-visibility: auto` la sección se maqueta a min-h mientras
 * está fuera del viewport y crece al revelarse, empujando las
 * secciones siguientes (~81px) y rompiendo la estabilidad del
 * aterrizaje 1er/2do clic (motion.spec).
 */
export const SECTION_FULL_HEIGHT_NO_CONTAIN =
  "flex flex-col min-h-[100svh] sm:min-h-[calc(100svh+0.5rem)] lg:min-h-[calc(100svh+1.5rem)] py-20 sm:py-24 lg:py-28";
