import { test, expect, type Page } from "@playwright/test";

/**
 * Tests E2E del Motion System (Ajuste 8).
 *
 * Valida en Chromium real:
 * - Reveal scroll-driven: `.reveal` animado con
 *   `animation-timeline: view()` (opacidad 0 fuera del viewport → 1
 *   al entrar) sobre secciones con `content-visibility: auto`.
 * - Tarjetas con `@starting-style`: el grid `reveal-card-grid` arranca
 *   sin `is-visible` y el IntersectionObserver (once) lo añade al
 *   entrar en pantalla → `display: flex` + stagger `--i`.
 * - View Transitions etiquetadas: navegación de secciones con
 *   `types: ["section-nav"]`, ThemeToggle con `types: ["theme"]`,
 *   hash y scroll al ancla actualizados.
 * - `prefers-reduced-motion`: fallbacks (contenido visible sin
 *   animación y navegación sin VT).
 * - 0 errores de consola al recorrer el sistema.
 *
 * Nota: Playwright corre en Chromium con soporte completo de
 * scroll-driven animations, `@starting-style` y tipos de VT — el
 * fallback sin soporte está cubierto por los unit tests de
 * `sectionNav`.
 */

/**
 * Parchea `document.startViewTransition` para registrar los `types`
 * recibidos en cada llamada (sin alterar el comportamiento real).
 *
 * @param page - Página de Playwright (tras el goto).
 */
async function captureViewTransitionTypes(page: Page): Promise<void> {
  await page.evaluate(() => {
    const doc = document as unknown as {
      startViewTransition?: (options: unknown) => unknown;
    };
    const win = window as unknown as { __vtTypesLog?: unknown[][] };
    win.__vtTypesLog = [];
    const original = doc.startViewTransition?.bind(document);
    if (!original) return;
    doc.startViewTransition = (options: unknown) => {
      const types = (options as { types?: string[] } | undefined)?.types;
      win.__vtTypesLog!.push(types ?? []);
      return original(options);
    };
  });
}

/**
 * Parchea `document.startViewTransition` para contar llamadas
 * (usado en el test de prefers-reduced-motion: debe ser 0).
 *
 * @param page - Página de Playwright (tras el goto).
 */
async function countViewTransitionCalls(page: Page): Promise<void> {
  await page.evaluate(() => {
    const doc = document as unknown as {
      startViewTransition?: (options: unknown) => unknown;
    };
    const win = window as unknown as { __vtCalls?: number };
    win.__vtCalls = 0;
    const original = doc.startViewTransition?.bind(document);
    if (!original) return;
    doc.startViewTransition = (options: unknown) => {
      win.__vtCalls = (win.__vtCalls ?? 0) + 1;
      return original(options);
    };
  });
}

