import type { SVGProps } from "react";

/**
 * Iconos de marca (GitHub / LinkedIn) como SVG inline.
 *
 * lucide-react 1.x dejó de distribuir iconos de marca, por lo que se
 * alojan aquí localmente: cero dependencias externas, tree-shakeables
 * y con `currentColor` para heredar el color del contexto.
 */

type BrandIconProps = SVGProps<SVGSVGElement>;

/**
 * Marca oficial de GitHub (Octocat).
 *
 * @param props - Props SVG nativas (`className`, `aria-label`...).
 */
export function GithubIcon(props: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      {...props}
    >
      <path d="M12 .5C5.73.5.99 5.24.99 11.5c0 4.86 3.15 8.98 7.52 10.43.55.1.75-.24.75-.53 0-.26-.01-.95-.02-1.86-3.06.66-3.71-1.48-3.71-1.48-.5-1.28-1.23-1.62-1.23-1.62-1-.69.08-.67.08-.67 1.11.08 1.7 1.14 1.7 1.14.99 1.7 2.6 1.21 3.23.93.1-.72.39-1.21.7-1.49-2.44-.28-5.01-1.22-5.01-5.44 0-1.2.43-2.18 1.13-2.95-.11-.28-.49-1.4.11-2.92 0 0 .92-.29 3.01 1.13a10.4 10.4 0 0 1 5.48 0c2.09-1.42 3.01-1.13 3.01-1.13.6 1.52.22 2.64.11 2.92.7.77 1.13 1.75 1.13 2.95 0 4.23-2.58 5.16-5.03 5.43.4.34.75 1.02.75 2.06 0 1.49-.01 2.69-.01 3.05 0 .29.2.64.76.53 4.36-1.46 7.5-5.57 7.5-10.43C23.01 5.24 18.27.5 12 .5z" />
    </svg>
  );
}

/**
 * Marca oficial de LinkedIn.
 *
 * @param props - Props SVG nativas (`className`, `aria-label`...).
 */
export function LinkedinIcon(props: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      {...props}
    >
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.55V9h3.57v11.45z" />
    </svg>
  );
}
