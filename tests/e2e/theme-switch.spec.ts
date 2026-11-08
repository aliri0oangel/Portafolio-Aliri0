import { test, expect, type Locator } from "@playwright/test";

/**
 * Ajuste 18 — Switch de tema con knob deslizante (tipo Lucide).
 *
 * El conmutador del topbar pasó de botón cuadrado a interruptor
 * (`role="switch"` + `aria-checked`) con knob de 20 px que recorre
 * 20 px dentro de un track de 44×24.
 *
 * Verificaciones por test (1 test × 7 viewports):
 * - Posición del knob: 22 px en oscuro (2 de inset + 20 de recorrido)
 *   y 2 px en claro, medida por geometría (independiente de si el
 *   desplazamiento va por `translate` o `transform`).
 * - Sin animación en el primer pintado (`animationName === "none"`):
 *   la clase `theme-knob--to-*` solo se arma tras el primer clic.
 * - Tras el clic: `@keyframes` de 0.4 s con easing Lucide
 *   `cubic-bezier(.34,1.56,.64,1)` — nunca `transition`, porque
 *   `disableTransitionOnChange` (next-themes) inyecta
 *   `transition: none !important` ~1.3 ms después del clic.
 * - Ambos iconos (sol y luna) en el DOM con cross-fade.
 */

/** Desplazamiento horizontal del knob dentro de su track. */
async function knobOffsetX(knob: Locator): Promise<number> {
  return knob.evaluate((el) => {
    const track = el.parentElement as HTMLElement;
    return el.getBoundingClientRect().left - track.getBoundingClientRect().left;
  });
}

test.describe("Switch de tema con knob deslizante (Ajuste 18)", () => {
  test.beforeEach(async ({ page }) => {
    // El slide vive en @keyframes dentro de prefers-reduced-motion:
    // no-preference; se fija explícito para que la animación exista.
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
  });

  test("knob en su sitio sin animación al cargar y deslizándose tras el clic", async ({
    page,
  }) => {
    const toggle = page.getByRole("switch", { name: /Cambiar a modo/i });
    const knob = page.getByTestId("theme-knob");

    // --- Estado inicial: oscuro (defaultTheme="dark") ---
    await expect(toggle).toHaveAttribute("aria-checked", "true");
    await expect(knob).toBeVisible();

    // Ambos iconos apilados en el knob; luna visible en oscuro, sol oculto
    await expect(knob.locator("svg")).toHaveCount(2);
    await expect(knob.locator(".theme-knob__icon--sun")).toHaveCSS(
      "opacity",
      "0",
    );
    await expect(knob.locator(".theme-knob__icon--moon")).toHaveCSS(
      "opacity",
      "1",
    );

    // Knob ya en su sitio al cargar (22 px) y SIN animación alguna
    await expect.poll(() => knobOffsetX(knob)).toBe(22);
    expect(
      await knob.evaluate((el) => getComputedStyle(el).animationName),
    ).toBe("none");

    // --- Primer clic → claro: se arma la animación de ida ---
    await toggle.click();
    await expect
      .poll(() => knob.evaluate((el) => el.className))
      .toContain("theme-knob--to-light");

    const toLight = await knob.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        name: cs.animationName,
        duration: cs.animationDuration,
        easing: cs.animationTimingFunction.replace(/\s+/g, ""),
      };
    });
    expect(toLight.name).toBe("theme-knob-slide-to-light");
    expect(toLight.duration).toBe("0.4s");
    expect(toLight.easing).toBe("cubic-bezier(0.34,1.56,0.64,1)");

    // Animación activa en los iconos: sol entrando, luna saliendo
    expect(
      await knob
        .locator(".theme-knob__icon--sun")
        .evaluate((el) => getComputedStyle(el).animationName),
    ).toBe("theme-knob-icon-in");
    expect(
      await knob
        .locator(".theme-knob__icon--moon")
        .evaluate((el) => getComputedStyle(el).animationName),
    ).toBe("theme-knob-icon-out");

    // Estado final claro: knob a la izquierda e iconos invertidos
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await expect.poll(() => knobOffsetX(knob)).toBe(2);
    await expect(knob.locator(".theme-knob__icon--sun")).toHaveCSS(
      "opacity",
      "1",
    );
    await expect(knob.locator(".theme-knob__icon--moon")).toHaveCSS(
      "opacity",
      "0",
    );

    // --- Segundo clic → oscuro: animación de vuelta con el otro nombre ---
    await toggle.click();
    await expect
      .poll(() => knob.evaluate((el) => el.className))
      .toContain("theme-knob--to-dark");
    expect(
      await knob.evaluate((el) => getComputedStyle(el).animationName),
    ).toBe("theme-knob-slide-to-dark");
    expect(
      await knob
        .locator(".theme-knob__icon--sun")
        .evaluate((el) => getComputedStyle(el).animationName),
    ).toBe("theme-knob-icon-out");
    expect(
      await knob
        .locator(".theme-knob__icon--moon")
        .evaluate((el) => getComputedStyle(el).animationName),
    ).toBe("theme-knob-icon-in");

    await expect(toggle).toHaveAttribute("aria-checked", "true");
    await expect.poll(() => knobOffsetX(knob)).toBe(22);
    await expect(knob.locator(".theme-knob__icon--sun")).toHaveCSS(
      "opacity",
      "0",
    );
    await expect(knob.locator(".theme-knob__icon--moon")).toHaveCSS(
      "opacity",
      "1",
    );
  });
});
