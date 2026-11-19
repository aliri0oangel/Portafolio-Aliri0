import { test, expect, type Page } from "@playwright/test";

/**
 * Viewport Fit (Fase 1 — TDD).
 *
 * Referencia de diseño: herasi.dev — cada sección usa `min-h-screen`
 * + escala `py-20 sm:py-24 lg:py-28` + centrado vertical para cubrir
 * por completo la pantalla visible. Aquí el equivalente es
 * `min-h-[100svh]` (svh evita los saltos de la barra URL móvil;
 * el topbar fija de 64px flota sobre el contenido) + bumps sm/lg
 * (`+0.5rem`/`+1.5rem` = el respiro py que excede 88px de
 * scroll-padding). Sin centrado vertical: el aterrizaje por ancla
 * exige top-align (ver sectionClassNames.ts).
 *
 * Objetivo: ninguna sección deja ver la siguiente. Se valida en los
 * 8 viewports de playwright.config.ts (320→2560):
 *
 * 1. ALTURA — cada <section> mide ≥ alto del viewport (tol ±2px).
 * 2. SIN ASOMO — con la sección alineada al tope del viewport
 *    (scroll absoluto, sin scroll-padding), la sección siguiente
 *    empieza ≥ borde inferior del viewport.
 * 3. ATERRIZAJE NAV — tras navegar por cada enlace (topbar ≥768,
 *    menú hamburguesa <768), la sección destino llena el viewport
 *    y la siguiente no asoma.
 * 4. STRETCH (Fase 2) — en viewports altos el contenido se estira
 *    a la altura disponible: el borde inferior de la grilla queda
 *    pegado al borde inferior del contenido de la sección (sin
 *    hueco muerto bajo las tarjetas).
 *
 * Nota: algunas secciones usan `content-visibility: auto`
 * (About/Skills/Contacto; Proyectos no — su contenido real supera
 * el min-h y el reveal causaría layout shift). Tras cada
 * desplazamiento se hace poll para medir el layout ya renderizado.
 */

/** Ids de las 5 secciones del SPA, en orden de aparición. */
const SECTION_IDS = [
  "inicio",
  "sobre-mi",
  "habilidades",
  "proyectos",
  "contacto",
] as const;

/** Labels de nav para cada sección (src/data/site.ts → navLinks). */
const SECTION_LABELS: Record<(typeof SECTION_IDS)[number], string> = {
  inicio: "Inicio",
  "sobre-mi": "Sobre Mí",
  habilidades: "Habilidades",
  proyectos: "Proyectos",
  contacto: "Contacto",
};

/** Tolerancia de píxeles para comparaciones de borde (redondeo subpíxel). */
const TOL = 2;

/**
 * Navega a una sección por la UI: Topbar en viewports ≥ 768px o
 * menú hamburguesa (dialog) en móviles. Mismo helper que
 * `motion.spec.ts` (contrato de navegación real, no hash directo).
 *
 * @param page - Página de Playwright.
 * @param label - Texto visible del enlace ("Contacto", "Proyectos"...).
 */
async function navigateViaUI(page: Page, label: string): Promise<void> {
  const viewport = page.viewportSize();
  if (viewport && viewport.width >= 768) {
    await page
      .getByRole("navigation", { name: "Navegación principal" })
      .getByRole("link", { name: label })
      .click();
  } else {
    await page.getByRole("button", { name: /abrir menú/i }).click();
    await page
      .getByRole("dialog", { name: "Navegación principal" })
      .getByRole("link", { name: label })
      .click();
  }
}

