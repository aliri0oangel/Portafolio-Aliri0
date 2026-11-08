/**
 * Navegación a secciones con View Transitions (Ajuste 8).
 *
 * Unifica el salto de secciones (Topbar, MobileNav, CTA del Hero,
 * links del Footer cuando se reactiven) en una sola función con
 * progresión de soporte:
 *
 * - **Con soporte** (startViewTransition + tipos de VT
 *   `:active-view-transition-type` + sin prefers-reduced-motion):
 *   `document.startViewTransition({ update, types: ["section-nav"] })`
 *   con **scroll instantáneo** dentro del `update` (los snapshots
 *   old/new capturan los dos estados de scroll correctos) +
 *   `replaceState` del hash. El CSS de globals.css aplica el
 *   crossfade `section-nav` (~300ms) solo a este tipo.
 * - **Sin soporte o reduced-motion**: comportamiento previo exacto —
 *   `scrollIntoView` smooth (o "auto" con reduced-motion) + hash.
 *
 * "inicio" vuelve al tope con `window.scrollTo` en ambos caminos.
 */

/**
 * Opciones aceptadas por `document.startViewTransition` en
 * navegadores con soporte de tipos de transición (Chromium 125+).
 */
interface ViewTransitionOptions {
  update: () => void;
  types?: string[];
}

/** Firma completa de `document.startViewTransition` (composición + tipos). */
type StartViewTransitionDocument = Document & {
  startViewTransition?: (options: ViewTransitionOptions) => {
    finished?: Promise<void>;
  };
};

/**
 * Detecta soporte de tipos de View Transitions
 * (`:active-view-transition-type`).
 *
 * @returns `true` si el navegador soporta el CSS de tipos de VT.
 */
function supportsTransitionTypes(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.CSS !== "undefined" &&
    typeof window.CSS.supports === "function" &&
    window.CSS.supports("selector(:active-view-transition-type(section-nav))")
  );
}

/**
 * Lee `prefers-reduced-motion` de forma segura (sin matchMedia en
 * entornos extremos → considera reducido para no animar).
 *
 * @returns `true` si el usuario pide movimiento reducido.
 */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Revela las tarjetas (`reveal-card-grid`) de una sección para que
 * el layout quede a su altura final antes de medir el scroll.
 *
 * Si las tarjetas quedaran en `display:none` durante la medición:
 * - la sección crecería tras el aterrizaje y el ancla quedaría
 *   desplazada (re-centrado en viewports `lg` con `items-center`), o
 * - el documento estaría recortado (`max-scroll` insuficiente) y el
 *   salto no llegaría al ancla en viewports cortos.
 *
 * Solo se toca la sección destino (las demás conservan su reveal
 * natural por IntersectionObserver).
 *
 * @param section - Sección destino (puede ser `null`).
 */
export function revealTargetCards(section: HTMLElement | null): void {
  section
    ?.querySelectorAll<HTMLElement>(".reveal-card-grid:not(.is-visible)")
    .forEach((grid) => grid.classList.add("is-visible"));
}

/**
 * Desplaza la página a la sección destino (o al tope para "inicio")
 * con el comportamiento indicado y sincroniza el hash.
 *
 * El ancla de aterrizaje es el `data-nav-anchor` del `SectionHeader`
 * (fallback: el `<section>`); sin sección destino solo se actualiza
 * el hash. Antes de medir se revelan las tarjetas del destino
 * (ver {@link revealTargetCards}).
 *
 * @param id - Id de la sección destino ("inicio" = tope de página).
 * @param behavior - Comportamiento del scroll: `"auto"` (instantáneo,
 *   dentro de un update de View Transition o con reduced-motion) o
 *   `"smooth"` (fallback sin VT).
 */
function applyScrollAndHash(id: string, behavior: ScrollBehavior): void {
  if (id === "inicio") {
    window.scrollTo({ top: 0, behavior });
  } else {
    const section = document.getElementById(id);
    revealTargetCards(section);
    const anchor =
      section?.querySelector<HTMLElement>("[data-nav-anchor]") ?? section;
    anchor?.scrollIntoView({ behavior, block: "start" });
  }
  window.history.replaceState(null, "", `#${id}`);
}

/**
 * Navega a una sección del portafolio con View Transitions (o el
 * comportamiento clásico como fallback). Ver JSDoc del módulo.
 *
 * @param id - Id de la sección destino (`navLinks[].id` o "inicio").
 */
export function navigateToSection(id: string): void {
  const doc = document as StartViewTransitionDocument;
  const canUseVT =
    typeof doc.startViewTransition === "function" &&
    supportsTransitionTypes() &&
    !prefersReducedMotion();

  if (!canUseVT) {
    // Fallback: comportamiento previo exacto (smooth / auto).
    applyScrollAndHash(id, prefersReducedMotion() ? "auto" : "smooth");
    return;
  }

  doc.startViewTransition!({
    // Scroll instantáneo DENTRO del update: los snapshots old/new
    // capturan el estado antes/después del salto (sin animación de
    // scroll intermedia que distorsione el crossfade).
    update: () => applyScrollAndHash(id, "auto"),
    types: ["section-nav"],
  });
}
