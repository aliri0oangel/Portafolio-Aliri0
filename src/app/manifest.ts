import type { MetadataRoute } from "next";

/**
 * Web App Manifest para PWA básica.
 *
 * Define nombre, colores de tema y iconos para que el navegador
 * pueda instalar el portafolio como app y mostrar el splash screen.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alirio — Desarrollador Web Full-Stack",
    short_name: "Alirio",
    description:
      "Portafolio de Alirio, desarrollador web Full-Stack e ingeniero de software.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#10b981",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
