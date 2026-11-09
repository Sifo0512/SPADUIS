import { RiskRange } from '../models/risk-range.model';

export const RISK_RANGES_MOCK: RiskRange[] = [
  { level: 'Bajo', min: 0, max: 0.25 },
  { level: 'Medio', min: 0.26, max: 0.5 },
  { level: 'Alto', min: 0.51, max: 0.75 },
  { level: 'Muy alto', min: 0.76, max: 1 },
];
