import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContactSection } from "../ContactSection";
import { triggerReveal } from "@/__tests__/revealTrigger";

/**
 * Tests de la sección de contacto — Ajuste 7 (rediseño 2 columnas
 * estilo referencia `portfolio-peach-nine-crjsjzebx5.vercel.app`) +
 * Ajuste 15 (enlaces directos movidos a la columna 1).
 *
 * Estructura validada:
 * - Col 1 (izquierda): SectionHeader (mismos eyebrow/título/descripción)
 *   + LocalClock en variante "pill" (estilo navbar de referencia)
 *   + grilla 2x2 de enlaces directos (WhatsApp, GitHub, Email, LinkedIn),
 *   estática (sin clases de reveal).
 * - Col 2 (derecha): card glassmorphic SOLO con el mini-formulario de 3
 *   campos (Nombre, Correo, Mensaje — sin select de asunto; el subject
 *   viaja fijo como "Consulta General" vía defaultValues).
 * - El strip de SLA se eliminó (la información vive en el subtítulo).
 */
describe("ContactSection", () => {
  it("renderiza el encabezado con eyebrow 'Contacto' y título", () => {
    const { container } = render(<ContactSection />);
    const header = container.querySelector("header");
    expect(header).toHaveTextContent("Contacto");
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Hablemos de tu próximo proyecto.",
      }),
    ).toBeInTheDocument();
  });

  it("estructura en 2 columnas: intro (encabezado + reloj + enlaces) y panel (formulario)", () => {
    render(<ContactSection />);

    const intro = screen.getByTestId("contact-intro");
    const panel = screen.getByTestId("contact-panel");

    // Col 1: encabezado, reloj y enlaces directos (Ajuste 15)
    const header = intro.querySelector("header");
    expect(header).not.toBeNull();
    expect(header).toHaveTextContent("Contacto");
    expect(intro).toContainElement(
      screen.getByRole("heading", {
        level: 2,
        name: "Hablemos de tu próximo proyecto.",
      }),
    );
    expect(intro).toContainElement(screen.getByTestId("contact-local-clock"));
    expect(intro).toContainElement(screen.getByTestId("contact-card-whatsapp"));

    // Col 2: solo el formulario vive en la columna derecha
    expect(panel).toContainElement(
      screen.getByRole("button", { name: /Enviar Mensaje/i }),
    );
    expect(panel).not.toContainElement(
      screen.getByTestId("contact-card-whatsapp"),
    );
    expect(panel).not.toContainElement(
      screen.getByTestId("contact-card-linkedin"),
    );
  });

  it("el reloj de la columna 1 usa la variante pill (Venezuela · UTC-4)", () => {
    render(<ContactSection />);

    const clock = screen.getByTestId("contact-local-clock");
    expect(clock).toHaveTextContent("Venezuela");
    expect(clock).toHaveTextContent(/UTC-4/);
    // La variante pill NO muestra la etiqueta de la variante default
    expect(screen.queryByText("Zona horaria local")).not.toBeInTheDocument();
  });

  it("NO renderiza el strip de SLA (la información vive en el subtítulo)", () => {
    render(<ContactSection />);
    expect(
      screen.queryByText(/Respuesta garantizada en menos de 24 horas hábiles/i),
    ).not.toBeInTheDocument();
  });

  it("mini-formulario con 3 campos: Nombre, Correo y Mensaje (sin select de asunto)", () => {
    render(<ContactSection />);
    expect(screen.getByLabelText(/Nombre completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mensaje/i)).toBeInTheDocument();
    // Sin select de asunto: el subject viaja fijo en defaultValues
    expect(screen.queryByLabelText(/Asunto/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Enviar Mensaje/i }),
    ).toBeInTheDocument();
  });

  it("renderiza los 4 enlaces directos en la columna izquierda (bajo el reloj)", () => {
    render(<ContactSection />);

    const intro = screen.getByTestId("contact-intro");
    const panel = screen.getByTestId("contact-panel");
    const whatsapp = screen.getByTestId("contact-card-whatsapp");
    const github = screen.getByTestId("contact-card-github");
    const email = screen.getByTestId("contact-card-email");
    const linkedin = screen.getByTestId("contact-card-linkedin");

    // Ajuste 15: los 4 canales viven en col 1 (mismo orden 2x2)
    expect(intro).toContainElement(whatsapp);
    expect(intro).toContainElement(github);
    expect(intro).toContainElement(email);
    expect(intro).toContainElement(linkedin);

    // ...y salieron por completo de la card de col 2
    expect(panel).not.toContainElement(whatsapp);
    expect(panel).not.toContainElement(github);
    expect(panel).not.toContainElement(email);
    expect(panel).not.toContainElement(linkedin);

    // Estáticos (decisión de diseño): el bloque no arrastra las
    // clases de reveal del sistema de motion del Ajuste 8.
    const bloqueEnlaces = screen.getByText("Enlaces directos").parentElement;
    expect(bloqueEnlaces).not.toBeNull();
    expect(intro).toContainElement(bloqueEnlaces!);
    expect(bloqueEnlaces!.classList.contains("reveal")).toBe(false);
    expect(bloqueEnlaces!.classList.contains("reveal-card")).toBe(false);
  });

  it("el enlace de WhatsApp apunta a wa.me y abre en pestaña nueva", () => {
    render(<ContactSection />);
    const whatsapp = screen.getByTestId("contact-card-whatsapp");
    expect(whatsapp).toHaveAttribute("href", expect.stringContaining("wa.me"));
    expect(whatsapp).toHaveAttribute("target", "_blank");
  });

  it("la tarjeta de Email contiene el botón de copiado y el enlace mailto", () => {
    render(<ContactSection />);
    expect(
      screen.getByRole("button", { name: "Copiar correo al portapapeles" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Abrir correo en el cliente de email" }),
    ).toBeInTheDocument();
  });

  it("incluye el campo honeypot oculto para protección anti-bots", () => {
    render(<ContactSection />);
    const honeypot = screen.getByLabelText("No rellenar este campo");
    expect(honeypot).toBeInTheDocument();
    expect(honeypot).toHaveAttribute("tabindex", "-1");
  });

  /**
   * Ajuste 17 — Card de Email: muestra "Email" / "Contacto" en vez de renderizar
   * la dirección de correo (que desbordaba ~196px y tapaba los botones).
   * Al tener 2 líneas cortas idénticas al resto de cards, no requiere flex-wrap,
   * min-w-0 ni ml-auto, garantizando 59px de altura constante.
   */
  it("la card de Email muestra el texto 'Contacto' y NO la dirección de correo (Ajuste 17)", () => {
    render(<ContactSection />);
    const emailCard = screen.getByTestId("contact-card-email");
    expect(emailCard).toHaveTextContent("Email");
    expect(emailCard).toHaveTextContent("Contacto");
    expect(emailCard).not.toHaveTextContent("alirioangel44@gmail.com");
  });

  it("la card de Email tiene min-w-0 en el grupo izquierdo y shrink-0 en los botones, sin flex-wrap ni ml-auto (Ajuste 17)", () => {
    render(<ContactSection />);
    const emailCard = screen.getByTestId("contact-card-email");
    // Sin flex-wrap: los botones nunca saltan a una segunda línea
    expect(emailCard).not.toHaveClass("flex-wrap");

    // min-w-0 en el grupo izquierdo → puede ceder espacio a los botones (Ajuste 17)
    const grupoIzquierdo = emailCard.children[0] as HTMLElement;
    expect(grupoIzquierdo).toHaveClass("min-w-0");

    // min-w-0 también en el span de textos para que "Contacto" se trunque si es necesario
    const spanTextos = grupoIzquierdo.children[1] as HTMLElement;
    expect(spanTextos).toHaveClass("min-w-0");

    // shrink-0 en botones: su ancho nunca se comprime
    const botones = emailCard.children[1] as HTMLElement;
    expect(botones).toHaveClass("shrink-0");
    expect(botones).not.toHaveClass("ml-auto");
  });

  /**
   * Ajuste 17 (ajuste visual): la card Email debe usar el MISMO
   * padding horizontal (`px-4`) que WhatsApp/GitHub/LinkedIn para que
   * el icono arranque a la misma distancia del borde en las 4 cards.
   *
   * Durante el fix inicial se había bajado a `px-3 … xl:px-4` para que
   * "Contacto" cupiera en la celda de 180 px a 1024 px; la solución
   * final es apilar la grilla en `lg`, por lo que el padding vuelve a
   * ser uniforme.
   */
  it("la card de Email usa el mismo padding px-4 que el resto de cards (Ajuste 17)", () => {
    render(<ContactSection />);
    const emailCard = screen.getByTestId("contact-card-email");
    expect(emailCard).toHaveClass("px-4");
    expect(emailCard).not.toHaveClass("px-3");
  });

  it("los botones de copiar y mailto siguen intactos en la card de Email (Ajuste 17)", () => {
    render(<ContactSection />);
    const emailCard = screen.getByTestId("contact-card-email");
    const copyBtn = screen.getByRole("button", {
      name: "Copiar correo al portapapeles",
    });
    const mailtoLink = screen.getByRole("link", {
      name: "Abrir correo en el cliente de email",
    });

    expect(emailCard).toContainElement(copyBtn);
    expect(emailCard).toContainElement(mailtoLink);
    expect(mailtoLink).toHaveAttribute("href", "mailto:alirioangel44@gmail.com");
  });
});

