import { test, expect, type Locator, type Page } from "@playwright/test";
import { projects } from "../../src/data/projects";

/** Selectores de la sección de proyectos. */
const section = "#proyectos";
const dots = '[aria-label^="Ir al proyecto"]';

/** Lee los puntos del carrusel: cantidad y cuál tiene `aria-current`. */
function readDots(page: Page) {
  return page.evaluate(() => {
    const items = [
      ...document.querySelectorAll('[aria-label^="Ir al proyecto"]'),
    ] as HTMLElement[];
    const activeIndex = items.findIndex(
      (item) => item.getAttribute("aria-current") === "true",
    );
    return { count: items.length, activeIndex };
  });
}

/**
 * Pausa el autoplay con un hover sobre el stage cinemático.
 */
async function pauseAutoplay(sectionEl: Locator) {
  await sectionEl.locator('[aria-roledescription="carrusel"]').hover();
}

/** Normaliza el carrusel al primer proyecto: pausa y selecciona el proyecto 1. */
async function normalizeToFirstProject(page: Page, sectionEl: Locator) {
  await pauseAutoplay(sectionEl);
  await sectionEl.locator(dots).nth(0).click();
  await expect
    .poll(async () => (await readDots(page)).activeIndex, { timeout: 4000 })
    .toBe(0);
}

test.describe("ProjectsSection: Puntos Indicadores del Carrusel", () => {
  test("los puntos reflejan el catálogo y el seleccionado", async ({
    page,
  }) => {
    await page.goto("/");
    const sectionEl = page.locator(section);
    await sectionEl.scrollIntoViewIfNeeded();

    await expect(sectionEl.locator(dots)).toHaveCount(projects.length);

    // Normaliza al proyecto 1 y salta al 3.º: aria-current se desplaza
    await normalizeToFirstProject(page, sectionEl);
    await sectionEl.locator(dots).nth(2).click();
    await expect
      .poll(async () => (await readDots(page)).activeIndex, { timeout: 4000 })
      .toBe(2);
  });

  test("la flecha siguiente avanza el proyecto y el punto activo", async ({
    page,
  }) => {
    await page.goto("/");
    const sectionEl = page.locator(section);
    await sectionEl.scrollIntoViewIfNeeded();
    await normalizeToFirstProject(page, sectionEl);

    await sectionEl.getByRole("button", { name: "Proyecto siguiente" }).click();
    await expect
      .poll(async () => (await readDots(page)).activeIndex, { timeout: 4000 })
      .toBe(1);
  });
});

test.describe("ProjectsSection: Loop Infinito", () => {
  test("desde el último proyecto, siguiente envuelve al primero", async ({
    page,
  }) => {
    await page.goto("/");
    const sectionEl = page.locator(section);
    await sectionEl.scrollIntoViewIfNeeded();
    await pauseAutoplay(sectionEl);
    const last = projects.length - 1;

    // Saltar al último proyecto por su punto
    await sectionEl.locator(dots).nth(last).click();
    await expect
      .poll(async () => (await readDots(page)).activeIndex, { timeout: 4000 })
      .toBe(last);

    // Loop: la flecha siguiente envuelve al proyecto 1
    const next = sectionEl.getByRole("button", { name: "Proyecto siguiente" });
    await expect(next).toBeEnabled();
    await next.click();
    await expect
      .poll(async () => (await readDots(page)).activeIndex, { timeout: 4000 })
      .toBe(0);
  });

  test("desde el primero, anterior envuelve al último", async ({ page }) => {
    await page.goto("/");
    const sectionEl = page.locator(section);
    await sectionEl.scrollIntoViewIfNeeded();
    await normalizeToFirstProject(page, sectionEl);

    const prev = sectionEl.getByRole("button", { name: "Proyecto anterior" });
    await expect(prev).toBeEnabled();
    await prev.click();
    await expect
      .poll(async () => (await readDots(page)).activeIndex, { timeout: 4000 })
      .toBe(projects.length - 1);
  });
});

