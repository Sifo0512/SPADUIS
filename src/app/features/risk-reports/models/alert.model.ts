/**
 * Estados de una alerta (pestañas de "Gestionar alertas").
 * BACK: confirmar los códigos reales del backend. "ANULADA" no tiene pestaña:
 * una alerta anulada deja de aparecer en la gestión.
 */
export type AlertStatus = 'ACTIVA' | 'EN_ATENCION' | 'ESCALADA' | 'ATENDIDA';

export type AlertLevel = 'Crítico' | 'Alto' | 'Medio' | 'Bajo';

/** Fila del listado. */
export interface Alert {
  id: number;
  studentId: number;
  studentCode: string; // "2248078"
  studentName: string;
  level: AlertLevel;
  type: string; // "Económica"
  /** Índice de riesgo, 0 a 1. */
  index: number;
  /** Fecha y hora ISO: "2024-05-02T10:00:00". */
  date: string;
  status: AlertStatus;
}

/** Detalle que se muestra al elegir una alerta (segunda pantalla). */
export interface AlertDetail extends Alert {
  documentType: string; // "CC"
  documentNumber: string;
  programName: string; // "27 - Ingeniería de sistemas"
  academicLevel: number; // semestre
  urgency: string; // "Alto"
  reporterName: string;
  relation: string;
  category: string;
  channel: string;
  description: string;
  /** Solo si ya se registró una intervención. */
  resultStatus: AlertStatus | null;
  notes: string | null;
}

export interface AlertsQuery {
  status: AlertStatus;
  /** Base 0. */
  page: number;
  size: number;
  search: string;
  /** "yyyy-MM-dd" o '' (sin filtro). */
  date: string;
}

export interface AlertFilters {
  search: string;
  date: string;
}

export type AlertCounts = Record<AlertStatus, number>;

/** Lo que se envía al guardar la intervención. */
export interface InterventionPayload {
  resultStatus: AlertStatus;
  notes: string;
}

export const ALERT_TABS: { id: AlertStatus; label: string }[] = [
  { id: 'ACTIVA', label: 'Activa' },
  { id: 'EN_ATENCION', label: 'En atención' },
  { id: 'ESCALADA', label: 'Escalada' },
  { id: 'ATENDIDA', label: 'Atendida' },
];

/**
 * Opciones de "Estado resultante" de la intervención.
 * BACK: confirmar con negocio cuáles estados puede elegir el usuario (aquí: los tres siguientes a "Activa").
 */
export const RESULT_STATUS_OPTIONS = ALERT_TABS.filter((t) => t.id !== 'ACTIVA');

export function statusLabel(status: AlertStatus): string {
  return ALERT_TABS.find((t) => t.id === status)?.label ?? status;
}
