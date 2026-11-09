/**
 * Rutas del módulo, en UN solo lugar.
 *
 * MIGRACIÓN: si en el proyecto base el módulo cuelga de otra ruta
 * (p. ej. '/spada/riesgo' o '/dropout/reportes'), cambia SOLO RISK_REPORTS_BASE.
 * Debe empezar con '/' y coincidir con el `path` que registres en el router principal.
 */
export const RISK_REPORTS_BASE = '/reportes-desercion';

export const RR_PATHS = {
  list: RISK_REPORTS_BASE,
  create: `${RISK_REPORTS_BASE}/crear`,
  params: `${RISK_REPORTS_BASE}/parametros`,
  alerts: `${RISK_REPORTS_BASE}/alertas`,
  student: `${RISK_REPORTS_BASE}/estudiante`,
} as const;
