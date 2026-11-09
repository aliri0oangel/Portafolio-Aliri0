import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { siteUrl } from "@/data/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Metadatos globales del portafolio (SEO + Open Graph).
 * `NEXT_PUBLIC_SITE_URL` alimenta el canónico y las imágenes OG.
 */
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Alirio | Desarrollador Web Full-Stack",
    template: "%s | Alirio — Full-Stack Developer",
  },
  description:
    "Portafolio de Alirio, desarrollador web Full-Stack e ingeniero de software. Construyo aplicaciones escalables con Next.js, TypeScript y arquitecturas headless de alto rendimiento.",
  keywords: [
    "desarrollador full-stack",
    "Next.js",
    "TypeScript",
    "React",
    "WordPress headless",
    "portfolio",
  ],
  authors: [{ name: "Alirio" }],
  openGraph: {
    type: "website",
    locale: "es_VE",
    url: "/",
    siteName: "alirio.dev",
    title: "Alirio | Desarrollador Web Full-Stack",
    description:
      "Aplicaciones web escalables, de alto rendimiento y código limpio que impulsan negocios.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alirio | Desarrollador Web Full-Stack",
    description:
      "Aplicaciones web escalables, de alto rendimiento y código limpio.",
  },
  robots: { index: true, follow: true },
};

/**
 * Datos estructurados JSON-LD para rich results de Google.
 * Combina Person + WebSite para que el buscador entienda
 * quién es el propietario del sitio y qué representa.
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Alirio",
  url: siteUrl,
  jobTitle: "Desarrollador Web Full-Stack & Ingeniero de Software",
  description:
    "Construyo aplicaciones escalables con Next.js, TypeScript y arquitecturas headless.",
  sameAs: ["https://github.com/alirio"],
};

/**
 * Root layout: fuentes auto-hospedadas (cero CLS), provider de tema
 * dual (Code Dark / Studio Light), Smooth Scroll cinético con Lenis,
 * JSON-LD y estructura base del documento.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col font-sans"
        suppressHydrationWarning
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider>
          <SmoothScroll />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
