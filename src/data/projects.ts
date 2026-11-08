import type { IProject } from "@/types/project";

/**
 * Catálogo de proyectos del portafolio (Data-as-Code).
 *
 * Arquitectura abierta a la extensión (OCP): para publicar un nuevo proyecto
 * basta con añadir un objeto que cumpla `IProject` a esta lista; el JSX de
 * `ProjectsSection` no requiere modificación alguna y se adapta automáticamente.
 *
 * Para agregar un proyecto manualmente:
 * 1. Coloca la imagen en `/public/projects/` (recomendado proporción 16:9, ej. 1280x720).
 * 2. Agrega el objeto con:
 *    - `id`: identificador único en minúsculas (ej: "mi-tienda")
 *    - `title`: nombre del proyecto
 *    - `featuredImage`: ruta relativa (ej: "/projects/mi-tienda.webp")
 *    - `technologies`: lista de badges tecnológicos
 *    - `liveUrl`: URL pública (opcional: si no tiene demo, omite este campo)
 */
export const projects: IProject[] = [
  {
    id: "youtube-clone-alirio",
    title: "Clon de YouTube",
    featuredImage: "/projects/youtube_clon_alirio.webp",
    technologies: ["HTML", "CSS"],
    liveUrl: "https://youtube-clone-aliri0o.netlify.app/",
  },
  {
    id: "wordpress-ecommerce-alirio",
    title: "Ecommerce",
    featuredImage: "/projects/wordpress_ecommerce.webp",
    technologies: ["WordPress", "WooCommerce"],
    liveUrl: "https://e-kommerce.synergize.co/?v=ca76b55c988e",
  },
  {
    id: "spotify-clone-alirio",
    title: "Clon de Spotify",
    featuredImage: "/projects/Spotify-clon-alirio.webp",
    technologies: ["HTML", "CSS", "TailwindCSS"],
    liveUrl: "https://spotify-clone-aliri0o.netlify.app/",
  },
  {
    id: "form-validation-alirio",
    title: "Formulario de registro",
    featuredImage: "/projects/validacion-formulario-js-aliri0o.netlify.app.webp",
    technologies: ["HTML", "CSS", "TailwindCSS", "JavaScript"],
    liveUrl: "https://validacion-formulario-js-aliri0o.netlify.app/",
  },
  {
    id: "miniweb-rick-and-morty-aliri0o",
    title: "Mini Web: Rick and Morty",
    featuredImage: "/projects/mini-web-rick-and-morty-aliri0o.webp",
    technologies: ["HTML", "CSS", "TailwindCSS", "JavaScript", "API"],
    liveUrl: "https://mini-web-rick-and-morty-aliri0o.netlify.app/login.html",
  }
];
