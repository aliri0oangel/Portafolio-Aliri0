import { ImageResponse } from "next/og";

/**
 * OG image dinámica generada en el edge.
 *
 * Usa `ImageResponse` de Next.js para renderizar una imagen
 * personalizada con la identidad del sitio (sin archivos estáticos).
 * Se sirve automáticamente en `/opengraph-image` y lo detectan
 * Facebook, LinkedIn, Twitter, etc.
 */
export const alt = "Alirio — Desarrollador Web Full-Stack";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px",
          backgroundColor: "#0a0a0f",
          backgroundImage:
            "radial-gradient(circle at 80% 20%, rgba(16,185,129,0.15) 0%, transparent 60%)",
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "2px",
              backgroundColor: "#10b981",
            }}
          />
          <span
            style={{
              fontSize: "18px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#10b981",
              fontFamily: "monospace",
            }}
          >
            Full-Stack Developer
          </span>
        </div>

        {/* Título principal */}
        <h1
          style={{
            fontSize: "72px",
            fontWeight: "bold",
            color: "#f1f5f9",
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          Alirio
        </h1>

        {/* Subtítulo */}
        <p
          style={{
            fontSize: "28px",
            color: "#94a3b8",
            margin: "16px 0 0 0",
            maxWidth: "800px",
            lineHeight: 1.4,
          }}
        >
          Aplicaciones web escalables, de alto rendimiento y código limpio.
        </p>

        {/* Stack */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "40px",
          }}
        >
          {["Next.js", "TypeScript", "React", "WordPress"].map((tech) => (
            <span
              key={tech}
              style={{
                fontSize: "16px",
                color: "#10b981",
                border: "1px solid rgba(16,185,129,0.3)",
                borderRadius: "8px",
                padding: "8px 16px",
              }}
            >
              {tech}
            </span>
          ))}
        </div>

        {/* URL */}
        <span
          style={{
            position: "absolute",
            bottom: "40px",
            right: "80px",
            fontSize: "20px",
            color: "#475569",
          }}
        >
          alirio.dev
        </span>
      </div>
    ),
    { ...size },
  );
}
