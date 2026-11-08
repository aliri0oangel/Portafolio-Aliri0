import { z } from "zod";

/**
 * Esquema unificado de validación Zod para el formulario de contacto.
 * Se comparte entre cliente (react-hook-form) y servidor (route handler),
 * garantizando una única fuente de verdad de validación (DRY).
 *
 * Seguridad: la longitud máxima acota el tamaño del payload (DoS) y el
 * campo `website` es el honeypot silencioso — los humanos jamás lo ven,
 * por lo que cualquier valor presente implica un bot.
 */
export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(100, "El nombre no puede superar los 100 caracteres."),
  email: z
    .email("Introduce un correo electrónico válido.")
    .max(254, "El correo no puede superar los 254 caracteres."),
  subject: z.enum(
    [
      "Nuevo Proyecto",
      "Desarrollo WordPress + WooCommerce",
      "Propuesta Laboral",
      "Consulta General",
    ],
    "Selecciona un motivo de contacto.",
  ),
  message: z
    .string()
    .trim()
    .min(10, "El mensaje debe tener al menos 10 caracteres.")
    .max(1000, "El mensaje no puede superar los 1000 caracteres."),
  /** Honeypot anti-spam: debe permanecer vacío en peticiones humanas. */
  website: z.string().max(0).optional(),
});

/**
 * Tipo inferido del payload validado. Se usa en cliente y servidor para
 * evitar divergencias de tipado.
 */
export type ContactFormValues = z.infer<typeof contactSchema>;
