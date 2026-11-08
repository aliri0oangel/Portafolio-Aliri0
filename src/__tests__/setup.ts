import "@testing-library/jest-dom/vitest";

/**
 * Setup global de Vitest (jsdom).
 *
 * jsdom no implementa APIs del navegador usadas por framer-motion
 * (IntersectionObserver, ResizeObserver) ni por next-themes
 * (matchMedia). Este archivo las mockea para que los tests de
 * componentes no fallen por entorno.
 */

// --- matchMedia (tema y prefers-reduced-motion) ---
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// --- IntersectionObserver (whileInView de framer-motion + reveal
// del Ajuste 8 vía useRevealOnScroll) ---
/**
 * Mock disparable manualmente (Ajuste 8).
 *
 * Registra cada instancia viva en `instances` y expone `trigger()`
 * para que los tests crucen el observer a mano (el hook de reveal
 * añade `is-visible` al elemento cuando `isIntersecting` es true).
 * Sin disparo manual, el comportamiento es el histórico: observe()
 * no-op → framer-motion nunca anima en jsdom.
 */
class MockIntersectionObserver {
  /** Instancias vivas: permite localizar la que observa un elemento. */
  static instances: MockIntersectionObserver[] = [];

  private readonly callback: IntersectionObserverCallback;
  /** Elementos observados actualmente por esta instancia. */
  readonly elements = new Set<Element>();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }

  observe(element: Element) {
    this.elements.add(element);
  }

  unobserve(element: Element) {
    this.elements.delete(element);
  }

  disconnect() {
    const index = MockIntersectionObserver.instances.indexOf(this);
    if (index !== -1) MockIntersectionObserver.instances.splice(index, 1);
    this.elements.clear();
  }

  takeRecords() {
    return [];
  }

  /**
   * Cruza el observer con los elementos observados.
   *
   * @param isIntersecting - Valor de `isIntersecting` entregado al callback.
   */
  trigger(isIntersecting: boolean) {
    const entries = [...this.elements].map((target) => ({
      target,
      isIntersecting,
      intersectionRatio: isIntersecting ? 1 : 0,
      time: 0,
      boundingClientRect: target.getBoundingClientRect(),
      intersectionRect: target.getBoundingClientRect(),
      rootBounds: null,
    })) as unknown as IntersectionObserverEntry[];
    this.callback(entries, this as unknown as IntersectionObserver);
  }
}
Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  value: MockIntersectionObserver,
});

// --- ResizeObserver ---
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: MockResizeObserver,
});

// --- HTMLCanvasElement.getContext (WebGL/2D no existen en jsdom) ---
// jsdom emite "Not implemented: HTMLCanvasElement's getContext()" en
// cada render (ruido en cada corrida de tests). Se devuelve null en
// silencio: los componentes tratan null como "sin soporte" y usan su
// fallback accesible (WebGLMorphCanvas → <Image>, AmbientCanvas → no-op).
// Un test que necesite un contexto distinto lo sobreescribe con
// defineProperty o vi.spyOn y lo restaura en su afterEach.
Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  writable: true,
  configurable: true,
  value: () => null,
});

// --- scrollTo suave (navegación por anclas) ---
Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});
