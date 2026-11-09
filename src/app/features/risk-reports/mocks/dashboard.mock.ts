import {
  CalculationTerm,
  DimensionCard,
  DimensionDetail,
  DimensionId,
  RiskCalculation,
  StudentDashboard,
  VariableValue,
} from '../models/dashboard.model';
import { StudentSummary } from '../models/create-report.model';

/**
 * Datos de prueba del dashboard (solo con `useMock: true`).
 * Los valores salen del id del estudiante, así que son estables entre recargas.
 * Simula lo que hace el backend, pero NO es el modelo real.
 */
interface Def {
  key: string;
  label: string;
  dim: DimensionId;
  type: string;
  derived?: boolean;
  sensitive?: boolean;
  extra?: boolean;
}

const d = (key: string, label: string, dim: DimensionId, type = 'TEXT', o: Partial<Def> = {}): Def => ({
  key, label, dim, type, ...o,
});

const DEFS: Def[] = [
  d('codigo_estudiante', 'Código estudiante', 'identificacion'),
  d('tipo_documento', 'Tipo de documento', 'identificacion'),
  d('documento_identidad', 'Documento de identidad', 'identificacion'),
  d('nombre', 'Nombre completo', 'identificacion'),
  d('direccion_electronica', 'Correo electrónico', 'identificacion'),
  d('telefono', 'Teléfono de contacto', 'identificacion'),
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
  d('curso_precalculo', 'Curso de precálculo', 'academica'),
  d('curso_prelectura', 'Curso de prelectura', 'academica'),

  d('estrato', 'Estrato socioeconómico', 'financiera', 'INTEGER'),
  d('valor_matricula', 'Valor de matrícula', 'financiera', 'MONEY'),
  d('rango_valor_base_matricula', 'Rango de valor de matrícula', 'financiera', 'TEXT', { derived: true }),
  d('socioeconomico', 'Riesgo socioeconómico', 'financiera', 'TEXT', { sensitive: true }),

  d('fecha_nacimiento', 'Fecha de nacimiento', 'bienestar', 'DATE'),
  d('edad', 'Edad al ingreso', 'bienestar', 'INTEGER', { derived: true }),
  d('rango_edad', 'Rango de edad', 'bienestar', 'TEXT', { derived: true }),
  d('codigo_municipio', 'Código de municipio (DANE)', 'bienestar'),
  d('nombre_municipio', 'Municipio', 'bienestar'),
  d('nombre_departamento', 'Departamento', 'bienestar'),
  d('lugar_procedencia', 'Lugar de procedencia', 'bienestar', 'TEXT', { derived: true }),
  d('riesgo_matematica', 'Riesgo matemático', 'bienestar', 'TEXT', { sensitive: true }),
  d('riesgo_cognitivo', 'Riesgo cognitivo', 'bienestar', 'TEXT', { sensitive: true }),
  d('riesgo_proceso_aprendizaje', 'Riesgo en proceso de aprendizaje', 'bienestar', 'TEXT', { sensitive: true }),
  d('riesgo_psicosocial', 'Riesgo psicosocial', 'bienestar', 'TEXT', { sensitive: true }),
  d('promedio_ponderado_riesgo_psicosocial', 'Promedio ponderado de riesgo psicosocial', 'bienestar', 'DECIMAL', { sensitive: true }),
  d('escala_de_ansiedad_zung', 'Escala de ansiedad de Zung', 'bienestar', 'TEXT', { sensitive: true }),
  d('escala_zung_depresion', 'Escala de depresión de Zung', 'bienestar', 'TEXT', { sensitive: true }),
  d('apego_familiar', 'Apego / funcionalidad familiar', 'bienestar', 'TEXT', { sensitive: true }),
  d('cuidado_personal', 'Cuidado personal', 'bienestar', 'TEXT', { sensitive: true }),
  d('satisfaccion_vida', 'Satisfacción con la vida', 'bienestar', 'TEXT', { sensitive: true }),
  d('assist', 'ASSIST (sustancias psicoactivas)', 'bienestar', 'TEXT', { sensitive: true }),
  d('audit', 'AUDIT (alcohol)', 'bienestar', 'TEXT', { sensitive: true }),
  d('inventario_habitos', 'Inventario de hábitos', 'bienestar', 'TEXT', { sensitive: true }),
];

const TITLES: Record<DimensionId, string> = {
  identificacion: 'Identificación y contacto',
  academica: 'Información académica',
  financiera: 'Información financiera',
  bienestar: 'Información de bienestar',
};

