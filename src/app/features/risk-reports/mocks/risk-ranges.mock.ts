import { RiskRange } from '../models/risk-range.model';

export const RISK_RANGES_MOCK: RiskRange[] = [
  { level: 'Bajo', min: 0, max: 0.1 },
  { level: 'Medio', min: 0.1, max: 0.3 },
  { level: 'Alto', min: 0.3, max: 0.6 },
  { level: 'Muy alto', min: 0.6, max: 1 },
];
