import { RiskLevel } from './student-risk.model';

/**
 * BACK: forma de la respuesta paginada.
 * `content` y `totalElements` son los nombres típicos de Spring Boot (Page<T>).
 * Confirma con el equipo de backend cómo responde realmente y ajusta aquí;
 * el resto de la app no tendría que cambiar.
 */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
}

/** Parámetros con los que se pide la lista de estudiantes. */
export interface StudentsQuery {
  programId: number;
  /** Base 0. */
  page: number;
  size: number;
  search: string;
  risk: RiskLevel | '';
  semester: string;
}
