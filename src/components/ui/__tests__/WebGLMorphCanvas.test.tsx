import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { WebGLMorphCanvas } from "../WebGLMorphCanvas";

/**
 * Tests del render loop de WebGLMorphCanvas (Ajuste 10).
 *
 * jsdom no tiene WebGL ni `requestAnimationFrame` real: se mockea un
 * contexto WebGL falso (toda consulta truthy, toda llamada no-op) y
 * se controla la cola de frames a mano para observar cuándo el loop
 * se re-encadena, se cancela al salir del viewport y se reanuda al
 * volver a entrar.
 */

/** Crea un contexto WebGL falso utilizable por el componente en jsdom. */
function createFakeWebGLContext(): WebGLRenderingContext {
  // Cualquier acceso (constante o método) devuelve una función truthy;
  // al invocarse las consultas (getShaderParameter, getProgramParameter,
  // getUniformLocation...) devuelven true, de modo que la cadena de
  // arranque completa del componente pasa sin WebGL real.
  return new Proxy({} as WebGLRenderingContext, {
    get: () => () => true,
  });
}

/** Frames pendientes de ejecución (cola controlada por el test). */
let frameQueue: Array<{ id: number; cb: FrameRequestCallback }> = [];
let lastFrameId = 0;

/** Instala control manual de requestAnimationFrame/cancelAnimationFrame. */
function installFrameControl(): void {
  frameQueue = [];
  lastFrameId = 0;
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    lastFrameId += 1;
    frameQueue.push({ id: lastFrameId, cb });
    return lastFrameId;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
    frameQueue = frameQueue.filter((frame) => frame.id !== id);
  });
}

/** Ejecuta los frames pendientes (un tick del render loop). */
function flushFrames(): void {
  const pending = frameQueue;
  frameQueue = [];
  for (const frame of pending) frame.cb(performance.now());
}

/** Devuelve `getContext` al estado del setup global (null silencioso). */
function restoreGetContext(): void {
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    writable: true,
    configurable: true,
    value: () => null,
  });
}

/** Forma mínima del IntersectionObserver mockeado en setup.ts. */
type MockObserver = {
  elements: Set<Element>;
  trigger(isIntersecting: boolean): void;
};

/**
 * Dispara el observer mockeado que observa un elemento.
 *
 * @param element - Elemento observado (el canvas).
 * @param isIntersecting - Valor de visibilidad entregado al callback.
 * @returns `true` si había un observer observando el elemento.
 */
function triggerVisibility(element: Element, isIntersecting: boolean): boolean {
  const ctor = window.IntersectionObserver as unknown as {
    instances: MockObserver[];
  };
  const observer = ctor.instances.find((instance) =>
    instance.elements.has(element),
  );
  if (!observer) return false;
  observer.trigger(isIntersecting);
  return true;
}

describe("WebGLMorphCanvas — pausa del render loop fuera de viewport", () => {
  beforeEach(() => {
    installFrameControl();
    // Contexto WebGL falso para que el loop arranque en jsdom
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      writable: true,
      configurable: true,
      value: () => createFakeWebGLContext(),
    });
  });

  afterEach(() => {
    restoreGetContext();
    vi.restoreAllMocks();
  });

  it("cancela el loop al salir del viewport y lo reanuda al volver", () => {
    const { container, unmount } = render(
      <WebGLMorphCanvas
        images={["/projects/a.webp", "/projects/b.webp"]}
        activeIndex={0}
      />,
    );
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();

    // 1) Montaje: el loop arranca con un frame pendiente
    expect(frameQueue).toHaveLength(1);

    // 2) Un tick re-encadena el loop
    flushFrames();
    expect(frameQueue).toHaveLength(1);

    // 3) Sale del viewport → el frame pendiente se cancela
    expect(triggerVisibility(canvas!, false)).toBe(true);
    expect(frameQueue).toHaveLength(0);

    // 4) Fuera del viewport no se re-encadena ningún frame
    flushFrames();
    expect(frameQueue).toHaveLength(0);

    // 5) Vuelve al viewport → el loop se reanuda
    expect(triggerVisibility(canvas!, true)).toBe(true);
    expect(frameQueue).toHaveLength(1);
    flushFrames();
    expect(frameQueue).toHaveLength(1);

    // 6) Al desmontar se cancela el loop
    unmount();
    expect(frameQueue).toHaveLength(0);
  });
});

