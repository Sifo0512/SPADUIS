/** Estudiante tal como lo devuelve la búsqueda del formulario. */
export interface StudentSummary {
  id: number;
  documentType: string; // "CC"
  documentNumber: string; // "100778238"
  fullName: string; // "Jorge Alejandro González"
  code: string; // "2248018"
  programName: string; // "Diseño Industrial"
}

/** Opción de una lista desplegable. `id` es el código que se envía al backend. */
export interface CatalogOption {
  id: string;
  name: string;
}

/**
 * BACK: listas de los desplegables. Si el backend las entrega por separado
 * (un endpoint por lista), se juntan en `getReportCatalogs()` con forkJoin.
 */
export interface ReportCatalogs {
  relations: CatalogOption[]; // Relación con el estudiante
  categories: CatalogOption[]; // Categoría de riesgo
  channels: CatalogOption[]; // Canal de recepción
  urgencies: CatalogOption[]; // Nivel de urgencia
}

/**
 * BACK: cuerpo del POST al guardar. Confirma con backend los nombres de los
 * campos y si esperan el `id` del catálogo o el nombre.
 */
export interface CreateReportPayload {
  studentId: number;
  reporterName: string;
  relationId: string;
  categoryId: string;
  channelId: string;
  urgencyId: string;
  description: string;
}

export interface CreateReportResponse {
  id: number;
}
