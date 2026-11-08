import { test, expect } from "@playwright/test";

/**
 * Tests E2E responsive (Fase 6).
 *
 * Se ejecutan en 7 viewports (320→1920) definidos en
 * playwright.config.ts. Valida: sin scroll horizontal,
 * grilla de habilidades correcta por breakpoint, y
 * navegación funcional.
 */

test.describe("Responsive: sin scroll horizontal", () => {
  test("la página no desborda horizontalmente", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });
});

test.describe("Responsive: grilla de habilidades", () => {
  test("las 3 tarjetas de skills están presentes", async ({ page }) => {
    await page.goto("/");
    // Ajuste 8: las tarjetas usan reveal (display:none hasta que el
    // IntersectionObserver cruza) — traemos la sección al viewport.
    await page.locator("#habilidades").scrollIntoViewIfNeeded();
    await expect(page.getByRole("heading", { level: 3, name: "Frontend" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Backend" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Complementos" })).toBeVisible();
  });

  test("sin tabs de filtro en la sección de skills", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#habilidades [role='tablist']")).toHaveCount(0);
  });

  test("los tiles de skills son enlaces externos con href válido", async ({ page }) => {
    await page.goto("/");
    const links = page.locator("#habilidades a[target='_blank']");
    await expect(links).toHaveCount(16);
    const href = await links.first().getAttribute("href");
    expect(href).toMatch(/^https:\/\//);
  });

  test("sin badges 'En proceso' (tecnologías en standby)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#habilidades [title='En proceso']")).toHaveCount(0);
  });
});

test.describe("Responsive: navegación", () => {
  test("el enlace de navegación principal es visible", async ({ page }) => {
    await page.goto("/");
    // En desktop el nav está en el Topbar; en mobile el botón hamburguesa
    const viewport = page.viewportSize();
    if (viewport && viewport.width >= 768) {
      await expect(page.getByRole("navigation", { name: "Navegación principal" })).toBeVisible();
    } else {
      await expect(page.getByRole("button", { name: /abrir menú/i })).toBeVisible();
    }
  });

  test("los enlaces de nav no tienen numeración", async ({ page }) => {
    await page.goto("/");
    const viewport = page.viewportSize();
    if (viewport && viewport.width >= 768) {
      const nav = page.getByRole("navigation", { name: "Navegación principal" });
      await expect(nav).not.toContainText("01");
      await expect(nav).not.toContainText("02");
      await expect(nav.getByText("Habilidades")).toBeVisible();
    }
  });
});

test.describe("Responsive: encabezados de sección", () => {
  test("el eyebrow 'Arsenal tech' es visible en la sección de skills", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Arsenal tech")).toBeVisible();
  });

  test("el H2 de skills usa el nuevo título", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 2, name: "Herramientas y conocimientos técnicos" }),
    ).toBeVisible();
  });

  test("ningún header usa el patrón numerado 'XX //'", async ({ page }) => {
    await page.goto("/");
    const body = await page.textContent("body");
    expect(body).not.toMatch(/\d{2}\s*\/\//);
  });
});

test.describe("Smoke: funcionamiento básico", () => {
  test("el toggle de tema alterna dark/light", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const initial = await html.getAttribute("class");
    // Ajuste 18: el ThemeToggle es un switch con aria-label dinámico
    // "Cambiar a modo claro/oscuro"
    const toggle = page
      .getByRole("switch", { name: /Cambiar a modo/i })
      .first();
    await toggle.click();
    const after = await html.getAttribute("class");
    expect(after).not.toBe(initial);
  });

  test("la sección de contacto tiene formulario", async ({ page }) => {
    await page.goto("/");
    // Ajuste 8: la card del panel usa reveal (display:none hasta el IO).
    await page.locator("#contacto").scrollIntoViewIfNeeded();
    await expect(page.locator("#contacto form")).toBeVisible();
  });
});

/**
 * Ajuste 17 — geometría de la card de Email en la sección de contacto.
 *
 * Bug: en resoluciones ≥1024 px (y levemente en 320/640) los botones
 * "Copiar correo" y "Abrir en cliente" sobresalían del borde derecho
 * de la card y quedaban tapados por la card de LinkedIn (hermano
 * posterior en la grilla 2×2). Causa raíz: el grupo izquierdo sin
 * `min-w-0` no podía encogerse y el `truncate` del correo nunca
 * actuaba; los botones `shrink-0` escapaban de la card.
 *
 * Se ejecutan en los 7 viewports (320→1920) de playwright.config.ts.
 */
