/**
 * Tipos del dashboard del estudiante.
 * BACK: son EXACTAMENTE los records de DashboardDtos.java; si cambias uno, cambia el otro.
 */
export type DimensionId = 'academica' | 'financiera' | 'bienestar' | 'sea';

export interface VariableValue {
  key: string;
  label: string;
  type: string;
  /** Texto listo para mostrar. "Restringido" cuando masked = true. */
  value: string;
  sensitive: boolean;
  extra: boolean;
  masked: boolean;
}

export interface StudentHeader {
  id: number;
  code: string;
  documentType: string;
  documentNumber: string;
  fullName: string;
  programName: string;
  facultyName: string | null;
  academicLevel: number | null;
  phone: string | null;
  email: string | null;
  birthDate: string | null;
  age: number | null;
  admissionDate: string | null;
}

export interface Risk {
  index: number;
  level: string; // Bajo | Medio | Alto | Muy alto
  alarmThreshold: number;
  alarm: boolean;
  missingVariables: string[];
}

export interface DimensionCard {
  id: DimensionId;
  title: string;
  index: number | null;
  level: string | null;
  variableCount: number;
  hasMasked: boolean;
  highlights: VariableValue[];
}

export interface StudentDashboard {
  student: StudentHeader;
  risk: Risk;
  summary: VariableValue[];
  dimensions: DimensionCard[];
}

export interface DimensionDetail {
  id: DimensionId;
  title: string;
  index: number | null;
  level: string | null;
  hasMasked: boolean;
  variables: VariableValue[];
}

export interface CalculationTerm {
  code: string;
  label: string;
  variable: string;
  variableLabel: string;
  dimension: string;
  /** 'indicator' = 1 × ponderador si cumple · 'linear_score' = 1 + (1 − ponderador) × (100 − puntaje). */
  kind: 'indicator' | 'linear_score';
  /** Términos del mismo grupo son excluyentes (p. ej. las 3 facultades). */
  group: string | null;
  rule: string;
  /** Ponderador del término. */
  weight: number;
  value: string;
  dataAvailable: boolean;
  applies: boolean | null;
  /** Lo que suma al índice. null = restringido o sin dato. */
  contribution: number | null;
  masked: boolean;
}

/** Índice de UNA dimensión = aportes de la dimensión ÷ divisor del modelo. */
export interface CalculationDimension {
  id: DimensionId;
  title: string;
  /** null = ninguna variable de la dimensión está en el modelo. */
  index: number | null;
  level: string | null;
}

export interface RiskCalculation {
  /** Σ de los aportes de todos los términos. */
  sum: number;
  /** índice = sum / divisor (limitado a 0–1). */
  divisor: number;
  rawIndex: number;
  index: number;
  level: string;
  alarmThreshold: number;
  terms: CalculationTerm[];
  dimensions: CalculationDimension[];
  hasMasked: boolean;
}

export interface ExportFile {
  blob: Blob;
  filename: string;
}
