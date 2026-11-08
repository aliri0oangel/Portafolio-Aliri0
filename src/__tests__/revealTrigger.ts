/**
 * Utilidad de test del Motion System (Ajuste 8): cruza a mano el
 * `IntersectionObserver` mockeado en `setup.ts` sobre un elemento.
 *
 * Uso típico: renderizar una sección con `reveal-card-grid`, comprobar
 * que arranca SIN `is-visible` y luego llamar a `triggerReveal(grid)`
 * para verificar que el hook `useRevealOnScroll` revela las tarjetas.
 *
 * @param element - Elemento cuyo observer (vivo) debe dispararse.
 * @returns `true` si había un observer observando el elemento.
 */
export function triggerReveal(element: Element): boolean {
  /** Forma mínima del mock de setup.ts que necesitan los tests. */
  type MockObserver = {
    elements: Set<Element>;
    trigger(isIntersecting: boolean): void;
  };
  type MockObserverConstructor = { instances: MockObserver[] };

  const constructor = window.IntersectionObserver as unknown as MockObserverConstructor;
  const observer = constructor.instances.find((instance) =>
    instance.elements.has(element),
  );

  if (!observer) return false;
  observer.trigger(true);
  return true;
}
