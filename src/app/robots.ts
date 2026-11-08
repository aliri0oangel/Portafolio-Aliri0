import type { MetadataRoute } from "next";
import { siteUrl } from "@/data/site";

/**
 * Robots.txt dinámico.
 *
 * Permite indexación completa del sitio y anuncia la ubicación
 * del sitemap para crawlers.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