/**
 * Navega a una sección por la UI: Topbar en viewports ≥ 768px o
 * menú hamburguesa (dialog) en móviles.
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

test.describe("Motion: reveal scroll-driven (.reveal)", () => {
  test("los headers usan animation-timeline: view() con el keyframe reveal-up", async ({
    page,
  }) => {
    await page.goto("/");
    const reveal = page.locator("#habilidades .reveal");
    await expect(reveal).toHaveCount(1);

    const info = await reveal.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        animationName: style.animationName,
        timeline: style.getPropertyValue("animation-timeline"),
        range: style.getPropertyValue("animation-range"),
        contentVisibility: getComputedStyle(
          el.closest("section") as Element,
        ).contentVisibility,
      };
    });

    expect(info.animationName).toContain("reveal-up");
    expect(info.timeline).toBe("view()");
    expect(info.range).toContain("entry");
    expect(info.range).toContain("cover");
    // La sección conserva content-visibility: auto (interacción con
    // las timelines view() validada en este mismo test).
    expect(info.contentVisibility).toBe("auto");
  });

  test("opacidad 0 fuera del viewport y 1 al alinear la sección", async ({
    page,
  }) => {
    await page.goto("/");
    const reveal = page.locator("#contacto .reveal");

    // Fuera del viewport: fill backwards aplica el estado "from"
    const opacityAtLoad = await reveal.evaluate(
      (el) => getComputedStyle(el).opacity,
    );
    expect(opacityAtLoad).toBe("0");

    // Alinear la sección al tope → la timeline completa el rango
    await page.evaluate(() => {
      const section = document.getElementById("contacto");
      if (!section) return;
      window.scrollTo({
        top: section.getBoundingClientRect().top + window.scrollY,
        behavior: "auto",
      });
    });
    await expect
      .poll(() => reveal.evaluate((el) => getComputedStyle(el).opacity))
      .toBe("1");
  });
});

test.describe("Motion: tarjetas con @starting-style (Ajuste 8)", () => {
  test("About: grid sin is-visible al cargar → is-visible + display:flex tras scroll", async ({
    page,
  }) => {
    await page.goto("/");
    const grid = page.locator("#sobre-mi .reveal-card-grid");

    // Estado inicial: el IO aún no cruzó (sección fuera del viewport)
    await expect(grid).not.toHaveClass(/is-visible/);

    await page.locator("#sobre-mi").scrollIntoViewIfNeeded();
    await expect(grid).toHaveClass(/is-visible/);

    const card = page.locator("#sobre-mi .reveal-card").first();
    await expect(card).toBeVisible();
    expect(await card.evaluate((el) => getComputedStyle(el).display)).toBe(
      "flex",
    );

    // Stagger por --i (segunda card = 1)
    const stagger = await page
      .locator("#sobre-mi .reveal-card")
      .nth(1)
      .evaluate((el) => getComputedStyle(el).getPropertyValue("--i").trim());
    expect(stagger).toBe("1");
  });
});

test.describe("Motion: View Transitions en navegación", () => {
  test("clic en nav → VT con types ['section-nav'] + hash + ancla cerca del tope", async ({
    page,
  }) => {
    await page.goto("/");
    await captureViewTransitionTypes(page);

    await navigateViaUI(page, "Contacto");

    // View Transition etiquetada con el tipo section-nav
    const types = await page.evaluate(
      () => (window as unknown as { __vtTypesLog?: unknown[][] }).__vtTypesLog,
    );
    expect(types).toEqual([["section-nav"]]);

    // Hash compartible + scroll al data-nav-anchor del SectionHeader
    // (scroll-padding-top: 5.5rem → ~88px desde el tope).
    //
    // Contacto es la ÚLTIMA sección: en viewports altos el scroll
    // queda CLAMPADO por el fin del documento (la sección mide
    // 100svh−4rem y el footer no alcanza para poner el ancla a 88px),
    // y como la grilla se centra verticalmente (lg:items-center) el
    // ancla cae cuanto más alto es el viewport. Medido tras el
    // Ajuste 15 (enlaces movidos a col 1 → col 1 = 457px pasa a ser
    // la columna alta y la grilla se acorta): 71.6–87.5px en 6
    // viewports y 206.5px en 1920×1080 (scrollY == maxScroll).
    // Umbral 250 = "cerca del tope" con margen sobre lo medido.
    await expect(page).toHaveURL(/#contacto$/);
    await expect
      .poll(() =>
        page.evaluate(() => {
          const anchor = document.querySelector(
            "#contacto [data-nav-anchor]",
          );
          if (!anchor) return -1;
          return anchor.getBoundingClientRect().top;
        }),
      )
      .toBeLessThan(250);
  });

  test("ThemeToggle etiqueta su VT como 'theme' (wipe re-escopado)", async ({
    page,
  }) => {
    await page.goto("/");
    await captureViewTransitionTypes(page);

    await page
      .getByRole("switch", { name: /Cambiar a modo/i })
      .first()
      .click();

    const types = await page.evaluate(
      () => (window as unknown as { __vtTypesLog?: unknown[][] }).__vtTypesLog,
    );
    expect(types).toEqual([["theme"]]);
  });
});

test.describe("Motion: prefers-reduced-motion (fallbacks)", () => {
  test("reveal y cards visibles sin animación; navegación sin VT", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    // .reveal: la regla solo aplica en no-preference → sin animación
    const opacity = await page
      .locator("#habilidades .reveal")
      .evaluate((el) => getComputedStyle(el).opacity);
    expect(opacity).toBe("1");

    // .reveal-card: regla reduce → display:flex sin necesitar is-visible
    const display = await page
      .locator("#habilidades .reveal-card")
      .first()
      .evaluate((el) => getComputedStyle(el).display);
    expect(display).toBe("flex");

    // Navegación: navigateToSection cae al fallback (cero VT)
    await countViewTransitionCalls(page);
    await navigateViaUI(page, "Contacto");

    const calls = await page.evaluate(
      () => (window as unknown as { __vtCalls?: number }).__vtCalls,
    );
    expect(calls).toBe(0);
    await expect(page).toHaveURL(/#contacto$/);
  });
});

test.describe("Motion: sin errores de consola", () => {
  test("recorrer secciones, revelar contenido y alternar tema sin errores", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(String(error)));

    await page.goto("/", { waitUntil: "networkidle" });

    // Recorrer las secciones con reveal (IO + scroll-driven + CV auto)
    await page.locator("#sobre-mi").scrollIntoViewIfNeeded();
    await page.locator("#habilidades").scrollIntoViewIfNeeded();
    await navigateViaUI(page, "Contacto");

    // Alternar tema (VT tipo theme con wipe circular)
    await page
      .getByRole("switch", { name: /Cambiar a modo/i })
      .first()
      .click();
    await page.waitForTimeout(500);

    expect(errors).toEqual([]);
  });
});

test.describe("Motion: aterrizaje inicial con hash en todos los tabs (Ajuste 17)", () => {
  test("aterrizaje inicial con hash #proyectos posiciona la sección en el centro y preserva el hash", async ({
    page,
  }) => {
    await page.goto("/#proyectos");
    // Esperar a que el hook useInitialHash estabilice el layout y haga scroll
    await page.waitForFunction(
      () => {
        const section = document.getElementById("proyectos");
        if (!section) return false;
        const rect = section.getBoundingClientRect();
        const centerY = window.innerHeight / 2;
        return rect.top <= centerY && rect.bottom >= centerY;
      },
      { timeout: 5000 },
    );

    const result = await page.evaluate(() => {
      const section = document.getElementById("proyectos");
      if (!section) return { found: false, inCenter: false, hash: "" };
      const rect = section.getBoundingClientRect();
      const centerY = window.innerHeight / 2;
      return {
        found: true,
        inCenter: rect.top <= centerY && rect.bottom >= centerY,
        hash: window.location.hash,
      };
    });

    expect(result.found).toBe(true);
    expect(result.hash).toBe("#proyectos");
    expect(result.inCenter).toBe(true);
  });

  test("aterrizaje inicial con hash #contacto posiciona la sección en el centro y preserva el hash", async ({
    page,
  }) => {
    await page.goto("/#contacto");
    // Esperar a que useInitialHash haga scroll y la sección sea visible.
    // ContactSection puede ocupar el 100% del viewport en desktop → se
    // relaja la condición a: el borde superior queda en la mitad superior
    // de la pantalla (rect.top <= centerY × 1.1) Y el borde inferior
    // supera el centro (rect.bottom >= centerY).
    await page.waitForFunction(
      () => {
        const section = document.getElementById("contacto");
        if (!section) return false;
        const rect = section.getBoundingClientRect();
        const centerY = window.innerHeight / 2;
        // La sección cubre el centro del viewport
        return rect.top <= centerY * 1.1 && rect.bottom >= centerY;
      },
      { timeout: 5000 },
    );

    const result = await page.evaluate(() => {
      const section = document.getElementById("contacto");
      if (!section) return { found: false, inCenter: false, hash: "" };
      const rect = section.getBoundingClientRect();
      const centerY = window.innerHeight / 2;
      return {
        found: true,
        inCenter: rect.top <= centerY * 1.1 && rect.bottom >= centerY,
        hash: window.location.hash,
      };
    });

    expect(result.found).toBe(true);
    expect(result.hash).toBe("#contacto");
    expect(result.inCenter).toBe(true);
  });
});

test.describe("Motion: consistencia de espaciado superior en navegación (1er y 2do clic)", () => {
  const tabs = [
    { label: "Sobre Mí", id: "sobre-mi" },
    { label: "Habilidades", id: "habilidades" },
    { label: "Proyectos", id: "proyectos" },
    { label: "Contacto", id: "contacto" },
  ];

  for (const { label, id } of tabs) {
    test(`sección ${label}: aterrizaje idéntico y con respiro adecuado en 1er y 2do clic`, async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForTimeout(300);

      // Primer clic en la pestaña
      await navigateViaUI(page, label);
      await page.waitForTimeout(600);

      const pos1 = await page.evaluate((targetId) => {
        const section = document.getElementById(targetId);
        const header = section?.querySelector("[data-nav-anchor]");
        const topbar = document.querySelector("header.fixed");
        const topbarBottom = topbar?.getBoundingClientRect().bottom ?? 64;
        const headerTop = header?.getBoundingClientRect().top ?? 0;
        const scrollY = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        return {
          scrollY,
          maxScroll,
          isAtMaxScroll: maxScroll > 0 && scrollY >= maxScroll - 2,
          distToTopbar: headerTop - topbarBottom,
        };
      }, id);

      // Segundo clic consecutivo en la misma pestaña
      await navigateViaUI(page, label);
      await page.waitForTimeout(600);

      const pos2 = await page.evaluate((targetId) => {
        const section = document.getElementById(targetId);
        const header = section?.querySelector("[data-nav-anchor]");
        const topbar = document.querySelector("header.fixed");
        const topbarBottom = topbar?.getBoundingClientRect().bottom ?? 64;
        const headerTop = header?.getBoundingClientRect().top ?? 0;
        const scrollY = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        return {
          scrollY,
          maxScroll,
          isAtMaxScroll: maxScroll > 0 && scrollY >= maxScroll - 2,
          distToTopbar: headerTop - topbarBottom,
        };
      }, id);

      // 1. Estabilidad geométrica absoluta: delta entre 1er y 2do clic <= 1.5px
      // (garantiza que el primer clic aterriza igual que el segundo — sin layout shift)
      expect(Math.abs(pos1.scrollY - pos2.scrollY)).toBeLessThanOrEqual(1.5);
      expect(Math.abs(pos1.distToTopbar - pos2.distToTopbar)).toBeLessThanOrEqual(1.5);

      // 2. Respiro superior adecuado: el eyebrow nunca debe quedar pegado (< 15px) a la barra fija.
      // Excepción documentada: en viewports muy pequeños (ej. 320×568) la ÚLTIMA sección puede
      // quedar al tope del scroll del documento y el browser clampea la posición — el eyebrow
      // aterriza más arriba, pero AMBOS clics son iguales (garantizado por la condición 1 arriba).
      if (!pos1.isAtMaxScroll) {
        expect(pos1.distToTopbar).toBeGreaterThan(15);
      }
    });
  }
});