/**
 * Motion System (Ajuste 8): el encabezado de la columna 1 se revela
 * con scroll-driven animations (clase `.reveal`) y la card de la
 * columna 2 usa `@starting-style` — el panel `reveal-card-grid`
 * arranca SIN `is-visible` y `useRevealOnScroll` (IntersectionObserver,
 * once) lo añade al entrar en pantalla.
 *
 * Excepción (Ajuste 15): los enlaces directos pasaron a vivir en la
 * columna 1 pero quedan estáticos, fuera de ese sistema de motion.
 */
describe("ContactSection — Motion System (Ajuste 8)", () => {
  it("el encabezado de la columna 1 usa la clase reveal", () => {
    const { container } = render(<ContactSection />);
    const header = container.querySelector("#contacto .reveal");
    expect(header).not.toBeNull();
    expect(header).toContainElement(
      screen.getByRole("heading", { level: 2, name: /Hablemos de tu próximo proyecto/i }),
    );
  });

  it("el panel de la columna 2 es reveal-card-grid con la card reveal-card (--i: 0)", () => {
    const { container } = render(<ContactSection />);
    const panel = container.querySelector('[data-testid="contact-panel"]');
    expect(panel).not.toBeNull();
    expect(panel).toHaveClass("reveal-card-grid");

    const card = panel!.querySelector(":scope > .reveal-card");
    expect(card).not.toBeNull();
    expect((card as HTMLElement).style.getPropertyValue("--i")).toBe("0");
  });

  it("el panel arranca oculto y se revela al entrar en pantalla", () => {
    const { container } = render(<ContactSection />);
    const panel = container.querySelector('[data-testid="contact-panel"]')!;

    expect(panel.classList.contains("is-visible")).toBe(false);

    expect(triggerReveal(panel)).toBe(true);
    expect(panel.classList.contains("is-visible")).toBe(true);
  });
});