test.describe("Responsive: card de Email sin desborde (Ajuste 17)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // La card vive en la columna 1 (Ajuste 15) y no usa reveal, pero
    // la sección necesita estar en pantalla para medir geometría real.
    await page.locator("#contacto").scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
  });

  test("los botones de copiar y mailto quedan dentro de la card", async ({ page }) => {
    const result = await page.evaluate(() => {
      const card = document.querySelector("[data-testid=contact-card-email]");
      if (!card) return { found: false };
      const cr = card.getBoundingClientRect();
      const botones = [
        ...card.querySelectorAll(
          'button[aria-label="Copiar correo al portapapeles"], a[href^="mailto:"]',
        ),
      ];
      return {
        found: true,
        total: botones.length,
        fuera: botones.filter((b) => {
          const br = b.getBoundingClientRect();
          return br.right > cr.right + 1 || br.left < cr.left - 1;
        }).length,
      };
    });

    expect(result.found).toBe(true);
    expect(result.total).toBe(2);
    expect(result.fuera).toBe(0);
  });

  test("la card no desborda ni se solapa con la card de LinkedIn", async ({ page }) => {
    const result = await page.evaluate(() => {
      const card = document.querySelector("[data-testid=contact-card-email]");
      const linkedin = document.querySelector("[data-testid=contact-card-linkedin]");
      if (!card || !linkedin) return { found: false };
      const cr = card.getBoundingClientRect();
      const lr = linkedin.getBoundingClientRect();

      // Desborde de contenido interno (scrollWidth > clientWidth)
      const innerOverflow = card.scrollWidth - card.clientWidth;

      // ¿El contenido de la card se pinta fuera de su propio borde
      // derecho y encima de la card de LinkedIn?
      const hijos = [...card.children];
      const desbordaDerecha = hijos.some((h) => {
        const hr = h.getBoundingClientRect();
        return hr.right > cr.right + 1;
      });
      const solapaLinkedin =
        cr.right > lr.left + 1 &&
        cr.bottom > lr.top + 1 &&
        cr.top < lr.bottom - 1 &&
        desbordaDerecha;

      return {
        found: true,
        innerOverflow,
        desbordaDerecha,
        solapaLinkedin,
      };
    });

    expect(result.found).toBe(true);
    expect(result.innerOverflow).toBeLessThanOrEqual(1);
    expect(result.desbordaDerecha).toBe(false);
    expect(result.solapaLinkedin).toBe(false);
  });

  test("el texto 'Contacto' y los botones son visibles dentro de la card (sin mostrar el correo)", async ({ page }) => {
    const card = page.locator("[data-testid=contact-card-email]");
    await expect(card).toBeVisible();
    await expect(card).toContainText("Email");
    await expect(card).toContainText("Contacto");
    await expect(card).not.toContainText("alirioangel44@gmail.com");
    await expect(
      card.getByRole("button", { name: "Copiar correo al portapapeles" }),
    ).toBeVisible();
    await expect(
      card.getByRole("link", { name: "Abrir correo en el cliente de email" }),
    ).toBeVisible();
  });

  /**
   * Ajuste 17 (ajuste visual): a 1024–1279 px la celda de la grilla
   * medía ~180 px y el subtítulo "Contacto" se truncaba a "Con…"
   * (53 px de texto frente a 30 px disponibles). La grilla pasa a
   * apilarse en `lg` (`lg:grid-cols-1`) para que las cards tengan el
   * ancho completo de la columna, y el padding vuelve a `px-4`
   * uniforme en las 4 cards.
   *
   * Se ejecuta en los 7 viewports: valida que el texto nunca se
   * recorte y que el icono arrance a la misma distancia del borde
   * en las 4 cards.
   */
  test("el subtítulo 'Contacto' no se trunca y el padding es uniforme en las 4 cards", async ({ page }) => {
    const result = await page.evaluate(() => {
      const ids = [
        "contact-card-whatsapp",
        "contact-card-github",
        "contact-card-email",
        "contact-card-linkedin",
      ];
      const cards = ids.map((id) =>
        document.querySelector(`[data-testid="${id}"]`),
      );
      // Misma forma en ambas ramas: evita uniones que no estrechan TS.
      const vacio = { found: false, truncado: -1, texto: "", iconos: [] };
      if (cards.some((c) => !c)) return vacio;

      const email = cards[2]!;
      const texto = email.querySelector("span.truncate");
      const iconoDe = (card: Element | null) => {
        if (!card) return -1;
        const icono = card.querySelector("span.inline-flex");
        if (!icono) return -1;
        return Math.round(
          icono.getBoundingClientRect().left - card.getBoundingClientRect().left,
        );
      };

      return {
        found: true,
        // px de texto recortados (0 = sin truncar)
        truncado: texto ? texto.scrollWidth - texto.clientWidth : -1,
        texto: texto ? texto.textContent?.trim() ?? "" : "",
        // Distancia del icono al borde izquierdo de cada card
        iconos: cards.map(iconoDe),
      };
    });

    expect(result.found).toBe(true);
    expect(result.texto).toBe("Contacto");
    expect(result.truncado).toBeLessThanOrEqual(1);

    // Padding uniforme: las 4 cards arrancan su icono a la misma distancia
    const primero = result.iconos[0];
    expect(primero).toBeGreaterThan(0);
    for (const x of result.iconos) {
      expect(Math.abs(x - primero)).toBeLessThanOrEqual(1);
    }
  });

  test("las 4 cards de contacto miden la misma altura en el viewport", async ({ page }) => {
    const heights = await page.evaluate(() => {
      const ids = [
        "contact-card-whatsapp",
        "contact-card-github",
        "contact-card-email",
        "contact-card-linkedin",
      ];
      return ids.map((id) => {
        const el = document.querySelector(`[data-testid="${id}"]`);
        return el ? Math.round(el.getBoundingClientRect().height) : -1;
      });
    });

    expect(heights.every((h) => h > 0)).toBe(true);
    const firstHeight = heights[0];
    for (const h of heights) {
      expect(Math.abs(h - firstHeight)).toBeLessThanOrEqual(1);
    }
  });
});