test.describe("ProjectsSection: Autoplay", () => {
  test("el stage avanza solo sin interacción del usuario", async ({ page }) => {
    await page.goto("/");
    const sectionEl = page.locator(section);
    await sectionEl.scrollIntoViewIfNeeded();

    const initial = (await readDots(page)).activeIndex;
    await expect
      .poll(async () => (await readDots(page)).activeIndex, { timeout: 9000 })
      .not.toBe(initial);
  });

  test("con movimiento reducido el carrusel no avanza solo", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const sectionEl = page.locator(section);
    await sectionEl.scrollIntoViewIfNeeded();

    // Mucho más que el delay del autoplay (4 s): sin avance esperado
    await page.waitForTimeout(5500);
    expect((await readDots(page)).activeIndex).toBe(0);
  });
});

test.describe("ProjectsSection: HUD Informativo y Demo Link", () => {
  test("el HUD muestra el título del proyecto y el enlace a la demo", async ({
    page,
  }) => {
    await page.goto("/");
    const first = projects[0];
    const sectionEl = page.locator(section);
    await sectionEl.scrollIntoViewIfNeeded();
    await normalizeToFirstProject(page, sectionEl);

    const heading = sectionEl.getByRole("heading", {
      level: 3,
      name: first.title,
    });
    await expect(heading).toBeVisible();

    const demoLink = sectionEl.getByRole("link", { name: /ver demo/i });
    await expect(demoLink).toBeVisible();
    await expect(demoLink).toHaveAttribute("href", first.liveUrl!);
    await expect(demoLink).toHaveAttribute("target", "_blank");
  });

  test("cada badge del HUD del proyecto muestra su respectivo icono de tecnología", async ({
    page,
  }) => {
    await page.goto("/");
    const first = projects[0];
    const sectionEl = page.locator(section);
    await sectionEl.scrollIntoViewIfNeeded();
    await normalizeToFirstProject(page, sectionEl);

    // Los badges del HUD activo contienen svgs
    const badgesWithIcons = sectionEl
      .locator('[aria-roledescription="carrusel"] ul svg');
    await expect(badgesWithIcons).toHaveCount(first.technologies.length);
  });

  test("el HUD superior muestra el contador pero no contiene 'Shader Melt' (Ajuste 17)", async ({
    page,
  }) => {
    await page.goto("/");
    const sectionEl = page.locator(section);
    await sectionEl.scrollIntoViewIfNeeded();

    await expect(sectionEl.getByText(/PROYECTO \d{2} \/ \d{2}/)).toBeVisible();
    await expect(sectionEl.getByText("Shader Melt")).toHaveCount(0);
  });
});

