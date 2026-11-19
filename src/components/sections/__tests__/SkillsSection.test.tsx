import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { render, screen, within } from "@testing-library/react";
import { SkillsSection } from "../SkillsSection";
import { triggerReveal } from "@/__tests__/revealTrigger";

/**
 * Tests de SkillsSection (Ajuste 7 — standby: 16 skills activas;
 * las 5 en aprendizaje quedan comentadas en src/data/skills.ts con
 * nota `// STANDBY` → 0 badges "En proceso"; el badge se reactiva
 * solo al descomentar).
 *
 * Valida: 3 tarjetas de grupo, ausencia de tabs, contenido exacto
 * (Frontend 8 / Backend 4 / Complementos 4), tiles como enlaces
 * externos con cursor-pointer, animación gris→color y dark:invert
 * en los 3 iconos oscuros activos (nextjs, github, vercel).
 */
describe("SkillsSection", () => {
  it("renderiza la sección con id y clase de content-visibility", () => {
    const { container } = render(<SkillsSection />);
    const section = container.querySelector("section");
    expect(section).toHaveAttribute("id", "habilidades");
    expect(section?.className).toContain("section-contain");
  });

  // Fase 1 (TDD): la sección llena la pantalla visible (patrón
  // herasi.dev) — min-h-[100svh] + bump por breakpoint (sin centrado:
  // el aterrizaje por ancla exige top-align; ver sectionClassNames.ts).
  it("llena el viewport: min-h-[100svh] + bumps sm/lg + py de referencia", () => {
    const { container } = render(<SkillsSection />);
    const section = container.querySelector("section")!;
    expect(section).toHaveClass("min-h-[100svh]");
    expect(section).toHaveClass("sm:min-h-[calc(100svh+0.5rem)]");
    expect(section).toHaveClass("lg:min-h-[calc(100svh+1.5rem)]");
    expect(section.className).toContain("py-20 sm:py-24 lg:py-28");
  });

  // Fase 2 (TDD): stretch-fill — flex + auto-rows-fr + h-full para
  // equilibrio vertical en viewports altos, sin justify-center.
  it("estira el contenido: flex en sección/contenedor, auto-rows-fr en grilla y h-full en tarjetas", () => {
    const { container } = render(<SkillsSection />);
    const section = container.querySelector("section")!;
    expect(section).toHaveClass("flex");
    expect(section).toHaveClass("flex-col");
    expect(section).not.toHaveClass("justify-center");

    const inner = section.querySelector(":scope > div")!;
    expect(inner).toHaveClass("flex-1");
    expect(inner).toHaveClass("flex-col");

    const grid = inner.querySelector(".grid")!;
    expect(grid).toHaveClass("auto-rows-fr");
    expect(grid).toHaveClass("flex-1");

    const wrappers = grid.querySelectorAll(":scope > div");
    expect(wrappers.length).toBe(3);
    wrappers.forEach((w) => expect(w).toHaveClass("h-full"));
  });

  it("renderiza exactamente 3 tarjetas de grupo", () => {
    render(<SkillsSection />);
    expect(screen.getByRole("heading", { level: 3, name: "Frontend" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Backend" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Complementos" })).toBeInTheDocument();
  });

  it("no renderiza barra de tabs (role=tablist ausente)", () => {
    render(<SkillsSection />);
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("el grupo Frontend muestra sus 8 tecnologías", () => {
    render(<SkillsSection />);
    const card = screen.getByRole("heading", { level: 3, name: "Frontend" }).closest("div");
    expect(card).toBeTruthy();
    for (const name of ["HTML5", "CSS3", "JavaScript", "React", "Next.js", "Tailwind CSS", "TypeScript", "Vite"]) {
      expect(within(card as HTMLElement).getByText(name)).toBeInTheDocument();
    }
    // Qwik.js está en standby (comentado): no aparece
    expect(within(card as HTMLElement).queryByText("Qwik.js")).not.toBeInTheDocument();
  });

  it("el grupo Backend muestra sus 4 tecnologías", () => {
    render(<SkillsSection />);
    const card = screen.getByRole("heading", { level: 3, name: "Backend" }).closest("div");
    for (const name of ["TypeScript", "WordPress", "JavaScript", "MongoDB"]) {
      expect(within(card as HTMLElement).getByText(name)).toBeInTheDocument();
    }
    // Standby: PostgreSQL, Prisma ORM y GraphQL no aparecen
    for (const standby of ["PostgreSQL", "Prisma ORM", "GraphQL"]) {
      expect(within(card as HTMLElement).queryByText(standby)).not.toBeInTheDocument();
    }
  });

  it("el grupo Complementos muestra sus 4 tecnologías", () => {
    render(<SkillsSection />);
    const card = screen.getByRole("heading", { level: 3, name: "Complementos" }).closest("div");
    for (const name of ["Git", "GitHub", "Visual Studio Code", "Vercel"]) {
      expect(within(card as HTMLElement).getByText(name)).toBeInTheDocument();
    }
    // Jira está en standby (comentado): no aparece
    expect(within(card as HTMLElement).queryByText("Jira")).not.toBeInTheDocument();
  });

  it("renderiza 16 iconos con alt vacío, lazy y dimensiones explícitas", () => {
    const { container } = render(<SkillsSection />);
    const images = container.querySelectorAll("#habilidades img");
    expect(images.length).toBe(16);
    for (const img of images) {
      expect(img.getAttribute("alt")).toBe("");
      expect(img.getAttribute("loading")).toBe("lazy");
      expect(img.getAttribute("width")).toBeTruthy();
      expect(img.getAttribute("height")).toBeTruthy();
    }
  });

  it("aplica dark:invert a los 3 iconos oscuros activos (nextjs, github, vercel)", () => {
    const { container } = render(<SkillsSection />);
    const invertImgs = container.querySelectorAll("img.dark\\:invert");
    expect(invertImgs.length).toBe(3);
  });

  it("NO muestra badges 'En proceso' (tecnologías en standby)", () => {
    render(<SkillsSection />);
    expect(screen.queryAllByText("En proceso")).toHaveLength(0);
  });

  it("ningún tile lleva el title 'En proceso'", () => {
    const { container } = render(<SkillsSection />);
    const tilesWithBadge = container.querySelectorAll("[title='En proceso']");
    expect(tilesWithBadge.length).toBe(0);
  });

  it("los tiles son enlaces externos https con rel seguro", () => {
    const { container } = render(<SkillsSection />);
    const links = container.querySelectorAll("#habilidades a");
    expect(links.length).toBe(16);
    for (const link of links) {
      expect(link.getAttribute("href")).toMatch(/^https:\/\//);
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    }
  });

  it("los tiles aplican cursor-pointer (sensación de selección)", () => {
    const { container } = render(<SkillsSection />);
    const links = container.querySelectorAll("#habilidades a.cursor-pointer");
    expect(links.length).toBe(16);
  });

  it("los iconos arrancan en gris y se colorean al hover (regresión de animación)", () => {
    const { container } = render(<SkillsSection />);
    const images = container.querySelectorAll("#habilidades img");
    for (const img of images) {
      const cls = img.className;
      expect(cls).toContain("grayscale");
      expect(cls).toContain("opacity-60");
      expect(cls).toContain("group-hover/icon:grayscale-0");
      expect(cls).toContain("group-hover/icon:opacity-100");
      expect(cls).toContain("duration-300");
    }
  });

  it("el icono del título de cada card NO tiene ninguna animación", () => {
    render(<SkillsSection />);
    const titles = ["Frontend", "Backend", "Complementos"];
    for (const title of titles) {
      const h3 = screen.getByRole("heading", { level: 3, name: title });
      const icon = h3.querySelector("svg");
      expect(icon).toBeTruthy();
      const cls = icon?.className.baseVal ?? String(icon?.className ?? "");
      expect(cls).not.toMatch(/rotate|transition|animate|group-hover|translate|scale/);
    }
  });

  it("los 16 iconos de skill dan un salto único al hover de su tile (icon-hop)", () => {
    const { container } = render(<SkillsSection />);
    const hopping = container.querySelectorAll(
      '#habilidades img[class*="animate-[icon-hop"]',
    );
    expect(hopping.length).toBe(16);
    for (const img of hopping) {
      const cls = img.className;
      // One-shot (sin _infinite): salto al entrar y reposo al terminar.
      expect(cls).toContain("group-hover/icon:animate-[icon-hop_0.4s_ease-in-out]");
      expect(cls).toContain("motion-reduce:group-hover/icon:animate-none");
    }
  });

  it("el salto usa el keyframe icon-hop declarado en globals.css (translate)", () => {
    const globals = readFileSync(
      path.resolve(__dirname, "../../../app/globals.css"),
      "utf8",
    );
    expect(globals).toMatch(/@keyframes\s+icon-hop/);
    expect(globals).toMatch(/translate\(/);
  });

  it("las 3 cards montan la estela de borde (conic-gradient rotatorio)", () => {
    const { container } = render(<SkillsSection />);
    const beams = container.querySelectorAll(
      '#habilidades [aria-hidden][style*="conic-gradient"]',
    );
    expect(beams.length).toBe(3);
    for (const beam of beams) {
      const cls = beam.className;
      // Loop 4s linear del keyframe + opacidad solo-en-hover
      expect(cls).toContain("animate-[border-spin_4s_linear_infinite]");
      expect(cls).toContain("opacity-0");
      expect(cls).toContain("group-hover:opacity-100");
      // Respeto de prefers-reduced-motion (sin loop infinito)
      expect(cls).toContain("motion-reduce:animate-none");
      // Grosor del borde = padding del wrapper; recorte + stacking
      const wrapper = beam.parentElement;
      expect(wrapper?.className).toContain("p-[2px]");
      expect(wrapper?.className).toContain("overflow-hidden");
      expect(wrapper?.className).toContain("isolate");
    }
  });

  it("la estela gira con el keyframe border-spin declarado en globals.css", () => {
    // Contrato del keyframe (declarado en globals.css): 360° en 4s.
    // Se valida por presencia de la utilidad arbitraria en las cards
    // (test anterior) y aquí se asegura que existe la regla en CSS.
    const globals = readFileSync(
      path.resolve(__dirname, "../../../app/globals.css"),
      "utf8",
    );
    expect(globals).toMatch(/@keyframes\s+border-spin/);
    expect(globals).toMatch(/rotate\(360deg\)/);
  });

  it("el contenido de la card vive en un panel opaco interior (padding-trick)", () => {
    const { container } = render(<SkillsSection />);
    const beams = container.querySelectorAll(
      '#habilidades [aria-hidden][style*="conic-gradient"]',
    );
    for (const beam of beams) {
      const panel = beam.nextElementSibling;
      expect(panel).toBeTruthy();
      expect(panel?.className).toContain("bg-surface-1");
      expect(panel?.className).toContain("rounded-[22px]");
    }
  });

  it("las 16 cajas de tile escalan al hover de la card (group-hover:scale-105)", () => {
    const { container } = render(<SkillsSection />);
    const boxes = container.querySelectorAll(
      "#habilidades a .group-hover\\:scale-105",
    );
    expect(boxes.length).toBe(16);
    for (const box of boxes) {
      expect(box.className).toContain("group-hover:scale-105");
      expect(box.className).toContain("motion-reduce:group-hover:scale-100");
    }
  });
});

/**
 * Motion System (Ajuste 8): el encabezado se revela con
 * scroll-driven animations (clase `.reveal`) y las 3 tarjetas usan
 * `@starting-style` — la grilla `reveal-card-grid` arranca SIN
 * `is-visible` y `useRevealOnScroll` (IntersectionObserver, once)
 * lo añade al entrar en pantalla. framer-motion (`whileInView`) se
 * eliminó de esta sección.
 */
describe("SkillsSection — Motion System (Ajuste 8)", () => {
  it("el encabezado de la sección usa la clase reveal", () => {
    const { container } = render(<SkillsSection />);
    const header = container.querySelector("#habilidades .reveal");
    expect(header).not.toBeNull();
    expect(header).toContainElement(screen.getByRole("heading", { level: 2 }));
  });

  it("la grilla es reveal-card-grid y sus 3 tarjetas son reveal-card con stagger --i", () => {
    const { container } = render(<SkillsSection />);
    const grid = container.querySelector("#habilidades .reveal-card-grid");
    expect(grid).not.toBeNull();
    expect(grid).toHaveClass("grid");

    const cards = grid!.querySelectorAll(".reveal-card");
    expect(cards).toHaveLength(3);
    cards.forEach((card, index) => {
      expect((card as HTMLElement).style.getPropertyValue("--i")).toBe(
        String(index),
      );
    });
  });

  it("las tarjetas arrancan ocultas y se revelan al entrar en pantalla", () => {
    const { container } = render(<SkillsSection />);
    const grid = container.querySelector("#habilidades .reveal-card-grid")!;

    // Estado inicial: sin is-visible (CSS .reveal-card → display:none)
    expect(grid.classList.contains("is-visible")).toBe(false);

    // El IntersectionObserver del hook cruza → reveal
    expect(triggerReveal(grid)).toBe(true);
    expect(grid.classList.contains("is-visible")).toBe(true);
  });
});

/**
 * Escalado de resoluciones grandes (xl ≥1280 / 2xl ≥1536): panel de la
 * card, H3 de grupo, cajas de icono, glow y tiles (caja + label) escalan
 * con variantes xl:/2xl: sin tocar las clases base.
 */
describe("SkillsSection — Escala en resoluciones grandes (xl/2xl)", () => {
  it("el panel interior de cada card escala 2xl:p-10 sobre base p-8", () => {
    const { container } = render(<SkillsSection />);
    const beams = container.querySelectorAll(
      '#habilidades [aria-hidden][style*="conic-gradient"]',
    );
    expect(beams.length).toBe(3);
    for (const beam of beams) {
      const panel = beam.nextElementSibling!;
      expect(panel.className).toContain("p-8");
      expect(panel.className).toContain("2xl:p-10");
    }
  });

  it("los H3 de grupo escalan 2xl:text-3xl sobre base text-2xl", () => {
    render(<SkillsSection />);
    for (const name of ["Frontend", "Backend", "Complementos"]) {
      const h3 = screen.getByRole("heading", { level: 3, name });
      expect(h3.className).toContain("text-2xl");
      expect(h3.className).toContain("2xl:text-3xl");
    }
  });

  it("la caja del icono de cabecera escala 2xl:h-16 2xl:w-16 y el icono 2xl:h-7", () => {
    render(<SkillsSection />);
    const h3 = screen.getByRole("heading", { level: 3, name: "Frontend" });
    const caja = h3.querySelector("span")!;
    expect(caja.className).toContain("xl:h-14 xl:w-14");
    expect(caja.className).toContain("2xl:h-16 2xl:w-16");

    const icono = caja.querySelector("svg")!;
    expect(icono.getAttribute("class")).toContain("h-6 w-6");
    expect(icono.getAttribute("class")).toContain("2xl:h-7");
  });

  it("la grilla interna de tiles escala 2xl:gap-6 (base gap-4 xl:gap-5 intacta)", () => {
    const { container } = render(<SkillsSection />);
    const grid = container.querySelector("#habilidades .grid.grid-cols-3")!;
    expect(grid.className).toContain("gap-4");
    expect(grid.className).toContain("xl:gap-5");
    expect(grid.className).toContain("2xl:gap-6");
  });

  it("el glow decorativo de la card escala 2xl:h-56 2xl:w-56 sobre base h-48 w-48", () => {
    const { container } = render(<SkillsSection />);
    const glows = container.querySelectorAll(
      '#habilidades [aria-hidden][class*="blur-[60px]"]',
    );
    expect(glows.length).toBe(3);
    for (const glow of glows) {
      expect(glow.className).toContain("h-48 w-48");
      expect(glow.className).toContain("2xl:h-56 2xl:w-56");
    }
  });

  it("las cajas de tile escalan 2xl:h-20 2xl:w-20 con padding 2xl:p-4", () => {
    const { container } = render(<SkillsSection />);
    const boxes = container.querySelectorAll(
      "#habilidades a .group-hover\\:scale-105",
    );
    expect(boxes.length).toBe(16);
    for (const box of boxes) {
      expect(box.className).toContain("xl:h-16 xl:w-16");
      expect(box.className).toContain("2xl:h-20 2xl:w-20");
      expect(box.className).toContain("2xl:p-4");
    }
  });

  it("las etiquetas de tile escalan xl:text-[11px] / 2xl:text-xs sobre base text-[10px]", () => {
    const { container } = render(<SkillsSection />);
    const labels = container.querySelectorAll("#habilidades a > span");
    expect(labels.length).toBe(16);
    for (const label of labels) {
      expect(label.className).toContain("text-[10px]");
      expect(label.className).toContain("xl:text-[11px]");
      expect(label.className).toContain("2xl:text-xs");
    }
  });
});
