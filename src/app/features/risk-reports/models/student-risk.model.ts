export type RiskLevel = 'Bajo' | 'Medio' | 'Alto' | 'Muy alto';

export interface StudentRisk {
  id: number;
  documentType: string; // "CC"
  documentNumber: string; // "100778238"
  fullName: string; // "Jorge Alejandro González"
  code: string; // "2248018"
  risk: RiskLevel;
  // BACK: campo de ejemplo para el segundo filtro del mockup ("Label").
  // Reemplázalo por el filtro real que defina el negocio.
  semester: number;
}
