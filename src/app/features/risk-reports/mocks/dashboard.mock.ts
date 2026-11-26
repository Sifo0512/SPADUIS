import {
  CalculationDimension,
  CalculationTerm,
  DimensionCard,
  DimensionDetail,
  DimensionId,
  RiskCalculation,
  StudentDashboard,
  VariableValue,
} from '../models/dashboard.model';
import { StudentSummary } from '../models/create-report.model';
import { RiskModel } from '../models/risk-model.model';
import { RiskRange } from '../models/risk-range.model';
import { RISK_MODEL_MOCK } from './risk-model.mock';
import { RISK_RANGES_MOCK } from './risk-ranges.mock';

/**
 * Datos de prueba del dashboard (solo con `useMock: true`).
 * Los valores salen del id del estudiante, así que son estables entre recargas.
 * Simula lo que hace el backend, pero NO es el modelo real.
 */
interface Def {
  key: string;
  label: string;
  dim: DimensionId | 'identificacion';
  type: string;
  sensitive?: boolean;
  extra?: boolean;
}

const d = (key: string, label: string, dim: DimensionId | 'identificacion', type = 'TEXT', o: Partial<Def> = {}): Def => ({
  key, label, dim, type, ...o,
});

const DEFS: Def[] = [
  d('codigo_estudiante', 'Código estudiante', 'identificacion'),
  d('tipo_documento', 'Tipo de documento', 'identificacion'),
  d('documento_identidad', 'Documento de identidad', 'identificacion'),
  d('nombre', 'Nombre completo', 'identificacion'),
  d('direccion_electronica', 'Correo electrónico', 'identificacion'),
  d('telefono', 'Teléfono de contacto', 'identificacion'),
  d('fecha_nacimiento', 'Fecha de nacimiento', 'identificacion', 'DATE'),
  d('edad', 'Edad al ingreso', 'identificacion', 'INTEGER'),
  d('fecha_ingreso', 'Fecha de ingreso', 'identificacion', 'DATE', { extra: true }),

  d('programa_academico', 'Código de programa', 'academica'),
  d('nombre_programa', 'Nombre del programa', 'academica'),
  d('nombre_facultad', 'Facultad', 'academica'),
  d('cupo', 'Modalidad de cupo', 'academica'),
  d('tipo_ingreso', 'Tipo de ingreso', 'academica'),
  d('opcion_ingreso', 'Opción de ingreso', 'academica'),
  d('clase_institucional', 'Clase institucional', 'academica'),
  d('puntaje_saber_11', 'Puntaje Saber 11 (global)', 'academica', 'INTEGER'),
  d('puntaje_saber_matematica', 'Saber 11 – Matemáticas', 'academica', 'INTEGER'),
  d('puntaje_saber_lectura', 'Saber 11 – Lectura', 'academica', 'INTEGER'),
  d('puntaje_saber_naturales', 'Saber 11 – Naturales', 'academica', 'INTEGER', { extra: true }),
  d('curso_precalculo', 'Curso de precálculo', 'sea'),
  d('curso_prelectura', 'Curso de prelectura', 'sea'),

  d('estrato', 'Estrato socioeconómico', 'financiera', 'INTEGER'),
  d('valor_matricula', 'Valor de matrícula', 'financiera', 'MONEY'),
  d('socioeconomico', 'Riesgo socioeconómico', 'financiera', 'TEXT', { sensitive: true }),

  d('codigo_municipio', 'Código de municipio (DANE)', 'sea'),
  d('nombre_municipio', 'Municipio', 'sea'),
  d('nombre_departamento', 'Departamento', 'sea'),
  d('lugar_procedencia', 'Lugar de procedencia', 'sea', 'TEXT'),
  d('riesgo_matematica', 'Riesgo matemático', 'sea', 'TEXT'),
  d('riesgo_cognitivo', 'Riesgo cognitivo', 'sea', 'TEXT'),
  d('riesgo_proceso_aprendizaje', 'Riesgo en proceso de aprendizaje', 'sea', 'TEXT'),
  d('riesgo_psicosocial', 'Riesgo psicosocial', 'bienestar', 'TEXT', { sensitive: true }),
  d('promedio_ponderado_riesgo_psicosocial', 'Promedio ponderado de riesgo psicosocial', 'bienestar', 'DECIMAL', { sensitive: true }),
  d('escala_de_ansiedad_zung', 'Escala de ansiedad de Zung', 'bienestar', 'TEXT', { sensitive: true }),
  d('escala_zung_depresion', 'Escala de depresión de Zung', 'bienestar', 'TEXT', { sensitive: true }),
  d('apego_familiar', 'Apego / funcionalidad familiar', 'bienestar', 'TEXT', { sensitive: true }),
  d('cuidado_personal', 'Cuidado personal', 'bienestar', 'TEXT', { sensitive: true }),
  d('satisfaccion_vida', 'Satisfacción con la vida', 'bienestar', 'TEXT', { sensitive: true }),
  d('assist', 'ASSIST (sustancias psicoactivas)', 'bienestar', 'TEXT', { sensitive: true }),
  d('audit', 'AUDIT (alcohol)', 'bienestar', 'TEXT', { sensitive: true }),
  d('consumo_sustancias', 'Consume sustancias (ASSIST o AUDIT)', 'bienestar', 'TEXT', { sensitive: true }),
  d('inventario_habitos', 'Inventario de hábitos', 'bienestar', 'TEXT', { sensitive: true }),
];

