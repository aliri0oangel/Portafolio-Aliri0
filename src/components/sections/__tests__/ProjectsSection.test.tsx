import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectsSection } from "../ProjectsSection";
import { projects } from "@/data/projects";

/**
 * Arrays `images` recibidos por WebGLMorphCanvas en cada render.
 * Se capturan vía mock para asegurar que la referencia es estable y
 * no re-ejecuta el useEffect([images]) del canvas WebGL innecesariamente.
 */
const { capturedImages } = vi.hoisted(() => ({
  capturedImages: [] as string[][],
}));

vi.mock("@/components/ui/WebGLMorphCanvas", () => ({
  WebGLMorphCanvas: (props: { images: string[] }) => {
    capturedImages.push(props.images);
    return <div data-testid="webgl-morph-stub" />;
  },
}));

describe("ProjectsSection — Alternativa 1: Cinematic Bento Stage (Loop Infinito)", () => {
  beforeEach(() => {
    capturedImages.length = 0;
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renderiza la sección anclada con id #proyectos y cabecera", () => {
    const { container } = render(<ProjectsSection />);
    const section = container.querySelector("section");
    expect(section).toHaveAttribute("id", "proyectos");
    expect(screen.getByText("Casos de estudio seleccionados.")).toBeInTheDocument();
    expect(screen.getByText("Proyectos")).toBeInTheDocument();
  });

  it("renderiza el escenario cinemático con el primer proyecto seleccionado por defecto", () => {
    render(<ProjectsSection />);
    const first = projects[0];

    // Título activo en el HUD
    expect(
      screen.getByRole("heading", { level: 3, name: first.title }),
    ).toBeInTheDocument();

    // Contador de proyectos
    expect(
      screen.getByText(new RegExp(`PROYECTO 01 / 0${projects.length}`)),
    ).toBeInTheDocument();

    // Link Ver Demo
    const demoLink = screen.getByRole("link", { name: /ver demo/i });
    expect(demoLink).toHaveAttribute("href", first.liveUrl);
    expect(demoLink).toHaveAttribute("target", "_blank");
    expect(demoLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renderiza todos los badges de tecnología del proyecto activo", () => {
    render(<ProjectsSection />);
    const first = projects[0];
    for (const tech of first.technologies) {
      expect(screen.getAllByText(tech).length).toBeGreaterThan(0);
    }
  });

  it("renderiza los puntos indicadores del carrusel con un botón por cada proyecto", () => {
    render(<ProjectsSection />);
    projects.forEach((project, index) => {
      const dot = screen.getByRole("button", {
        name: `Ir al proyecto ${index + 1}: ${project.title}`,
      });
      expect(dot).toBeInTheDocument();
      if (index === 0) {
        expect(dot).toHaveAttribute("aria-current", "true");
      } else {
        expect(dot).not.toHaveAttribute("aria-current");
      }
    });
  });

  it("avanza cíclicamente al pulsar 'Proyecto siguiente' y actualiza el HUD y el punto activo", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    render(<ProjectsSection />);

    const nextBtn = screen.getByRole("button", { name: "Proyecto siguiente" });
    await user.click(nextBtn);

    const second = projects[1];
    expect(
      screen.getByRole("heading", { level: 3, name: second.title }),
    ).toBeInTheDocument();

    const dotSecond = screen.getByRole("button", {
      name: `Ir al proyecto 2: ${second.title}`,
    });
    expect(dotSecond).toHaveAttribute("aria-current", "true");
  });

  it("retrocede cíclicamente al pulsar 'Proyecto anterior' envolviendo al último (loop infinito)", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    render(<ProjectsSection />);

    const prevBtn = screen.getByRole("button", { name: "Proyecto anterior" });
    await user.click(prevBtn);

    const last = projects[projects.length - 1];
    expect(
      screen.getByRole("heading", { level: 3, name: last.title }),
    ).toBeInTheDocument();

    const dotLast = screen.getByRole("button", {
      name: `Ir al proyecto ${projects.length}: ${last.title}`,
    });
    expect(dotLast).toHaveAttribute("aria-current", "true");
  });

  it("salta directamente al proyecto al hacer clic en su punto indicador", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    render(<ProjectsSection />);

    const targetProject = projects[2];
    const targetDot = screen.getByRole("button", {
      name: `Ir al proyecto 3: ${targetProject.title}`,
    });

    await user.click(targetDot);

    expect(
      screen.getByRole("heading", { level: 3, name: targetProject.title }),
    ).toBeInTheDocument();
    expect(targetDot).toHaveAttribute("aria-current", "true");
  });

  it("soporta navegación con teclado usando las flechas izquierda y derecha", () => {
    render(<ProjectsSection />);
    const stage = screen.getByRole("region", { name: "Escenario de proyectos" });

    // Presionar ArrowRight
    act(() => {
      stage.focus();
      stage.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    });

    const second = projects[1];
    expect(
      screen.getByRole("heading", { level: 3, name: second.title }),
    ).toBeInTheDocument();

    // Presionar ArrowLeft
    act(() => {
      stage.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    });

    const first = projects[0];
    expect(
      screen.getByRole("heading", { level: 3, name: first.title }),
    ).toBeInTheDocument();
  });

  it("avanza automáticamente cada 4 segundos por autoplay si no está pausado", () => {
    render(<ProjectsSection />);

    expect(
      screen.getByRole("heading", { level: 3, name: projects[0].title }),
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(
      screen.getByRole("heading", { level: 3, name: projects[1].title }),
    ).toBeInTheDocument();
  });

  it("no avanza automáticamente cuando prefers-reduced-motion está activo", () => {
    const matchMediaSpy = vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({
          matches: query.includes("prefers-reduced-motion"),
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as unknown as MediaQueryList,
    );

    try {
      render(<ProjectsSection />);

      act(() => {
        vi.advanceTimersByTime(8000);
      });

      // Se mantiene en el primer proyecto
      expect(
        screen.getByRole("heading", { level: 3, name: projects[0].title }),
      ).toBeInTheDocument();
    } finally {
      matchMediaSpy.mockRestore();
    }
  });

  it("un proyecto sin liveUrl no muestra el botón de ver demo", async () => {
    vi.useRealTimers();
    vi.resetModules();
    vi.doMock("@/data/projects", () => ({
      projects: [
        {
          id: "sin-demo",
          title: "Proyecto sin demo",
          featuredImage: "/projects/sin-demo.webp",
          technologies: ["HTML"],
        },
      ],
    }));

    const { ProjectsSection: NoDemoSection } = await import("../ProjectsSection");
    render(<NoDemoSection />);

    expect(
      screen.getByRole("heading", { level: 3, name: "Proyecto sin demo" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /ver demo/i })).not.toBeInTheDocument();

    vi.doUnmock("@/data/projects");
    vi.resetModules();
  });

  it("muestra el mensaje defensivo cuando el catálogo está vacío", async () => {
    vi.useRealTimers();
    vi.resetModules();
    vi.doMock("@/data/projects", () => ({ projects: [] }));

    const { ProjectsSection: EmptySection } = await import("../ProjectsSection");
    render(<EmptySection />);

    expect(
      screen.getByText(/no hay proyectos publicados todavía/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Proyecto siguiente" })).not.toBeInTheDocument();

    vi.doUnmock("@/data/projects");
    vi.resetModules();
  });

  it("renderiza una tecnología desconocida sin iconos sin fallar", async () => {
    vi.useRealTimers();
    vi.resetModules();
    vi.doMock("@/data/projects", () => ({
      projects: [
        {
          id: "tech-desconocida",
          title: "Proyecto con tech desconocida",
          featuredImage: "/projects/x.webp",
          technologies: ["TechExtraña"],
          liveUrl: "https://example.com",
        },
      ],
    }));

    const { ProjectsSection: UnknownTechSection } = await import("../ProjectsSection");
    render(<UnknownTechSection />);

    expect(screen.getAllByText("TechExtraña").length).toBeGreaterThan(0);

    vi.doUnmock("@/data/projects");
    vi.resetModules();
  });

  it("mantiene estable la referencia de `images` enviada al canvas WebGL entre renders", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    render(<ProjectsSection />);

    expect(capturedImages.length).toBeGreaterThan(0);
    const initial = capturedImages[capturedImages.length - 1];

    // Re-render 1: hover sobre el stage pausa el autoplay (onMouseEnter)
    const beforeHover = capturedImages.length;
    await user.hover(screen.getByRole("region", { name: "Escenario de proyectos" }));
    expect(capturedImages.length).toBeGreaterThan(beforeHover);
    expect(capturedImages[capturedImages.length - 1]).toBe(initial);

    // Re-render 2: avance manual con la flecha siguiente
    const beforeClick = capturedImages.length;
    await user.click(screen.getByRole("button", { name: "Proyecto siguiente" }));
    expect(capturedImages.length).toBeGreaterThan(beforeClick);
    expect(capturedImages[capturedImages.length - 1]).toBe(initial);

    for (const images of capturedImages) {
      expect(images).toBe(initial);
    }
  });

  it("la tarjeta del HUD inferior anuncia el proyecto activo con aria-live='polite'", () => {
    render(<ProjectsSection />);

    const title = screen.getByRole("heading", {
      level: 3,
      name: projects[0].title,
    });
    const liveRegion = title.closest("[aria-live]");

    expect(liveRegion).not.toBeNull();
    expect(liveRegion).toHaveAttribute("aria-live", "polite");
  });

  // ── Ajuste 12: Footer card de Proyectos ──────────────────────────────

  it("coloca los puntos de navegación dentro de la footer card (aria-live)", () => {
    render(<ProjectsSection />);

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();

    const dotsInCard = liveRegion!.querySelectorAll(
      '[aria-label^="Ir al proyecto"]',
    );
    expect(dotsInCard.length).toBe(projects.length);
  });

  it("ubica 'Ver demo' en la esquina superior derecha de la card (fila justify-between)", () => {
    render(<ProjectsSection />);

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();

    // El enlace vive dentro de la footer card
    const demoLink = screen.getByRole("link", { name: /ver demo/i });
    expect(liveRegion!.contains(demoLink)).toBe(true);

    // Su fila separa título+stack (izquierda) de Ver demo (derecha)
    const row = demoLink.closest("div");
    expect(row).not.toBeNull();
    expect(row!.className).toContain("justify-between");
    expect(row!.className).toContain("items-start");
  });

  it("flota las flechas ant/sig sobre la foto a los lados, centradas en el eje horizontal", () => {
    render(<ProjectsSection />);

    const prev = screen.getByRole("button", { name: "Proyecto anterior" });
    const next = screen.getByRole("button", { name: "Proyecto siguiente" });

    for (const arrow of [prev, next]) {
      expect(arrow.className).toContain("absolute");
      expect(arrow.className).toContain("top-1/2");
      expect(arrow.className).toContain("-translate-y-1/2");
      expect(arrow.className).toContain("pointer-events-auto");
    }
    expect(prev.className).toContain("left-3");
    expect(next.className).toContain("right-3");
  });

  // ── Ajuste 13: Stage proporcional + footer compacto ──────────────────

  it("agrupa badges y dots en la misma fila (fila 2) del footer compacto", () => {
    render(<ProjectsSection />);

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();

    // El contenedor de los dots es la fila 2 del footer
    const dotsContainer = liveRegion!.querySelector(
      '[aria-label="Puntos de navegación de proyectos"]',
    );
    expect(dotsContainer).not.toBeNull();

    const row2 = dotsContainer!.parentElement;
    expect(row2).not.toBeNull();

    // Los badges de tecnologías viven en esa misma fila (hermanos directos
    // de los dots): el título los dejó de acompañar en la fila 1
    const badgesList = row2!.querySelector("ul");
    expect(badgesList).not.toBeNull();
    expect(badgesList!.parentElement).toBe(row2);

    // La fila separa badges (izquierda) de dots (derecha) en una sola línea
    expect(row2!.className).toContain("justify-between");
    expect(row2!.className).toContain("items-center");

    // Y el título NO comparte esa fila (queda arriba, con "Ver demo")
    expect(row2!.querySelector("h3")).toBeNull();
  });

  it("el HUD superior muestra el contador pero no contiene el badge 'Shader Melt' (Ajuste 17)", () => {
    render(<ProjectsSection />);
    expect(screen.getByText(/PROYECTO 01 \/ 05/)).toBeInTheDocument();
    expect(screen.queryByText("Shader Melt")).not.toBeInTheDocument();
  });
});