const HIGHLIGHTS: Record<DimensionId, string[]> = {
  identificacion: [],
  academica: ['nombre_facultad', 'tipo_ingreso', 'opcion_ingreso', 'puntaje_saber_11'],
  financiera: ['estrato', 'valor_matricula', 'rango_valor_base_matricula', 'socioeconomico'],
  bienestar: ['edad', 'lugar_procedencia', 'apego_familiar', 'riesgo_psicosocial'],
};
const SUMMARY = ['puntaje_saber_11', 'estrato', 'edad', 'valor_matricula'];

const LEVELS = ['Bajo', 'Medio', 'Alto'];
const pick = <T>(arr: T[], n: number): T => arr[n % arr.length];
const levelFor = (i: number): string => (i >= 0.75 ? 'Muy alto' : i >= 0.5 ? 'Alto' : i >= 0.25 ? 'Medio' : 'Bajo');
const fmtMoney = (n: number): string => n.toLocaleString('es-CO');
const r2 = (n: number): number => Math.round(n * 100) / 100;
const sig = (x: number): number => 1 / (1 + Math.exp(-x));

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
    nombre_facultad: 'Facultad de Ingenierías Fisicomecánicas',
    cupo: pick(['Regular', 'Especial'], n),
    tipo_ingreso: pick(['Nuevo', 'Transferencia', 'Reintegro'], n),
    opcion_ingreso: pick(['Primera opción', 'Segunda opción'], n + 1),
    clase_institucional: 'Pregrado',
    puntaje_saber_11: saber,
    puntaje_saber_matematica: 40 + ((n * 11) % 60),
    puntaje_saber_lectura: 40 + ((n * 13) % 60),
    puntaje_saber_naturales: 40 + ((n * 17) % 60),
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
    riesgo_matematica: pick(LEVELS, n + 1),
    riesgo_cognitivo: pick(LEVELS, n + 2),
    riesgo_proceso_aprendizaje: pick(LEVELS, n),
    riesgo_psicosocial: pick(LEVELS, n + 1),
    promedio_ponderado_riesgo_psicosocial: (1 + (n % 30) / 10).toFixed(2),
    escala_de_ansiedad_zung: pick(LEVELS, n + 2),
    escala_zung_depresion: pick(LEVELS, n),
    apego_familiar: pick(['Funcional', 'Disfunción leve', 'Disfunción moderada'], n),
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
    derived: !!def.derived, sensitive: !!def.sensitive, extra: !!def.extra, masked,
  };
}

