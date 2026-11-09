import { RiskLevel } from './student-risk.model';

/** Rango del indicador que corresponde a un nivel de riesgo (panel de ayuda). */
export interface RiskRange {
  level: RiskLevel;
  min: number;
  max: number;
}
