import { RiskModel } from '../models/risk-model.model';

const TITLES: Record<string, string> = {
  identificacion: 'Identificación y contacto',
  academica: 'Información académica',
  bienestar: 'Información de bienestar',
  sea: 'Apoyo SEA',
};

/** Modelo de ejemplo para trabajar sin backend (el backend real lo lee de app.risk_model_term). */
export const RISK_MODEL_MOCK: RiskModel = {
  divisor: 30.26,
  theoreticalMax: 25.22,
  dimensions: [
    { id: 'academica', title: 'Información académica', max: 8.41 },
    { id: 'financiera', title: 'Información financiera', max: null },
    { id: 'bienestar', title: 'Información de bienestar', max: 6.36 },
    { id: 'sea', title: 'Apoyo SEA', max: 8.97 },
  ],
  terms: [
    ['fac_ciencias', 'Facultad de Ciencias', 'nombre_facultad', 'Facultad', 'academica', "nombre_facultad = ciencias", 'indicator', 'facultad', 2.49],
    ['fac_fisicomecanicas', 'Facultad de Ingenierías Fisicomecánicas', 'nombre_facultad', 'Facultad', 'academica', 'nombre_facultad = fisicomecanicas', 'indicator', 'facultad', 1.86],
    ['fac_fisicoquimicas', 'Facultad de Ingenierías Fisicoquímicas', 'nombre_facultad', 'Facultad', 'academica', 'nombre_facultad = fisicoquimicas', 'indicator', 'facultad', 2.64],
    ['segunda_opcion', 'Ingresó por segunda opción', 'opcion_ingreso', 'Opción de ingreso', 'academica', 'opcion_ingreso = segunda opcion', 'indicator', null, 1.5],
    ['admision_especial', 'Admisión especial', 'tipo_ingreso', 'Tipo de ingreso', 'academica', 'tipo_ingreso ≠ ordinario', 'indicator', null, 3.27],
    ['mayor_18', 'Mayor de edad (18 años o más)', 'edad', 'Edad al ingreso', 'identificacion', 'edad ≥ 18', 'indicator', null, 1.48],
    ['riesgo_mat_alto', 'Riesgo matemático alto', 'riesgo_matematica', 'Riesgo matemático', 'sea', 'riesgo_matematica = alto', 'indicator', null, 8.97],
    ['disfuncion_severa', 'Disfunción familiar severa', 'apego_familiar', 'Apego / funcionalidad familiar', 'bienestar', 'apego_familiar = disfuncion familiar severa', 'indicator', null, 2.27],
    ['consumo_sustancias', 'Consume sustancias (ASSIST o AUDIT)', 'consumo_sustancias', 'Consume sustancias (ASSIST o AUDIT)', 'bienestar', 'consumo_sustancias = SI', 'indicator', null, 4.09],
    ['saber_naturales', 'Saber 11 – ciencias naturales', 'puntaje_saber_naturales', 'Saber 11 – Ciencias naturales', 'academica', '1 + (1 − 1.03) × (100 − puntaje_saber_naturales)', 'linear_score', null, 1.03],
  ].map(([code, label, variable, variableLabel, dimension, rule, kind, group, weight]) => ({
    code, label, variable, variableLabel, dimension,
    dimensionTitle: TITLES[dimension as string],
    rule, kind, group, weight, active: true,
  })) as RiskModel['terms'],
};
