import { CareTeam } from '../models/care-team.model';

// Datos inventados solo para probar la pantalla.
export const CARE_TEAMS_MOCK: CareTeam[] = [
  { id: 1, name: 'SEA', validFrom: '2026-02-15', validTo: null },
  { id: 2, name: 'Bienestar universitario', validFrom: '2025-08-01', validTo: null },
  { id: 3, name: 'Consejería académica', validFrom: '2025-02-10', validTo: '2025-12-15' },
  { id: 4, name: 'Apoyo psicosocial', validFrom: '2026-01-20', validTo: null },
  { id: 5, name: 'Permanencia estudiantil', validFrom: '2024-07-01', validTo: '2026-06-30' },
  { id: 6, name: 'Orientación vocacional', validFrom: '2026-03-05', validTo: null },
  { id: 7, name: 'Acompañamiento financiero', validFrom: '2025-05-12', validTo: null },
  { id: 8, name: 'Tutorías entre pares', validFrom: '2025-09-01', validTo: '2026-02-28' },
  { id: 9, name: 'Salud y bienestar', validFrom: '2026-02-01', validTo: null },
  { id: 10, name: 'Inclusión y diversidad', validFrom: '2026-04-15', validTo: null },
];
