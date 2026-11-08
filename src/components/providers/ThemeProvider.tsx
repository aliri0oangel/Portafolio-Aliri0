"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Wrapper de `next-themes` con estrategia por clase (`.dark`).
 *
 * - `attribute="class"` + `<html suppressHydrationWarning>` elimina el
 *   FOUC (parpadeo entre tema claro/oscuro) mediante un script inline
 *   síncrono que Next inyecta antes de la hidratación.
 * - Tema por defecto: **Code Dark**.
 *
 * @param props - Props nativas de NextThemesProvider más los hijos.
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
