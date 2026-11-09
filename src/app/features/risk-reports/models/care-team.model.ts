/**
 * Equipo de atención (configuración de parámetros).
 * BACK: las fechas viajan como texto "yyyy-MM-dd" (sin hora), que es lo que entrega
 * el <input type="date">. Si el backend usa otro formato, convertir en el servicio.
 */
export interface CareTeam {
  id: number;
  name: string;
  validFrom: string; // "2026-02-15"
  validTo: string | null; // null = sin fecha de fin (se muestra "--")
}

/** Lo que se envía al crear o editar (sin id). */
export interface CareTeamPayload {
  name: string;
  validFrom: string;
  validTo: string | null;
}

export interface CareTeamsQuery {
  /** Base 0. */
  page: number;
  size: number;
  search: string;
}
