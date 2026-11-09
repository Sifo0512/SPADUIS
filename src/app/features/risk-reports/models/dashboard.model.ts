/**
 * Tipos del dashboard del estudiante.
 * BACK: son EXACTAMENTE los records de DashboardDtos.java; si cambias uno, cambia el otro.
 */
export type DimensionId = 'identificacion' | 'academica' | 'financiera' | 'bienestar';

export interface VariableValue {
  key: string;
  label: string;
  type: string;
  /** Texto listo para mostrar. "Restringido" cuando masked = true. */
  value: string;
  derived: boolean;
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
  admissionDate: string | null;
}

export interface Risk {
  index: number;
  level: string; // Bajo | Medio | Alto | Muy alto
  alarmThreshold: number;
  alarm: boolean;
  interceptCalibrated: boolean;
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
  rule: string;
  oddsRatio: number;
  coefficient: number;
  value: string;
  dataAvailable: boolean;
  applies: boolean | null;
  contribution: number | null;
  masked: boolean;
}

export interface RiskCalculation {
  intercept: number;
  interceptCalibrated: boolean;
  logit: number;
  rawIndex: number;
  index: number;
  level: string;
  alarmThreshold: number;
  terms: CalculationTerm[];
  hasMasked: boolean;
}

export interface ExportFile {
  blob: Blob;
  filename: string;
}
