import { RiskLevel, StudentRisk } from '../models/student-risk.model';
import { PROGRAMS_MOCK } from './programs.mock';

const FIRST_NAMES = [
  'Jorge Alejandro', 'Ana María', 'Luis Fernando', 'Catalina', 'Valentina',
  'Esteban', 'Camila Andrea', 'Juan Sebastián', 'Laura Daniela', 'Santiago',
  'Mariana', 'Carlos Andrés', 'Paula Alejandra', 'Diego Armando', 'Sofía',
];
const LAST_NAMES = [
  'González', 'Rodríguez', 'Martínez', 'Pérez Gómez', 'Suárez', 'Ramírez',
  'Torres Vega', 'Herrera', 'Castillo', 'Ortiz Mora', 'Jiménez', 'Vargas',
];
const RISKS: RiskLevel[] = ['Bajo', 'Medio', 'Alto', 'Bajo', 'Alto', 'Muy alto', 'Medio'];

/** Genera `studentsCount` estudiantes por programa, siempre los mismos (determinístico). */
function buildStudents(programId: number, count: number): StudentRisk[] {
  return Array.from({ length: count }, (_, i) => {
    const n = programId * 1000 + i;
    return {
      id: n,
      documentType: 'CC',
      documentNumber: String(100778238 + n),
      fullName: `${FIRST_NAMES[(i + programId) % FIRST_NAMES.length]} ${LAST_NAMES[(i * 3 + programId) % LAST_NAMES.length]}`,
      code: String(2248018 + n),
      risk: RISKS[(i + programId) % RISKS.length],
      semester: ((i + programId) % 10) + 1,
    };
  });
}

export const STUDENTS_BY_PROGRAM_MOCK: Record<number, StudentRisk[]> = Object.fromEntries(
  PROGRAMS_MOCK.map((p) => [p.id, buildStudents(p.id, p.studentsCount)]),
);