test.describe("ProjectsSection: Stage proporcional + footer compacto (Ajuste 13)", () => {
  test("el stage es proporcional (≤1024px, centrado y 16/9 en lg), el footer ≤672px centrado y las flechas en el eje", async ({
    page,
  }) => {
    await page.goto("/");
    const sectionEl = page.locator(section);
    await sectionEl.scrollIntoViewIfNeeded();
    await normalizeToFirstProject(page, sectionEl);

    const stage = sectionEl.locator('[aria-roledescription="carrusel"]');
    const card = stage.locator('[aria-live="polite"]');
    const demoLink = sectionEl.getByRole("link", { name: /ver demo/i });
    const prev = sectionEl.getByRole("button", { name: "Proyecto anterior" });
    const next = sectionEl.getByRole("button", { name: "Proyecto siguiente" });

    const stageBox = (await stage.boundingBox())!;
    const cardBox = (await card.boundingBox())!;
    const demoBox = (await demoLink.boundingBox())!;
    const prevBox = (await prev.boundingBox())!;
    const nextBox = (await next.boundingBox())!;
    const viewportWidth = page.viewportSize()!.width;

    // 1) Stage acotado a max-w-5xl (1024px) en todos los viewports
    expect(stageBox.width).toBeLessThanOrEqual(1024);

    // 2) En lg (≥1024px) el stage adopta 16/9 ±4% en vez del 21/9 estirado
    if (viewportWidth >= 1024) {
      const ratio = stageBox.width / stageBox.height;
      expect(ratio).toBeGreaterThanOrEqual(16 / 9 - 0.04);
      expect(ratio).toBeLessThanOrEqual(16 / 9 + 0.04);
    }

    // 3) Cuando max-w-5xl manda (≥1280px), el stage queda centrado en la página
    if (viewportWidth >= 1280) {
      const docWidth = await page.evaluate(
        () => document.documentElement.clientWidth,
      );
      const leftGap = stageBox.x;
      const rightGap = docWidth - (stageBox.x + stageBox.width);
      expect(Math.abs(leftGap - rightGap)).toBeLessThanOrEqual(4);
    }

    // 4) Footer compacto: ≤672px (max-w-2xl) y centrado dentro del stage
    expect(cardBox.width).toBeLessThanOrEqual(672);
    const cardLeftGap = cardBox.x - stageBox.x;
    const cardRightGap =
      stageBox.x + stageBox.width - (cardBox.x + cardBox.width);
    expect(Math.abs(cardLeftGap - cardRightGap)).toBeLessThanOrEqual(2);

    // 5) Flechas centradas en el eje horizontal del stage (±10px)
    const stageCenterY = stageBox.y + stageBox.height / 2;
    expect(
      Math.abs(prevBox.y + prevBox.height / 2 - stageCenterY),
    ).toBeLessThanOrEqual(10);
    expect(
      Math.abs(nextBox.y + nextBox.height / 2 - stageCenterY),
    ).toBeLessThanOrEqual(10);

    // 6) "Ver demo" vive en el 50% derecho de la card
    expect(demoBox.x + demoBox.width / 2).toBeGreaterThan(
      cardBox.x + cardBox.width / 2,
    );

    // 7) Los puntos de navegación viven dentro de la card
    expect(await card.locator(dots).count()).toBe(projects.length);
  });

  test("el aterrizaje del nav en pantalla corta (1366×640) nunca corta el footer", async ({
    page,
  }, testInfo) => {
    // El viewport es fijo (1366×640): una corrida basta, no 7 idénticas
    test.skip(
      testInfo.project.name !== "desktop-1280",
      "Viewport fijo 1366×640: basta una corrida",
    );
    await page.setViewportSize({ width: 1366, height: 640 });
    await page.goto("/");

    const viewportHeight = 640;
    const stage = page.locator(
      `${section} [aria-roledescription="carrusel"]`,
    );
    const card = stage.locator('[aria-live="polite"]');

    // Clic en el nav desktop: el scroll (View Transitions instantánea o
    // smooth) lleva el ancla bajo la topbar (scroll-padding-top: 5.5rem).
    // Sin el clamp del Ajuste 13 el footer cae fuera del viewport en esta
    // pantalla corta y este poll expira (rojo).
    const topbarNav = page.getByRole("navigation", {
      name: "Navegación principal",
    });
    await topbarNav.getByRole("link", { name: "Proyectos" }).click();

    await expect
      .poll(
        async () => {
          const box = await card.boundingBox();
          return box
            ? Math.round(box.y + box.height)
            : Number.POSITIVE_INFINITY;
        },
        { timeout: 6000 },
      )
      .toBeLessThanOrEqual(viewportHeight - 8);

    // El ancla de aterrizaje queda bajo la barra fija (88px ± tolerancia)
    const anchor = page.locator(`${section} [data-nav-anchor]`);
    await expect
      .poll(async () => Math.round((await anchor.boundingBox())?.y ?? -1), {
        timeout: 6000,
      })
      .toBeLessThanOrEqual(92);

    // Pausa el autoplay para medir un estado estable
    await stage.hover();

    const cardBox = (await card.boundingBox())!;
    expect(cardBox.y + cardBox.height).toBeLessThanOrEqual(viewportHeight - 8);

    // Los dots del footer también quedan visibles (recorte = 0)
    const dotsBox = (await card.locator(dots).first().boundingBox())!;
    expect(dotsBox.y + dotsBox.height).toBeLessThanOrEqual(
      viewportHeight - 8,
    );
  });
});
