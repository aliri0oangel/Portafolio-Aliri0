/**
 * Tipado del Motor de Fidelidad Adaptativa (Adaptive Fidelity Engine).
 */

/**
 * Nivel de fidelidad de renderizado asignado según las capacidades
 * detectadas del dispositivo del visitante.
 *
 * - `high`: hardware potente → canvas interactivo completo + blur completo.
 * - `mid`: gama media → partículas reducidas + blur atenuado.
 * - `low`: gama baja / ahorro de datos → sin canvas, sin blur, sin resortes.
 */
export type DeviceTier = "high" | "mid" | "low";

/**
 * Captura inmutable de las capacidades del dispositivo usadas para
 * calcular el tier. Permite testear la lógica de detección sin DOM real.
 */
export interface IDeviceCapabilities {
  deviceMemory: number;
  hardwareConcurrency: number;
  saveData: boolean;
  effectiveType: string;
  prefersReducedMotion: boolean;
  batteryLevel: number | null;
}