test.describe("Viewport Fit: cada sección llena la pantalla visible", () => {
  test("las 5 secciones miden ≥ alto del viewport", async ({ page }) => {
    await page.goto("/");
    const viewport = page.viewportSize()!;

    for (const id of SECTION_IDS) {
      const section = page.locator(`#${id}`);
      // Traemos la sección al viewport para que content-visibility la
      // renderice y su medida sea real (no la estimada de
      // contain-intrinsic-size).
      await section.scrollIntoViewIfNeeded();
      await expect
        .poll(async () => (await section.boundingBox())?.height ?? 0, {
          timeout: 3000,
        })
        .toBeGreaterThanOrEqual(viewport.height - TOL);
    }
  });

  test("con cada sección alineada al tope, la siguiente no asoma", async ({
    page,
  }) => {
    await page.goto("/");
    const viewport = page.viewportSize()!;

    for (let i = 0; i < SECTION_IDS.length - 1; i++) {
      const currentId = SECTION_IDS[i];
      const nextId = SECTION_IDS[i + 1];

      // Scroll absoluto al borde superior de la sección (scroll-padding
      // NO aplica a window.scrollTo → alineación natural "tope en 0",
      // el estado que ve el usuario al desplazarse a mano).
      await page.evaluate((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        window.scrollTo({
          top: el.getBoundingClientRect().top + window.scrollY,
          behavior: "auto",
        });
      }, currentId);
      await page.waitForTimeout(150);

      await expect
        .poll(async () => (await page.locator(`#${nextId}`).boundingBox())?.y ?? -1, {
          timeout: 3000,
        })
        .toBeGreaterThanOrEqual(viewport.height - TOL);
    }
  });

  test("al navegar por la nav, la sección destino llena la vista sin asomo", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForTimeout(300);
    const viewport = page.viewportSize()!;

    // Fuentes: las 4 secciones con siguiente (contacto no tiene
    // siguiente en el documento antes del footer).
    for (let i = 0; i < SECTION_IDS.length - 1; i++) {
      const currentId = SECTION_IDS[i];
      const nextId = SECTION_IDS[i + 1];

      await navigateViaUI(page, SECTION_LABELS[currentId]);
      await page.waitForTimeout(700); // VT ~300ms + reveal + settle

      // La sección destino llena el viewport...
      await expect
        .poll(async () => (await page.locator(`#${currentId}`).boundingBox())?.height ?? 0, {
          timeout: 3000,
        })
        .toBeGreaterThanOrEqual(viewport.height - TOL);

      // ...y la siguiente no asoma por debajo del borde inferior.
      await expect
        .poll(async () => (await page.locator(`#${nextId}`).boundingBox())?.y ?? -1, {
          timeout: 3000,
        })
        .toBeGreaterThanOrEqual(viewport.height - TOL);
    }
  });

  // Fase 2 (TDD): stretch-fill — en viewports altos el contenido se
  // estira a la altura disponible (flex + auto-rows-fr + h-full) y no
  // queda hueco muerto bajo las tarjetas. Se valida en desktop-1920
  // y desktop-2560 (los viewports donde el min-h supera al contenido
  // natural y el equilibrio vertical importa).
  test("stretch: el contenido llena la sección sin hueco inferior (viewports altos)", async ({
    page,
  }) => {
    const viewport = page.viewportSize()!;
    test.skip(
      viewport.height < 1000,
      "el equilibrio vertical solo aplica a viewports altos (≥1000px)",
    );

    await page.goto("/");
    await page.waitForTimeout(300);

    // Secciones con grilla que usa auto-rows-fr (About/Skills).
    for (const id of ["sobre-mi", "habilidades"] as const) {
      await page.evaluate((sectionId) => {
        const el = document.getElementById(sectionId);
        if (!el) return;
        window.scrollTo({
          top: el.getBoundingClientRect().top + window.scrollY,
          behavior: "auto",
        });
      }, id);
      await page.waitForTimeout(200);

      // El borde inferior del contenido (grilla) debe quedar pegado
      // al borde inferior del área de contenido de la sección (resta
      // el padding py). Tol = 4px (redondeo subpíxel + borders).
      await expect
        .poll(
          async () => {
            return page.evaluate((sectionId) => {
              const section = document.getElementById(sectionId);
              if (!section) return 9999;
              const style = getComputedStyle(section);
              const padBottom = parseFloat(style.paddingBottom) || 0;
              const sectionContentBottom =
                section.getBoundingClientRect().bottom - padBottom;
              const grid = section.querySelector(".grid");
              if (!grid) return 9999;
              const gridBottom = grid.getBoundingClientRect().bottom;
              return sectionContentBottom - gridBottom;
            }, id);
          },
          { timeout: 3000 },
        )
        .toBeLessThanOrEqual(4);
    }
  });
});