const TITLES: Record<DimensionId, string> = {
  academica: 'Información académica',
  financiera: 'Información financiera',
  bienestar: 'Información de bienestar',
  sea: 'Apoyo SEA',
};

const HIGHLIGHTS: Record<DimensionId, string[]> = {
  academica: ['nombre_facultad', 'tipo_ingreso', 'opcion_ingreso', 'puntaje_saber_11'],
  financiera: ['estrato', 'valor_matricula', 'socioeconomico'],
  bienestar: ['apego_familiar', 'riesgo_psicosocial', 'satisfaccion_vida', 'consumo_sustancias'],
  sea: ['riesgo_matematica', 'riesgo_cognitivo', 'riesgo_proceso_aprendizaje', 'lugar_procedencia'],
};
const SUMMARY = ['puntaje_saber_11', 'estrato', 'edad', 'valor_matricula'];

const LEVELS = ['Bajo', 'Medio', 'Alto'];
const pick = <T>(arr: T[], n: number): T => arr[n % arr.length];
/** Nivel según los rangos (límite superior incluido, igual que el backend). */
const levelFor = (i: number, ranges: RiskRange[] = RISK_RANGES_MOCK): string =>
  (ranges.find((r) => i <= r.max) ?? ranges[ranges.length - 1]).level;
const norm = (v: unknown): string =>
  String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const fmtMoney = (n: number): string => n.toLocaleString('es-CO');
const r2 = (n: number): number => Math.round(n * 100) / 100;

/** Qué puede ver quien consulta (en mock: se controla con esta bandera). */
export const MOCK_CAN_VIEW_WELLBEING = true;

