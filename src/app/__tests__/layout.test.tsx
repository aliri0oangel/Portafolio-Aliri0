import { describe, it, expect, vi, afterEach } from "vitest";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { act } from "react";
import RootLayout from "../layout";

/**
 * Entorno de act() para el hydrateRoot manual de este archivo.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Fuentes simuladas: `next/font/google` requiere el transform de SWC
 * de Next, no disponible en Vitest. El mock devuelve la misma forma
 * en SSR y cliente, que es lo que exige la hidratación.
 */
vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans", className: "geist_sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono", className: "geist_mono" }),
}));

const HYDRATION_RE = /hydrated but some attributes|didn't match|did not match/i;

/**
 * Tests del RootLayout (TDD: regresión del error de hidratación
 * "A tree hydrated but some attributes of the server rendered HTML
 * didn't match..." provocado por extensiones de navegador que
 * inyectan atributos en <body> antes de que React hidrate — caso
 * real: ColorZilla escribe `cz-shortcut-listen="true"`).
 *
 * React corre en modo dev aquí (Vitest), que es donde el warning
 * existe: el build de producción no lo emite.
 */
describe("RootLayout", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("el <body> se hidrata sin errores aunque una extensión inyecte atributos extra", async () => {
    const child = <div id="app-child">contenido</div>;
    const params = Promise.resolve({});
    const ssr = renderToString(<RootLayout params={params}>{child}</RootLayout>);

    // Montar el markup SSR real en el documento jsdom
    const parsed = new DOMParser().parseFromString(ssr, "text/html");
    for (const attr of Array.from(document.documentElement.attributes)) {
      document.documentElement.removeAttribute(attr.name);
    }
    for (const attr of Array.from(parsed.documentElement.attributes)) {
      document.documentElement.setAttribute(attr.name, attr.value);
    }
    document.head.innerHTML = parsed.head.innerHTML;
    document.body.innerHTML = parsed.body.innerHTML;

    // Simular la extensión ColorZilla: atributo extra en <body>
    // ANTES de que React hidrate.
    document.body.setAttribute("cz-shortcut-listen", "true");

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(document, <RootLayout params={params}>{child}</RootLayout>);
    });

    const hydrationErrors = errorSpy.mock.calls.filter((args: unknown[]) =>
      HYDRATION_RE.test(String(args[0])),
    );
    expect(hydrationErrors).toHaveLength(0);
    expect(errorSpy).not.toHaveBeenCalled();

    // El atributo de la extensión sobrevive y el contenido hidrató bien
    expect(document.body.getAttribute("cz-shortcut-listen")).toBe("true");
    expect(document.getElementById("app-child")).toBeTruthy();

    const r = root;
    await act(async () => r?.unmount());
  });
});
