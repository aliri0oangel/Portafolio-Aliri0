import type { MetadataRoute } from "next";
import { siteUrl } from "@/data/site";

/**
 * Sitemap XML dinámico del portafolio.
 *
 * Genera el sitemap con la URL canónica del sitio. En un portafolio
 * single-page solo hay una ruta raíz, pero la estructura escala
 * automáticamente si se añaden páginas nuevas.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
