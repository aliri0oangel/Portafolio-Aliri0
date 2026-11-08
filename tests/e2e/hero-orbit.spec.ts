import { test, expect, type Page } from "@playwright/test";

/**
 * Regresiones E2E del sistema orbital (2 columnas del Hero).
 *
 * Se ejecutan en los 7 viewports (320→1920) de `playwright.config.ts`
 * contra el build de producción, y cubren los dos bugs reportados:
 *
 * 1. Fase del arco: el CSS servido arranca en 0° (sin `from`), para que el
 *    punto marque la cabeza del arco y no quede a mitad de la estela.
 * 2. Presión del avatar: al mantener pulsado el sistema se contrae a 0.75
 *    **sin desaparecer** (opacidad 1) y al soltar recupera el tamaño.
 */

/** Estado legible del sistema orbital (opacidad + escala + bandera). */
function readOrbitState(page: Page) {
  return page.evaluate(() => {
    const root = document.querySelector('[data-testid="hero-orbit"]');
    const avatar = root?.querySelector('[role="button"]') ?? null;
    const scaleOf = (element: Element | null) => {
      const transform = element ? getComputedStyle(element).transform : "none";
      const match = transform.match(/matrix\(([-\d.]+)/);
      return match ? Number(Number(match[1]).toFixed(2)) : 1;
    };
    const trails = [
      ...document.querySelectorAll('[data-testid="orbit-trail"]'),
    ];
    return {
      pressed: root?.getAttribute("data-pressed") ?? null,
      avatarOpacity: avatar ? getComputedStyle(avatar).opacity : "0",
      avatarScale: scaleOf(avatar),
      ringScales: trails.map((trail) => scaleOf(trail)),
      ringOpacities: trails.map((trail) => getComputedStyle(trail).opacity),
    };
  });
}

test.describe("HeroOrbit: CSS servido en fase 0°", () => {
  test("los arcos conic no traen `from` desplazado en el CSS del build", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("hero-orbit")).toBeVisible();

    for (const variant of ["a", "b"] as const) {
      const background = await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        return element ? getComputedStyle(element).backgroundImage : null;
      }, `.orbit-gradient-${variant}`);

      expect(background, `orbit-gradient-${variant}`).toContain("conic-gradient(");
      expect(background, `orbit-gradient-${variant}`).not.toMatch(
        /conic-gradient\(\s*from\b/,
      );
    }
  });
});

test.describe("HeroOrbit: presión sin desaparición", () => {
  test("contrae a 0.75 sin perder opacidad y crece de nuevo al soltar", async ({ page }) => {
    await page.goto("/");
    const avatar = page
      .getByTestId("hero-orbit")
      .getByRole("button", { name: /Avatar de Alirio/i });
    await avatar.scrollIntoViewIfNeeded();
    await avatar.hover();
    await page.mouse.down();

    // Presión: opacidad fija en 1 (antes caía a 0) y escala estable en 0.75
    await expect.poll(() => readOrbitState(page), { timeout: 4000 }).toEqual({
      pressed: "true",
      avatarOpacity: "1",
      avatarScale: 0.75,
      ringScales: [0.75, 0.75, 0.75, 0.75],
      ringOpacities: ["1", "1", "1", "1"],
    });

    // Con el puntero capturado, salirse del avatar no interrumpe el gesto
    await page.mouse.move(10, 10);
    await expect.poll(() => readOrbitState(page), { timeout: 2000 }).toMatchObject({
      pressed: "true",
      avatarOpacity: "1",
      avatarScale: 0.75,
    });

    // Soltado fuera del avatar: la captura hace que el gesto se cierre
    await page.mouse.up();
    await expect.poll(() => readOrbitState(page), { timeout: 7000 }).toEqual({
      pressed: "false",
      avatarOpacity: "1",
      avatarScale: 1,
      ringScales: [1, 1, 1, 1],
      ringOpacities: ["1", "1", "1", "1"],
    });
  });
});

test.describe("HeroOrbit: orden de retorno invertido (Ajuste 3)", () => {
  test("al soltar, el avatar crece antes que cualquier anillo (empuje hacia afuera)", async ({
    page,
  }) => {
    await page.goto("/");
    const avatar = page
      .getByTestId("hero-orbit")
      .getByRole("button", { name: /Avatar de Alirio/i });
    await avatar.scrollIntoViewIfNeeded();
    await avatar.hover();
    await page.mouse.down();
    await expect.poll(() => readOrbitState(page), { timeout: 4000 }).toMatchObject({
      avatarScale: 0.75,
    });

    // Tras soltar, muestrear frame a frame el primer instante en que cada
    // pieza supera 0.755: el avatar debe liderar la salida (release).
    await page.mouse.up();
    const order = await page.evaluate(async () => {
      const waitFrame = () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const scaleOf = (element: Element | null) => {
        const transform = element ? getComputedStyle(element).transform : "none";
        const match = transform.match(/matrix\(([-\d.]+)/);
        return match ? Number(match[1]) : 1;
      };
      const root = document.querySelector('[data-testid="hero-orbit"]');
      const avatar = root?.querySelector('[role="button"]') ?? null;
      const rings = [...document.querySelectorAll('[data-testid="orbit-trail"]')];
      let avatarFrame = -1;
      const ringFrames = rings.map(() => -1);
      for (let frame = 0; frame < 90; frame += 1) {
        if (avatarFrame < 0 && scaleOf(avatar) > 0.755) avatarFrame = frame;
        rings.forEach((ring, index) => {
          if (ringFrames[index] < 0 && scaleOf(ring) > 0.755) {
            ringFrames[index] = frame;
          }
        });
        if (
          avatarFrame >= 0 &&
          ringFrames.every((ringFrame) => ringFrame >= 0)
        ) {
          break;
        }
        await waitFrame();
      }
      return { avatarFrame, ringFrames };
    });

    expect(order.avatarFrame).toBeGreaterThanOrEqual(0);
    for (const [index, ringFrame] of order.ringFrames.entries()) {
      expect(ringFrame, `anillo índice ${index}`).toBeGreaterThanOrEqual(0);
      expect(order.avatarFrame, `anillo índice ${index}`).toBeLessThanOrEqual(
        ringFrame,
      );
    }
    // El anillo exterior (último en el empuje) termina al final
    expect(order.avatarFrame).toBeLessThan(order.ringFrames[0]);
  });
});
