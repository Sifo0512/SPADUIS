import { RiskRange } from './risk-range.model';

/** Un término del modelo de riesgo (una variable con su ponderador). */
export interface RiskModelTerm {
  code: string;
  label: string;
  variable: string;
  variableLabel: string;
  dimension: string;
  dimensionTitle: string;
  /** Regla en texto, p. ej. "edad > 18". */
  rule: string;
  kind: 'indicator' | 'linear_score';
  group: string | null;
  weight: number;
  active: boolean;
}

export interface RiskModel {
  /** El índice es (Σ aportes) / divisor. */
  divisor: number;
  /** Suma máxima alcanzable con los términos activos (informativo). */
  theoreticalMax: number;
  /** Máximo posible de cada dimensión (denominador de su índice). */
  dimensions: { id: string; title: string; max: number | null }[];
  terms: RiskModelTerm[];
}

/** BACK: PUT /risk-reports/risk-model */
export interface RiskModelPayload {
  divisor: number;
  terms: { code: string; weight: number; active: boolean }[];
}

/** BACK: PUT /risk-reports/risk-ranges  (lista de los 4 rangos contiguos de 0 a 1) */
export type RiskRangesPayload = RiskRange[];