/** Registro de una subida de imagen observada (Ajuste 16). */
type ImageUpload = {
  /** Objeto fuente pasado a `texImage2D` (la instancia de `Image`). */
  source: unknown;
  /** Textura realmente enlazada en la unidad activa al subir. */
  boundId: number | undefined;
  /** Unidad de textura activa al subir (33984 = `TEXTURE0`). */
  activeUnit: number;
};

/** Estado observable del contexto WebGL grabador (Ajuste 14). */
type RecordingGL = {
  gl: WebGLRenderingContext;
  /**
   * Última textura vinculada por unidad de textura.
   * 33984 = `TEXTURE0` (tCurrent / base) y 33985 = `TEXTURE1` (tNext).
   */
  bound: Map<number, number>;
  /** Valores emitidos a `uniform1f("uProgress", …)` = mezcla visible. */
  progress: number[];
  /** Subidas de imagen con su destino real (Ajuste 16). */
  uploads: ImageUpload[];
  /** Ids de texturas borradas con `deleteTexture`, en orden (Ajuste 16). */
  deleted: number[];
  /** Unidad de textura activa en este momento (Ajuste 16). */
  currentUnit(): number;
};

/**
 * Contexto WebGL grabador para observar la transición desde fuera.
 *
 * A diferencia del contexto falso genérico, intercepta las llamadas
 * relevantes para el bug de interrupción (Ajuste 14):
 *
 * - `createTexture` devuelve objetos identificables en orden de
 *   creación (el componente itera `images` con `forEach`, así que el
 *   id corresponde al índice de imagen).
 * - `activeTexture`/`bindTexture` registran qué textura quedó en cada
 *   unidad, es decir qué imagen está usando `tCurrent` (base) y `tNext`.
 * - `getUniformLocation` devuelve el nombre del uniform para poder
 *   filtrar `uniform1f("uProgress", …)` y leer el progreso de mezcla.
 * - `texImage2D` registra cada subida de imagen con la textura
 *   realmente enlazada y la unidad activa (Ajuste 16).
 * - `deleteTexture` marca las texturas borradas: enlazar una ya
 *   borrada se modela como no-op, como hace WebGL (Ajuste 16).
 *
 * El resto de las consultas siguen devolviendo truthy/no-op como el
 * contexto falso histórico, para que la cadena de arranque completa
 * (shaders, programa, buffers) pase sin WebGL real.
 *
 * @returns Contexto grabador con las trazas expuestas.
 */
function createRecordingWebGLContext(): RecordingGL {
  const bound = new Map<number, number>();
  const progress: number[] = [];
  const uploads: ImageUpload[] = [];
  const deleted: number[] = [];
  const deletedIds = new Set<number>();
  // Constantes reales: el componente las lee como `gl.TEXTURE0/TEXTURE1`
  // y necesitamos identificarlas al registrar los bindings.
  const constants: Record<string, unknown> = {
    TEXTURE0: 33984,
    TEXTURE1: 33985,
  };
  // Unidad activa inicial de WebGL real: TEXTURE0.
  let activeUnit = 33984;
  let textureSeq = 0;

  const gl = new Proxy(constants, {
    get(target, prop) {
      if (typeof prop === "string" && prop in target) return target[prop];
      if (prop === "createTexture") {
        return () => ({ id: textureSeq++ });
      }
      if (prop === "activeTexture") {
        return (unit: number) => {
          activeUnit = unit;
        };
      }
      if (prop === "bindTexture") {
        return (_target: number, tex: { id: number } | null) => {
          // Como en WebGL: enlazar una textura YA BORRADA no cambia el
          // enlace de la unidad — por eso los píxeles de un `onload`
          // huérfano caen sobre la textura viva que quedó enlazada.
          if (tex && !deletedIds.has(tex.id)) bound.set(activeUnit, tex.id);
        };
      }
      if (prop === "getUniformLocation") {
        return (_program: unknown, name: string) => name;
      }
      if (prop === "uniform1f") {
        return (location: unknown, value: number) => {
          if (location === "uProgress") progress.push(value);
        };
      }
      if (prop === "deleteTexture") {
        return (tex: { id: number } | null) => {
          if (tex) {
            deleted.push(tex.id);
            deletedIds.add(tex.id);
            // WebGL: enlazar una textura borrada la desvincula de la
            // unidad (el bind es no-op sobre el mapa de unidades).
            for (const [unit, id] of bound) {
              if (id === tex.id) bound.delete(unit);
            }
          }
        };
      }
      if (prop === "texImage2D") {
        // Registra la subida con su destino REAL: la textura enlazada
        // en la unidad activa (como en WebGL, no el argumento target).
        return (...args: unknown[]) => {
          const source = args.length >= 6 ? args[5] : undefined;
          const unit = activeUnit;
          const boundId = bound.get(unit);
          uploads.push({ source, boundId, activeUnit: unit });
          return true;
        };
      }
      // resto: consultas truthy / llamadas no-op (mismo truco del
      // contexto falso histórico).
      return () => true;
    },
  }) as unknown as WebGLRenderingContext;

  return {
    gl,
    bound,
    progress,
    uploads,
    deleted,
    currentUnit: () => activeUnit,
  };
}

