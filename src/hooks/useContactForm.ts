"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema, type ContactFormValues } from "@/schemas/contactSchema";
import type { ContactResponse } from "@/types/contact";

/**
 * Estado de envío del formulario de contacto.
 */
export type SubmitStatus = "idle" | "success" | "error";

/**
 * Hook completo del formulario de contacto.
 *
 * Responsabilidades (SRP):
 * - Estado del formulario con react-hook-form + esquema Zod compartido
 *   con el servidor (una sola fuente de verdad de validación).
 * - Normalización de la respuesta del servidor (errores por campo o globales).
 *
 * La defensa anti-bots vive en el cliente (campo honeypot `website`, que
 * los humanos jamás rellenan) y en el servidor (rate limiting por IP +
 * descarte silencioso del honeypot). Un time-trap firmado criptográficamente
 * queda como mejora futura si el spam lo exige.
 *
 * @returns Control del formulario, manejador de envío y estado de respuesta.
 */
export function useContactForm() {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [serverMessage, setServerMessage] = useState("");

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "Consulta General",
      message: "",
    },
    mode: "onBlur",
  });

  const { setError, reset } = form;

  async function submitValues(values: ContactFormValues): Promise<void> {
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = (await response.json()) as ContactResponse;

      if (data.ok) {
        setStatus("success");
        setServerMessage(data.message);
        reset();
      } else {
        setStatus("error");
        setServerMessage(data.message);

        if (data.fieldErrors) {
          for (const [field, messages] of Object.entries(data.fieldErrors)) {
            setError(field as keyof ContactFormValues, {
              type: "server",
              message: messages[0],
            });
          }
        }
      }
    } catch {
      setStatus("error");
      setServerMessage("No se pudo conectar con el servidor. Revisa tu conexión.");
    }
  }

  const onSubmit = form.handleSubmit(submitValues);

  const resetStatus = () => {
    setStatus("idle");
    setServerMessage("");
  };

  return { form, onSubmit, status, serverMessage, resetStatus };
}
