import { test, expect, type Page } from "@playwright/test";

/**
 * Tests E2E del Smooth Scroll (Ajuste 9).
 *
 * Regresión: el `limit` de Lenis quedaba congelado en el valor del
 * layout inicial (cards con `display:none` del Ajuste 8) porque su
 * `ResizeObserver` observa `document.documentElement`, cuyo border-box
 * no cambia (el scrolleo real lo lleva el viewport por la propagación
 * de `body { overflow-x: hidden }`). La rueda se clampeaba 695 px
 * antes del footer.
 *
 * Valida en Chromium real que:
 * - La rueda alcanza el final real del documento (`max - scrollY ≤ 1`).
 * - El footer queda visible en pantalla al final del recorrido.
 */

/** Estado de scroll y footer capturado en el cliente. */
interface ScrollSnapshot {
  /** Posición vertical actual (`window.scrollY`). */
  scrollY: number;
  /** Límite real del documento (`scrollHeight - innerHeight`). */
  max: number;
  /** Top del footer relativo al viewport (`null` si no existe). */
  footerTop: number | null;
  /** `true` si el footer intersecta el viewport. */
  footerVisible: boolean;
}

/**
 * Lee el estado actual de scroll y del footer en el cliente.
 *
 * @param page - Página de Playwright (tras el goto).
 * @returns Instantánea de scroll y footer.
 */
async function snapshot(page: Page): Promise<ScrollSnapshot> {
  return page.evaluate(() => {
    const footer = document.querySelector("footer");
    const rect = footer?.getBoundingClientRect();
    return {
      scrollY: Math.round(window.scrollY),
      max: Math.round(document.documentElement.scrollHeight - window.innerHeight),
      footerTop: rect ? Math.round(rect.top) : null,
      footerVisible: rect
        ? rect.top < window.innerHeight && rect.bottom > 0
        : false,
    };
  });
}

/**
 * Rueda hacia abajo hasta alcanzar el final real del documento.
 *
 * Simula al usuario con `mouse.wheel`, dejando asentar la animación
 * de Lenis (1.2 s) y el debounce del `ResizeObserver` (250 ms) entre
 * rondas, para que el documento pueda crecer por los reveals del
 * Ajuste 8 durante el recorrido.
 *
 * @param page - Página de Playwright (tras el goto).
 * @param maxRounds - Rondas máximas de rueda (tope de seguridad).
 * @returns Instantánea final tras el recorrido.
 */
async function wheelToBottom(
  page: Page,
  maxRounds = 25,
): Promise<ScrollSnapshot> {
  await page.mouse.move(400, 300);

  let last = await snapshot(page);
  for (let round = 0; round < maxRounds; round++) {
    await page.mouse.wheel(0, 1500);
    await page.waitForTimeout(150);
    await page.mouse.wheel(0, 1500);
    await page.waitForTimeout(150);
    // Asentado: animación de Lenis + debounce del ResizeObserver
    await page.waitForTimeout(400);

    last = await snapshot(page);
    if (last.max - last.scrollY <= 1 && last.footerVisible) return last;
  }
  return last;
}

test("SmoothScroll (Ajuste 9): la rueda alcanza el final del documento y el footer queda visible", async ({
  page,
}) => {
  // Recorrido largo hasta el fondo (rueda + asentado): 60 s de tope.
  test.setTimeout(60_000);
  await page.goto("/", { waitUntil: "networkidle" });

  const final = await wheelToBottom(page);

  // El límite de Lenis debe seguir el layout real (hoy se estancaba
  // en 2311 con un max de 3006: 695 px antes del footer).
  expect(final.max - final.scrollY).toBeLessThanOrEqual(1);
  // El footer, último elemento del documento, debe verse al fondo.
  expect(final.footerVisible).toBe(true);
});