/**
 * Tests de interrupción de transición (Ajuste 14).
 *
 * Bug: el efecto de transición reinicia `animStartTime` al cambiar
 * `activeIndex`, pero `currentIndex` (textura base) solo avanzaba al
 * completar el 100% en el render loop. Con clics más rápidos que la
 * transición (1 s) la pantalla retrocedía a la imagen anterior
 * (snap-back) o se congelaba en la misma imagen mientras HUD/dots
 * avanzaban ("las imágenes se repiten").
 *
 * El tiempo se controla con `performance.now()` mockeado: el efecto
 * fija `animStartTime` con él y `flushFrames()` entrega el mismo reloj
 * como timestamp del frame, así el test decide cuánto "tiempo" corre
 * entre frames. jsdom no reduce la duración (`matchMedia` → false en
 * el setup global), por lo que la transición dura 1000 ms reales de
 * reloj simulado.
 */
describe("WebGLMorphCanvas — interrupción de transición (Ajuste 14)", () => {
  /** Imágenes del harness: el id de textura = índice en este array. */
  const IMAGES = [
    "/projects/p0.webp",
    "/projects/p1.webp",
    "/projects/p2.webp",
    "/projects/p3.webp",
  ];

  /** Reloj simulado: consumido por `performance.now()` y por los frames. */
  let fakeNow = 0;
  /** Trazas del contexto WebGL grabador. */
  let recording: RecordingGL;

  beforeEach(() => {
    installFrameControl();
    fakeNow = 0;
    recording = createRecordingWebGLContext();
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      writable: true,
      configurable: true,
      value: () => recording.gl,
    });
    vi.spyOn(performance, "now").mockImplementation(() => fakeNow);
  });

  afterEach(() => {
    restoreGetContext();
    vi.restoreAllMocks();
  });

  /** Último progreso de mezcla enviado al shader. */
  const lastProgress = (): number =>
    recording.progress[recording.progress.length - 1];

  /** Textura base (`tCurrent`, unidad TEXTURE0) tras el último frame. */
  const currentTexture = (): number | undefined => recording.bound.get(33984);

  /** Textura destino (`tNext`, unidad TEXTURE1) tras el último frame. */
  const nextTexture = (): number | undefined => recording.bound.get(33985);

  it("interrumpir con ≥50% de mezcla avanza la base a la imagen visible", () => {
    const { rerender } = render(
      <WebGLMorphCanvas images={IMAGES} activeIndex={0} />,
    );

    // Montaje sin transición: base = imagen 0 y mezcla en 0.
    flushFrames();
    expect(lastProgress()).toBe(0);
    expect(currentTexture()).toBe(0);
    expect(nextTexture()).toBe(0);

    // t=300ms: el usuario pasa al proyecto 1 → arranca la transición.
    fakeNow = 300;
    rerender(<WebGLMorphCanvas images={IMAGES} activeIndex={1} />);

    // t=900ms: 600/1000 → p=0.6 → ease(0.6)=0.68 (≥ 0.5): la pantalla
    // ya muestra mayoritariamente la imagen 1.
    fakeNow = 900;
    flushFrames();
    expect(lastProgress()).toBeCloseTo(0.68, 5);
    expect(currentTexture()).toBe(0);
    expect(nextTexture()).toBe(1);

    // t=900ms: interrupción — clic al proyecto 2 durante la transición.
    rerender(<WebGLMorphCanvas images={IMAGES} activeIndex={2} />);

    // t=916ms: primer frame tras la interrupción (mezcla casi 0, la
    // pantalla se dibuja casi solo con `tCurrent`).
    fakeNow = 916;
    flushFrames();

    // ROJO (sin fix): la base sigue en la imagen 0 → la pantalla vuelve
    // al proyecto anterior (snap-back) y, con clics rápidos, congela la
    // imagen mientras HUD/dots avanzan.
    // VERDE: la base se compromete en la imagen 1 (la que ya se veía).
    expect(currentTexture()).toBe(1);
    expect(nextTexture()).toBe(2);
  });

  it("interrumpir antes del 50% de mezcla mantiene la base actual", () => {
    const { rerender } = render(
      <WebGLMorphCanvas images={IMAGES} activeIndex={0} />,
    );
    flushFrames();

    // t=300ms: arranca la transición 0 → 1.
    fakeNow = 300;
    rerender(<WebGLMorphCanvas images={IMAGES} activeIndex={1} />);

    // t=500ms: 200/1000 → p=0.2 → ease(0.2)=0.08 (< 0.5).
    fakeNow = 500;
    flushFrames();
    expect(lastProgress()).toBeCloseTo(0.08, 5);

    rerender(<WebGLMorphCanvas images={IMAGES} activeIndex={2} />);
    fakeNow = 516;
    flushFrames();

    // El umbral 0.5 documenta el corte: con poca mezcla la base se
    // mantiene en la imagen original (comprometerla saltaría más de lo
    // que la pantalla ya mostraba). Este test no cambia con el fix.
    expect(currentTexture()).toBe(0);
    expect(nextTexture()).toBe(2);
  });

  it("tras interrumpir, la transición converge a la imagen final", () => {
    const { rerender } = render(
      <WebGLMorphCanvas images={IMAGES} activeIndex={0} />,
    );
    flushFrames();

    fakeNow = 300;
    rerender(<WebGLMorphCanvas images={IMAGES} activeIndex={1} />);
    fakeNow = 900;
    flushFrames();

    // Interrupción ≥50% (misma ventana que el primer test).
    rerender(<WebGLMorphCanvas images={IMAGES} activeIndex={2} />);
    fakeNow = 916;
    flushFrames();

    // Completar la transición nueva (1000 ms desde t=900).
    fakeNow = 1916;
    flushFrames();

    // Fin de animación: base = destino, `tNext` deja de apuntar a otra
    // textura y el progreso vuelve a 0 para la próxima transición.
    expect(currentTexture()).toBe(2);
    expect(nextTexture()).toBe(2);
    expect(lastProgress()).toBe(0);
  });
});