/** Términos de ejemplo con todas las variables del sistema y sus ponderadores institucionales. */
function terms(raw: Record<string, string | number>): { list: CalculationTerm[]; sumScore: number } {
  // Matriz completa de factores evaluados institucionalmente con sus ponderadores (OR o pesos)
  const factors: [string, string, string, number, (r: Record<string, string | number>) => boolean, string][] = [
    // Dimensión Académica
    ['fac_mecanica', 'nombre_facultad', 'Fac Fis Mecán', 1.86, (r) => String(r['nombre_facultad']).includes('Mecán'), 'Facultad mecánica'],
    ['ingreso_especial', 'tipo_ingreso', 'Ingreso especial / Indígena', 3.27, (r) => String(r['tipo_ingreso']).includes('Transferencia') || String(r['tipo_ingreso']).includes('Reintegro'), 'Tipo de ingreso especial'],
    ['saber_bajo', 'puntaje_saber_11', 'Saber 11 menor a 300', 1.90, (r) => Number(r['puntaje_saber_11']) < 300, 'puntaje < 300'],
    ['precalculo_no', 'curso_precalculo', 'Precálculo No Aprobado', 2.10, (r) => r['curso_precalculo'] === 'No aprobado', 'Curso no aprobado'],

    // Dimensión Financiera
    ['estrato_bajo', 'estrato', 'Estrato 1 o 2', 2.49, (r) => Number(r['estrato']) <= 2, 'estrato ≤ 2'],
    ['matricula_alta', 'valor_matricula', 'Matrícula superior a 2M', 1.50, (r) => Number(r['valor_matricula']) > 2_000_000, 'valor > 2.000.000'],

    // Dimensión Bienestar / Psicosocial / Edad
    ['edad_mayor', 'edad', 'Mayor de edad (≥ 21)', 1.48, (r) => Number(r['edad']) >= 21, 'edad ≥ 21'],
    ['procedencia_externa', 'lugar_procedencia', 'Procede de otro departamento', 1.50, (r) => r['lugar_procedencia'] === 'Otro departamento', "igual a 'Otro departamento'"],
    ['matematica_alto', 'riesgo_matematica', 'Riesgo Matemático Alto', 8.97, (r) => r['riesgo_matematica'] === 'Alto', 'Riesgo matemático alto'],
    ['cognitivo_alto', 'riesgo_cognitivo', 'Riesgo Cognitivo Alto', 4.50, (r) => r['riesgo_cognitivo'] === 'Alto', 'Riesgo cognitivo alto'],
    ['disfuncion_familiar', 'apego_familiar', 'Disfunción familiar severa/moderada', 2.27, (r) => String(r['apego_familiar']).startsWith('Disfunción'), "empieza con 'Disfunción'"],
    
    // Consumo de sustancias y salud mental (Variables sensibles / ASSIST / AUDIT / Zung)
    ['riesgo_psicosocial_alto', 'riesgo_psicosocial', 'Riesgo Psicosocial Alto', 3.50, (r) => r['riesgo_psicosocial'] === 'Alto', 'Riesgo psicosocial alto'],
    ['ansiedad_zung', 'escala_de_ansiedad_zung', 'Ansiedad Zung Alta', 3.10, (r) => r['escala_de_ansiedad_zung'] === 'Alto', 'Ansiedad Zung alta'],
    ['depresion_zung', 'escala_zung_depresion', 'Depresión Zung Alta', 3.30, (r) => r['escala_zung_depresion'] === 'Alto', 'Depresión Zung alta'],
    ['consumo_assist', 'assist', 'Riesgo ASSIST (Sustancias)', 4.09, (r) => r['assist'] === 'Alto', 'ASSIST alto'],
    ['consumo_audit', 'audit', 'Riesgo AUDIT (Alcohol)', 3.80, (r) => r['audit'] === 'Alto', 'AUDIT alto'],
  ];

  let sumScore = 0;
  const list = factors.map(([code, variable, text, weight, test, rule]) => {
    const def = DEFS.find((x) => x.key === variable)!;
    const masked = !!def.sensitive && !MOCK_CAN_VIEW_WELLBEING;
    // Si la variable está enmascarada, no suma puntaje de riesgo para proteger la privacidad
    const applies = masked ? false : test(raw);
    
    if (applies) {
      sumScore += weight;
    }

    const value = toValue(def, raw).value;
    return {
      code, label: text, variable, variableLabel: def?.label ?? variable, dimension: def?.dim ?? 'academica', rule,
      oddsRatio: weight, coefficient: weight, value, dataAvailable: true,
      applies, contribution: applies ? weight : 0, masked,
    };
  });

  return { list, sumScore };
}

export function mockCalculation(s: StudentSummary): RiskCalculation {
  const raw = rawValues(s);
  const { list, sumScore } = terms(raw);
  
  // Aplicamos la constante oficial de normalización institucional (30.26)
  const rawIndex = Math.min(sumScore / 30.26, 1.0); 
  const index = r2(rawIndex);
  
  return {
    intercept: 0, 
    interceptCalibrated: true, 
    logit: r2(sumScore), 
    rawIndex, 
    index,
    level: levelFor(index), 
    alarmThreshold: 0.6, 
    terms: list,
    hasMasked: list.some((t) => t.masked),
  };
}


function dimensionIndex(dim: DimensionId, raw: Record<string, string | number>): number | null {
  if (dim === 'identificacion') return null;
  const { list } = terms(raw);
  const own = list.filter((t) => t.dimension === dim);
  const logit = -2.2 + own.reduce((a, t) => a + (t.contribution ?? 0), 0);
  return r2(sig(logit));
}

export function mockDashboard(s: StudentSummary): StudentDashboard {
  const raw = rawValues(s);
  const byKey = (k: string) => toValue(DEFS.find((x) => x.key === k)!, raw);
  const calc = mockCalculation(s);
  const dims = (Object.keys(TITLES) as DimensionId[]).map((id): DimensionCard => {
    const idx = dimensionIndex(id, raw);
    const defs = DEFS.filter((x) => x.dim === id);
    return {
      id, title: TITLES[id], index: idx, level: idx === null ? null : levelFor(idx),
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
    },
    risk: {
      index: calc.index, level: calc.level, alarmThreshold: 0.6, alarm: calc.index > 0.6,
      interceptCalibrated: true, missingVariables: [],
    },
    summary: SUMMARY.map(byKey),
    dimensions: dims,
  };
}

export function mockDimension(s: StudentSummary, id: DimensionId): DimensionDetail {
  const raw = rawValues(s);
  const variables = DEFS.filter((x) => x.dim === id).map((x) => toValue(x, raw));
  const idx = dimensionIndex(id, raw);
  return {
    id, title: TITLES[id], index: idx, level: idx === null ? null : levelFor(idx),
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