function rawValues(s: StudentSummary): Record<string, string | number> {
  const n = s.id;
  const saber = 250 + ((n * 37) % 200);
  const estrato = 1 + (n % 6);
  const edad = 17 + (n % 8);
  const matricula = 1_200_000 + ((n * 173_000) % 3_800_000);
  return {
    codigo_estudiante: s.code,
    tipo_documento: s.documentType,
    documento_identidad: s.documentNumber,
    nombre: s.fullName,
    direccion_electronica: `${s.fullName.split(' ')[0].toLowerCase()}${s.code}@correo.uis.edu.co`,
    telefono: `31${(n * 7919) % 100000000}`.padEnd(10, '0').slice(0, 10),
    fecha_ingreso: '15/02/2026',
    programa_academico: String(2000 + n),
    nombre_programa: s.programName,
    nombre_facultad: pick(['ciencias', 'fisicomecanicas', 'fisicoquimicas', 'humanas'], n),
    cupo: pick(['Regular', 'Especial'], n),
    tipo_ingreso: pick(['ordinario', 'ordinario', 'ordinario', 'especial indigena'], n),
    opcion_ingreso: pick(['primera opcion', 'segunda opcion'], n + 1),
    clase_institucional: 'Pregrado',
    puntaje_saber_11: saber,
    puntaje_saber_matematica: 40 + ((n * 11) % 60),
    puntaje_saber_lectura: 40 + ((n * 13) % 60),
    puntaje_saber_naturales: 40 + ((n * 17) % 60),
    consumo_sustancias: n % 5 === 0 ? 'SI' : 'NO',
    curso_precalculo: pick(['Aprobado', 'No aprobado', 'No aplica'], n),
    curso_prelectura: pick(['Aprobado', 'No aplica'], n + 1),
    estrato,
    valor_matricula: matricula,
    rango_valor_base_matricula: matricula < 2_000_000 ? '1 a 2 SMMLV' : '2 a 3 SMMLV',
    socioeconomico: pick(LEVELS, n),
    fecha_nacimiento: `0${1 + (n % 9)}/0${1 + (n % 8)}/${2026 - edad}`,
    edad,
    rango_edad: edad < 19 ? '16 a 18' : '19 a 21',
    codigo_municipio: '68001',
    nombre_municipio: pick(['Bucaramanga', 'Floridablanca', 'Piedecuesta'], n),
    nombre_departamento: 'Santander',
    lugar_procedencia: pick(['Área metropolitana', 'Otro municipio', 'Otro departamento'], n),
    riesgo_matematica: pick(['bajo', 'medio', 'alto'], n + 1),
    riesgo_cognitivo: pick(LEVELS, n + 2),
    riesgo_proceso_aprendizaje: pick(LEVELS, n),
    riesgo_psicosocial: pick(LEVELS, n + 1),
    promedio_ponderado_riesgo_psicosocial: (1 + (n % 30) / 10).toFixed(2),
    escala_de_ansiedad_zung: pick(LEVELS, n + 2),
    escala_zung_depresion: pick(LEVELS, n),
    apego_familiar: pick(['funcional', 'disfuncion familiar leve', 'disfuncion familiar severa'], n),
    cuidado_personal: pick(LEVELS, n + 1),
    satisfaccion_vida: pick(LEVELS, n + 2),
    assist: pick(LEVELS, n),
    audit: pick(LEVELS, n + 1),
    inventario_habitos: pick(LEVELS, n + 2),
  };
}

function toValue(def: Def, raw: Record<string, string | number>): VariableValue {
  const masked = !!def.sensitive && !MOCK_CAN_VIEW_WELLBEING;
  const v = raw[def.key];
  const text = masked ? 'Restringido' : v === undefined || v === '' ? '--' : def.type === 'MONEY' ? fmtMoney(Number(v)) : String(v);
  return {
    key: def.key, label: def.label, type: def.type, value: text,
    sensitive: !!def.sensitive, extra: !!def.extra, masked,
  };
}

/** ¿Cumple el término? (misma lógica que el backend: 1 × ponderador si cumple, 0 si no). */
function applies(t: RiskModel['terms'][number], raw: Record<string, string | number>): boolean {
  const v = raw[t.variable];
  if (t.kind === 'linear_score') return v !== undefined && v !== '';
  const [, op, ...rest] = t.rule.split(/\s+/);
  const target = norm(rest.join(' '));
  const num = Number(v);
  switch (op) {
    case '≥': return num >= Number(rest[0]);
    case '>': return num > Number(rest[0]);
    case '≠': return norm(v) !== target;
    default: return norm(v) === target;
  }
}