/** `window.Image` original: se restaura en el `afterEach`. */
const OriginalImage = window.Image;

/**
 * Doble controlable de `window.Image` (Ajuste 16).
 *
 * jsdom no descarga imágenes ni dispara `onload`, así que el test
 * decide cuándo llega cada callback — incluidos los tardíos de un lote
 * ya descartado, que es la carrera real de Strict Mode en dev.
 */
class MockImage {
  /** Instancias creadas por el componente, en orden de creación. */
  static instances: MockImage[] = [];
  crossOrigin: string | null = null;
  src = "";
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  /** Dimensiones que el componente registra al subir la imagen. */
  naturalWidth = 1360;
  naturalHeight = 651;

  constructor() {
    MockImage.instances.push(this);
  }
}

/** Reemplaza `window.Image` por el doble controlable. */
function installMockImage(): void {
  Object.defineProperty(window, "Image", {
    writable: true,
    configurable: true,
    value: MockImage,
  });
}

/** Restaura `window.Image` al constructor original de jsdom. */
function restoreMockImage(): void {
  Object.defineProperty(window, "Image", {
    writable: true,
    configurable: true,
    value: OriginalImage,
  });
}

/**
 * Tests de lotes de imagen descartados (Ajuste 16).
 *
 * Bug: en dev, Strict Mode ejecuta el efecto WebGL dos veces
 * (setup→cleanup→setup). Los `img.onload` del primer lote llegan
 * DESPUÉS de que su cleanup borró las texturas; `bindTexture` con una
 * textura borrada es no-op en WebGL, así que los píxeles se escriben
 * sobre la textura viva que ocupó la unidad activa → la ranura N
 * muestra la foto del proyecto M. El orden de los onloads decide quién
 * gana: por eso el bug era intermitente ("a veces bien, a veces mal").
 *
 * Fijura: guard `disposed` en cada callback (declarado ANTES del
 * `forEach`), anulación de handlers en el cleanup y subida explícita
 * desde TEXTURE0 (al llegar tarde, la unidad activa sería TEXTURE1 =
 * tNext y el bind temporal desplazaría la textura destino).
 */
