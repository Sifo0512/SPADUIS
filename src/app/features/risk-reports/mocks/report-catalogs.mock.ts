import { ReportCatalogs } from '../models/create-report.model';

// Valores inventados solo para probar la pantalla. Los reales los define el negocio / backend.
export const REPORT_CATALOGS_MOCK: ReportCatalogs = {
  relations: [
    { id: 'DOCENTE', name: 'Docente' },
    { id: 'COMPANERO', name: 'Compañero(a)' },
    { id: 'FAMILIAR', name: 'Familiar' },
    { id: 'COORDINADOR', name: 'Coordinador(a) de programa' },
    { id: 'OTRO', name: 'Otro' },
  ],
  categories: [
    { id: 'ACADEMICO', name: 'Académico' },
    { id: 'ECONOMICO', name: 'Económico' },
    { id: 'SALUD', name: 'Salud' },
    { id: 'PSICOSOCIAL', name: 'Psicosocial' },
    { id: 'INSTITUCIONAL', name: 'Institucional' },
  ],
  channels: [
    { id: 'PRESENCIAL', name: 'Presencial' },
    { id: 'CORREO', name: 'Correo electrónico' },
    { id: 'TELEFONO', name: 'Teléfono' },
    { id: 'PLATAFORMA', name: 'Plataforma virtual' },
  ],
  urgencies: [
    { id: 'BAJA', name: 'Baja' },
    { id: 'MEDIA', name: 'Media' },
    { id: 'ALTA', name: 'Alta' },
    { id: 'CRITICA', name: 'Crítica' },
  ],
};