export function mockCalculation(
  s: StudentSummary,
  model: RiskModel = RISK_MODEL_MOCK,
  ranges: RiskRange[] = RISK_RANGES_MOCK,
): RiskCalculation {
  const raw = rawValues(s);
  const list: CalculationTerm[] = model.terms
    .filter((t) => t.active)
    .map((t) => {
      const def = DEFS.find((x) => x.key === t.variable);
      const masked = !!def?.sensitive && !MOCK_CAN_VIEW_WELLBEING;
      const ok = masked ? null : applies(t, raw);
      let contribution: number | null = null;
      if (ok !== null) {
        contribution =
          t.kind === 'linear_score'
            ? 1 + (1 - t.weight) * (100 - Number(raw[t.variable] ?? 0))
            : ok ? t.weight : 0;
      }
      return {
        code: t.code, label: t.label, variable: t.variable, variableLabel: t.variableLabel,
        dimension: t.dimension, kind: t.kind, group: t.group, rule: t.rule, weight: t.weight,
        value: raw[t.variable] === undefined ? '--' : String(raw[t.variable]),
        dataAvailable: raw[t.variable] !== undefined, applies: ok,
        contribution: contribution === null ? null : r2(contribution), masked,
      };
    });
  const sum = list.reduce((a, t) => a + (t.contribution ?? 0), 0);
  const rawIndex = sum / model.divisor;
  const index = r2(Math.min(1, Math.max(0, rawIndex)));
  const dimensions: CalculationDimension[] = (['academica', 'financiera', 'bienestar', 'sea'] as DimensionId[]).map((id) => {
    const own = list.filter((t) => t.dimension === id);
    const hasTerms = model.terms.some((t) => t.active && t.dimension === id);
    const dsum = own.reduce((a, t) => a + (t.contribution ?? 0), 0);
    const idx = hasTerms ? r2(Math.min(1, Math.max(0, dsum / model.divisor))) : null;
    return { id, title: TITLES[id], index: idx, level: idx === null ? null : levelFor(idx, ranges) };
  });
  return {
    sum: r2(sum), divisor: model.divisor, rawIndex, index, level: levelFor(index, ranges),
    alarmThreshold: ranges[ranges.length - 2].max, terms: list, dimensions,
    hasMasked: list.some((t) => t.masked),
  };
}

export function mockDashboard(
  s: StudentSummary,
  model: RiskModel = RISK_MODEL_MOCK,
  ranges: RiskRange[] = RISK_RANGES_MOCK,
): StudentDashboard {
  const raw = rawValues(s);
  const byKey = (k: string) => toValue(DEFS.find((x) => x.key === k)!, raw);
  const calc = mockCalculation(s, model, ranges);
  const dims = (Object.keys(TITLES) as DimensionId[]).map((id): DimensionCard => {
    const idx = calc.dimensions.find((x) => x.id === id)?.index ?? null;
    const defs = DEFS.filter((x) => x.dim === id);
    return {
      id, title: TITLES[id], index: idx, level: idx === null ? null : levelFor(idx, ranges),
      variableCount: defs.length,
      hasMasked: defs.some((x) => toValue(x, raw).masked),
      highlights: HIGHLIGHTS[id].map(byKey),
    };
  });
  return {
    student: {
      id: s.id, code: s.code, documentType: s.documentType, documentNumber: s.documentNumber,
      fullName: s.fullName, programName: s.programName,
      facultyName: String(raw['nombre_facultad']), academicLevel: 1 + (s.id % 10),
      phone: String(raw['telefono']), email: String(raw['direccion_electronica']),
      admissionDate: String(raw['fecha_ingreso']),
      birthDate: String(raw['fecha_nacimiento']), age: Number(raw['edad']),
    },
    risk: {
      index: calc.index, level: calc.level, alarmThreshold: calc.alarmThreshold,
      alarm: calc.index > calc.alarmThreshold, missingVariables: [],
    },
    summary: SUMMARY.map(byKey),
    dimensions: dims,
  };
}

export function mockDimension(
  s: StudentSummary,
  id: DimensionId,
  model: RiskModel = RISK_MODEL_MOCK,
  ranges: RiskRange[] = RISK_RANGES_MOCK,
): DimensionDetail {
  const raw = rawValues(s);
  const variables = DEFS.filter((x) => x.dim === id).map((x) => toValue(x, raw));
  const idx = mockCalculation(s, model, ranges).dimensions.find((x) => x.id === id)?.index ?? null;
  return {
    id, title: TITLES[id], index: idx, level: idx === null ? null : levelFor(idx, ranges),
    hasMasked: variables.some((v) => v.masked), variables,
  };
}

/** CSV con todas las variables (el backend entrega .xlsx real). */
export function mockExportCsv(students: StudentSummary[]): string {
  const head = ['Código', 'Nombre', 'Índice', 'Nivel', ...DEFS.map((x) => x.label)];
  const rows = students.map((s) => {
    const raw = rawValues(s);
    const c = mockCalculation(s);
    return [s.code, s.fullName, c.index, c.level, ...DEFS.map((x) => toValue(x, raw).value)];
  });
  return [head, ...rows].map((r) => r.join(';')).join('\n');
}