describe("WebGLMorphCanvas — lotes de imagen descartados (Ajuste 16)", () => {
  /** Lote 1: el que Strict Mode descarta tras el primer cleanup. */
  const IMAGES_A = [
    "/projects/a0.webp",
    "/projects/a1.webp",
    "/projects/a2.webp",
    "/projects/a3.webp",
  ];
  /** Lote 2: el que queda vivo tras la re-ejecución del efecto. */
  const IMAGES_B = [
    "/projects/b0.webp",
    "/projects/b1.webp",
    "/projects/b2.webp",
    "/projects/b3.webp",
  ];

  /** Trazas del contexto WebGL grabador. */
  let recording: RecordingGL;

  beforeEach(() => {
    installFrameControl();
    MockImage.instances = [];
    recording = createRecordingWebGLContext();
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      writable: true,
      configurable: true,
      value: () => recording.gl,
    });
    installMockImage();
  });

  afterEach(() => {
    restoreGetContext();
    restoreMockImage();
    vi.restoreAllMocks();
  });

  /** Subidas de imagen reales (los placeholders no son `MockImage`). */
  const imageUploads = (): ImageUpload[] =>
    recording.uploads.filter((upload) => upload.source instanceof MockImage);

  it("las imágenes de un lote descartado no suben sus píxeles", () => {
    const { rerender } = render(
      <WebGLMorphCanvas images={IMAGES_A} activeIndex={0} />,
    );
    const oldBatch = [...MockImage.instances];
    expect(oldBatch).toHaveLength(IMAGES_A.length);

    // Nueva identidad de `images` → React ejecuta el cleanup del lote 1
    // (borra sus texturas) y luego el setup del lote 2, igual que la
    // doble ejecución del efecto en Strict Mode (dev).
    rerender(<WebGLMorphCanvas images={IMAGES_B} activeIndex={0} />);
    expect(recording.deleted).toHaveLength(IMAGES_A.length);
    expect(MockImage.instances).toHaveLength(
      IMAGES_A.length + IMAGES_B.length,
    );

    // Los `onload` del lote 1 llegan DESPUÉS del cleanup: su `tex`
    // ya fue borrado, pero `gl` sigue vivo en el closure.
    for (const img of oldBatch) img.onload?.();

    // ROJO: cada huérfano sube sus píxeles (texImage2D) sobre la
    // textura viva enlazada en la unidad activa → ranura ajena.
    // VERDE: guard `disposed` del lote + handlers anulados en cleanup.
    expect(imageUploads()).toHaveLength(0);
  });

  it("un `onload` posterior al desmontaje es ignorado", () => {
    const { unmount } = render(
      <WebGLMorphCanvas images={IMAGES_A} activeIndex={0} />,
    );
    const batch = [...MockImage.instances];
    expect(batch).toHaveLength(IMAGES_A.length);

    unmount();
    // ROJO: el cleanup no marca el lote como descartado → el callback
    // sube píxeles sobre texturas ya borradas.
    // VERDE: `disposed` + handlers anulados → no-op.
    for (const img of batch) img.onload?.();

    expect(imageUploads()).toHaveLength(0);
  });

  it("un `onload` vivo sube a su textura desde TEXTURE0", () => {
    render(<WebGLMorphCanvas images={IMAGES_A} activeIndex={0} />);

    // Un frame deja la unidad activa en TEXTURE1 (tNext), como en el
    // navegador tras el último cuadro.
    flushFrames();
    expect(recording.currentUnit()).toBe(recording.gl.TEXTURE1);

    // Carga real de la imagen 1 (su índice = id de su textura).
    MockImage.instances[1]?.onload?.();

    const uploads = imageUploads();
    expect(uploads).toHaveLength(1);
    // ROJO: sin `activeTexture(TEXTURE0)` el upload hereda TEXTURE1 y
    // pisa el enlace de tNext hasta el siguiente frame.
    // VERDE: el fix fija TEXTURE0 antes del bind+upload.
    expect(uploads[0].boundId).toBe(1);
    expect(uploads[0].activeUnit).toBe(recording.gl.TEXTURE0);
  });
});
