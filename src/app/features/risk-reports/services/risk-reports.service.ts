import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, map, of, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { STUDENTS_BY_PROGRAM_MOCK } from '../mocks/students.mock';
import { PROGRAMS_MOCK } from '../mocks/programs.mock';
import { RISK_RANGES_MOCK } from '../mocks/risk-ranges.mock';
import { RiskRange } from '../models/risk-range.model';
import { CARE_TEAMS_MOCK } from '../mocks/care-teams.mock';
import { CareTeam, CareTeamPayload, CareTeamsQuery } from '../models/care-team.model';
import { ALERTS_MOCK } from '../mocks/alerts.mock';
import {
  Alert,
  AlertCounts,
  AlertDetail,
  AlertFilters,
  AlertStatus,
  AlertsQuery,
  InterventionPayload,
} from '../models/alert.model';
import { REPORT_CATALOGS_MOCK } from '../mocks/report-catalogs.mock';
import {
  CreateReportPayload,
  CreateReportResponse,
  ReportCatalogs,
  StudentSummary,
} from '../models/create-report.model';
import {
  mockCalculation,
  mockDashboard,
  mockDimension,
  mockExportCsv,
} from '../mocks/dashboard.mock';
import {
  DimensionDetail,
  DimensionId,
  ExportFile,
  RiskCalculation,
  StudentDashboard,
} from '../models/dashboard.model';
import { PageResponse, StudentsQuery } from '../models/page.model';
import { Program } from '../models/program.model';
import { StudentRisk } from '../models/student-risk.model';

/**
 * Único punto de contacto con el backend.
 *
 * BACK: cuando el backend esté listo:
 *   1. Pon `useMock: false` en environment.ts.
 *   2. Ajusta los endpoints marcados con "BACK" (rutas y nombres de parámetros).
 *   3. Si la respuesta no es { content, totalElements }, adáptala en `getStudents`
 *      con un `map(...)`, así el resto de la app no se entera.
 *
 * Los interceptores del proyecto real (token, manejo de errores, etc.) se
 * aplican solos porque usamos HttpClient.
 */
@Injectable({ providedIn: 'root' })
export class RiskReportsService {
  private readonly http = inject(HttpClient);

  // BACK: ruta base del módulo.
  private readonly baseUrl = `${environment.apiUrl}/risk-reports`;

  /** Lista de programas académicos (panel izquierdo). */
  getPrograms(): Observable<Program[]> {
    if (environment.useMock) {
      return of(PROGRAMS_MOCK).pipe(delay(300));
    }
    // BACK: GET /risk-reports/programs
    return this.http.get<Program[]>(`${this.baseUrl}/programs`);
  }

  /** Estudiantes de un programa, con paginación y filtros hechos en el servidor. */
  getStudents(q: StudentsQuery): Observable<PageResponse<StudentRisk>> {
    if (environment.useMock) {
      return of(this.mockPage(q)).pipe(delay(300));
    }

    // BACK: nombres de los query params (page, size, search, risk, semester).
    let params = new HttpParams().set('page', q.page).set('size', q.size);
    if (q.search) params = params.set('search', q.search);
    if (q.risk) params = params.set('risk', q.risk);
    if (q.semester) params = params.set('semester', q.semester);

    // BACK: GET /risk-reports/programs/{programId}/students
    return this.http.get<PageResponse<StudentRisk>>(
      `${this.baseUrl}/programs/${q.programId}/students`,
      { params },
    );
  }

  /**
   * Rangos del indicador por nivel de riesgo (panel de ayuda).
   * BACK: estos rangos probablemente se configuran en la pantalla "Parámetros",
   * así que conviene pedirlos al backend en vez de dejarlos fijos en el front.
   */
  getRiskRanges(): Observable<RiskRange[]> {
    if (environment.useMock) {
      return of(RISK_RANGES_MOCK).pipe(delay(300));
    }
    // BACK: GET /risk-reports/risk-ranges
    return this.http.get<RiskRange[]>(`${this.baseUrl}/risk-ranges`);
  }

  // ------------------------------------------------------------------
  //  Pantalla "Crear reporte por riesgo"
  // ------------------------------------------------------------------

  /** Listas de los desplegables del formulario. */
  getReportCatalogs(): Observable<ReportCatalogs> {
    if (environment.useMock) {
      return of(REPORT_CATALOGS_MOCK).pipe(delay(300));
    }
    // BACK: GET /risk-reports/catalogs  ->  { relations, categories, channels, urgencies }
    return this.http.get<ReportCatalogs>(`${this.baseUrl}/catalogs`);
  }

  /** Busca estudiantes por nombre, código o documento (autocompletado). */
  searchStudents(term: string): Observable<StudentSummary[]> {
    if (environment.useMock) {
      return of(this.mockSearchStudents(term)).pipe(delay(300));
    }
    // BACK: GET /risk-reports/students/search?term=...
    // Conviene que el backend limite el resultado (p. ej. 10 filas).
    const params = new HttpParams().set('term', term);
    return this.http.get<StudentSummary[]>(`${this.baseUrl}/students/search`, { params });
  }

  /** Un estudiante por id: se usa al llegar desde el icono "crear registro" de la tabla. */
  getStudentById(id: number): Observable<StudentSummary | null> {
    if (environment.useMock) {
      return of(this.mockAllStudents().find((s) => s.id === id) ?? null).pipe(delay(200));
    }
    // BACK: GET /risk-reports/students/{id}
    return this.http.get<StudentSummary>(`${this.baseUrl}/students/${id}`);
  }

  /** Guarda el reporte y lo deja en revisión del coordinador (botón "Guardar y enviar"). */
  createReport(payload: CreateReportPayload): Observable<CreateReportResponse> {
    if (environment.useMock) {
      return of({ id: Math.floor(Math.random() * 100000) }).pipe(delay(600));
    }
    // BACK: POST /risk-reports   (cuerpo = payload)
    return this.http.post<CreateReportResponse>(this.baseUrl, payload);
  }

  /** Mock: todos los estudiantes de todos los programas, en el formato de la búsqueda. */
  private mockAllStudents(): StudentSummary[] {
    return PROGRAMS_MOCK.flatMap((p) =>
      (STUDENTS_BY_PROGRAM_MOCK[p.id] ?? []).map((s) => ({
        id: s.id,
        documentType: s.documentType,
        documentNumber: s.documentNumber,
        fullName: s.fullName,
        code: s.code,
        programName: p.name,
      })),
    );
  }

  private mockSearchStudents(term: string): StudentSummary[] {
    const t = term.toLowerCase();
    return this.mockAllStudents()
      .filter((s) => s.fullName.toLowerCase().includes(t) || s.code.includes(t) || s.documentNumber.includes(t))
      .slice(0, 10);
  }

  // ------------------------------------------------------------------
  //  Pantalla "Configuración de parámetros" -> Equipos de atención
  // ------------------------------------------------------------------

  /** Copia en memoria para que crear / editar / eliminar funcione en modo mock. */
  private mockCareTeams: CareTeam[] = CARE_TEAMS_MOCK.map((t) => ({ ...t }));
  private nextMockTeamId = 100;

  /** Equipos de atención, con paginación y filtro hechos en el servidor. */
  getCareTeams(q: CareTeamsQuery): Observable<PageResponse<CareTeam>> {
    if (environment.useMock) {
      const term = q.search.toLowerCase();
      const rows = this.mockCareTeams.filter((t) => t.name.toLowerCase().includes(term));
      const start = q.page * q.size;
      return of({ content: rows.slice(start, start + q.size), totalElements: rows.length }).pipe(delay(300));
    }

    // BACK: nombres de los query params (page, size, search).
    let params = new HttpParams().set('page', q.page).set('size', q.size);
    if (q.search) params = params.set('search', q.search);

    // BACK: GET /risk-reports/config/care-teams
    return this.http.get<PageResponse<CareTeam>>(`${this.baseUrl}/config/care-teams`, { params });
  }

  createCareTeam(payload: CareTeamPayload): Observable<CareTeam> {
    if (environment.useMock) {
      if (this.mockTeamNameTaken(payload.name)) return throwError(() => ({ status: 409 }));
      const team: CareTeam = { id: this.nextMockTeamId++, ...payload };
      this.mockCareTeams.unshift(team);
      return of(team).pipe(delay(400));
    }
    // BACK: POST /risk-reports/config/care-teams  (se espera 409 si el nombre ya existe)
    return this.http.post<CareTeam>(`${this.baseUrl}/config/care-teams`, payload);
  }

  updateCareTeam(id: number, payload: CareTeamPayload): Observable<CareTeam> {
    if (environment.useMock) {
      const index = this.mockCareTeams.findIndex((t) => t.id === id);
      if (index < 0) return throwError(() => ({ status: 404 }));
      if (this.mockTeamNameTaken(payload.name, id)) return throwError(() => ({ status: 409 }));
      const team: CareTeam = { id, ...payload };
      this.mockCareTeams[index] = team;
      return of(team).pipe(delay(400));
    }
    // BACK: PUT /risk-reports/config/care-teams/{id}
    return this.http.put<CareTeam>(`${this.baseUrl}/config/care-teams/${id}`, payload);
  }

  deleteCareTeam(id: number): Observable<void> {
    if (environment.useMock) {
      this.mockCareTeams = this.mockCareTeams.filter((t) => t.id !== id);
      return of(undefined).pipe(delay(400));
    }
    // BACK: DELETE /risk-reports/config/care-teams/{id}
    return this.http.delete<void>(`${this.baseUrl}/config/care-teams/${id}`);
  }

  private mockTeamNameTaken(name: string, exceptId?: number): boolean {
    const n = name.trim().toLowerCase();
    return this.mockCareTeams.some((t) => t.id !== exceptId && t.name.toLowerCase() === n);
  }

  /** Archivo del reporte del programa seleccionado (botón "Descargar reporte"). */
  downloadReport(programId: number): Observable<Blob> {
    if (environment.useMock) {
      const csv = 'Estudiante;Código;Riesgo\n';
      return of(new Blob([csv], { type: 'text/csv' })).pipe(delay(300));
    }
    // BACK: GET /risk-reports/programs/{programId}/report  (xlsx, csv, pdf...)
    return this.http.get(`${this.baseUrl}/programs/${programId}/report`, {
      responseType: 'blob',
    });
  }

  // ------------------------------------------------------------------
  //  Pantalla "Gestionar alertas" y vista de intervención
  // ------------------------------------------------------------------

  /** Copia en memoria para que guardar / anular funcione en modo mock. */
  private mockAlerts: AlertDetail[] = ALERTS_MOCK.map((a) => ({ ...a }));

  /** Alertas de una pestaña, con paginación y filtros hechos en el servidor. */
  getAlerts(q: AlertsQuery): Observable<PageResponse<Alert>> {
    if (environment.useMock) {
      const rows = this.mockFilterAlerts(q, q.status);
      const start = q.page * q.size;
      return of({ content: rows.slice(start, start + q.size), totalElements: rows.length }).pipe(delay(300));
    }

    // BACK: nombres de los query params (status, page, size, search, date).
    let params = new HttpParams().set('status', q.status).set('page', q.page).set('size', q.size);
    if (q.search) params = params.set('search', q.search);
    if (q.date) params = params.set('date', q.date);

    // BACK: GET /risk-reports/alerts
    return this.http.get<PageResponse<Alert>>(`${this.baseUrl}/alerts`, { params });
  }

  /** Número que va en el círculo de cada pestaña (respeta el buscador y la fecha). */
  getAlertCounts(f: AlertFilters): Observable<AlertCounts> {
    if (environment.useMock) {
      const count = (status: AlertStatus) =>
        this.mockFilterAlerts(f, status).length;
      return of({
        ACTIVA: count('ACTIVA'),
        EN_ATENCION: count('EN_ATENCION'),
        ESCALADA: count('ESCALADA'),
        ATENDIDA: count('ATENDIDA'),
      }).pipe(delay(200));
    }

    let params = new HttpParams();
    if (f.search) params = params.set('search', f.search);
    if (f.date) params = params.set('date', f.date);

    // BACK: GET /risk-reports/alerts/counts  ->  { ACTIVA: 3, EN_ATENCION: 3, ESCALADA: 3, ATENDIDA: 3 }
    return this.http.get<AlertCounts>(`${this.baseUrl}/alerts/counts`, { params });
  }

  getAlertById(id: number): Observable<AlertDetail> {
    if (environment.useMock) {
      const found = this.mockAlerts.find((a) => a.id === id);
      return (found ? of({ ...found }) : throwError(() => ({ status: 404 }))).pipe(delay(300));
    }
    // BACK: GET /risk-reports/alerts/{id}
    return this.http.get<AlertDetail>(`${this.baseUrl}/alerts/${id}`);
  }

  /** Guarda la intervención y cambia el estado de la alerta al "estado resultante". */
  saveIntervention(id: number, payload: InterventionPayload): Observable<AlertDetail> {
    if (environment.useMock) {
      const index = this.mockAlerts.findIndex((a) => a.id === id);
      if (index < 0) return throwError(() => ({ status: 404 }));
      const updated: AlertDetail = {
        ...this.mockAlerts[index],
        status: payload.resultStatus,
        resultStatus: payload.resultStatus,
        notes: payload.notes,
      };
      this.mockAlerts[index] = updated;
      return of({ ...updated }).pipe(delay(400));
    }
    // BACK: POST /risk-reports/alerts/{id}/intervention
    return this.http.post<AlertDetail>(`${this.baseUrl}/alerts/${id}/intervention`, payload);
  }

  /** Anula el reporte: la alerta deja de aparecer en la gestión. */
  cancelAlert(id: number): Observable<void> {
    if (environment.useMock) {
      this.mockAlerts = this.mockAlerts.filter((a) => a.id !== id);
      return of(undefined).pipe(delay(400));
    }
    // BACK: POST /risk-reports/alerts/{id}/cancel  (o DELETE; confirmar con backend)
    return this.http.post<void>(`${this.baseUrl}/alerts/${id}/cancel`, {});
  }

  private mockFilterAlerts(q: AlertFilters, status: AlertStatus): AlertDetail[] {
    const term = q.search.toLowerCase();
    return this.mockAlerts.filter(
      (a) =>
        a.status === status &&
        (!term || a.studentName.toLowerCase().includes(term) || a.studentCode.includes(term)) &&
        (!q.date || a.date.startsWith(q.date)),
    );
  }

  /** Simula lo que haría el backend: filtrar y paginar. Se borra al conectar. */
  private mockPage(q: StudentsQuery): PageResponse<StudentRisk> {
    let rows = [...(STUDENTS_BY_PROGRAM_MOCK[q.programId] ?? [])];

    if (q.search) {
      const s = q.search.toLowerCase();
      rows = rows.filter(
        (r) => r.fullName.toLowerCase().includes(s) || r.code.includes(s) || r.documentNumber.includes(s),
      );
    }
    if (q.risk) rows = rows.filter((r) => r.risk === q.risk);
    if (q.semester) rows = rows.filter((r) => String(r.semester) === q.semester);

    const start = q.page * q.size;
    return { content: rows.slice(start, start + q.size), totalElements: rows.length };
  }

  // ------------------------------------------------------------------
  //  Dashboard del estudiante ("Riesgo de deserción")
  // ------------------------------------------------------------------

  /** Cabecera, índice de riesgo, resumen y tarjetas por dimensión. */
  getStudentDashboard(id: number): Observable<StudentDashboard> {
    if (environment.useMock) {
      const s = this.mockAllStudents().find((x) => x.id === id);
      return s ? of(mockDashboard(s)).pipe(delay(300)) : throwError(() => new Error('404'));
    }
    // BACK: GET /risk-reports/students/{id}/dashboard
    return this.http.get<StudentDashboard>(`${this.baseUrl}/students/${id}/dashboard`);
  }

  /** Todas las variables de una dimensión. */
  getDimensionDetail(id: number, dimension: DimensionId): Observable<DimensionDetail> {
    if (environment.useMock) {
      const s = this.mockAllStudents().find((x) => x.id === id);
      return s ? of(mockDimension(s, dimension)).pipe(delay(200)) : throwError(() => new Error('404'));
    }
    // BACK: GET /risk-reports/students/{id}/dimensions/{dimension}
    return this.http.get<DimensionDetail>(`${this.baseUrl}/students/${id}/dimensions/${dimension}`);
  }

  /** Desglose del cálculo del índice (término por término). */
  getRiskCalculation(id: number): Observable<RiskCalculation> {
    if (environment.useMock) {
      const s = this.mockAllStudents().find((x) => x.id === id);
      return s ? of(mockCalculation(s)).pipe(delay(200)) : throwError(() => new Error('404'));
    }
    // BACK: GET /risk-reports/students/{id}/risk-calculation
    return this.http.get<RiskCalculation>(`${this.baseUrl}/students/${id}/risk-calculation`);
  }

  /**
   * Excel con todas las variables. Con `studentId` = un estudiante; sin él = todos
   * (opcionalmente de un programa).
   */
  downloadVariablesExcel(opts: { studentId?: number; programId?: number } = {}): Observable<ExportFile> {
    if (environment.useMock) {
      const all = this.mockAllStudents();
      const list = opts.studentId ? all.filter((x) => x.id === opts.studentId) : all;
      const blob = new Blob(['\ufeff' + mockExportCsv(list)], { type: 'text/csv;charset=utf-8' });
      return of({ blob, filename: 'variables-desercion.csv' }).pipe(delay(300));
    }
    // BACK: GET /risk-reports/students/{id}/export   |   GET /risk-reports/variables/export?programId=
    const url = opts.studentId
      ? `${this.baseUrl}/students/${opts.studentId}/export`
      : `${this.baseUrl}/variables/export`;
    let params = new HttpParams();
    if (!opts.studentId && opts.programId) params = params.set('programId', opts.programId);
    return this.http.get(url, { params, responseType: 'blob', observe: 'response' }).pipe(
      map((res) => {
        const cd = res.headers.get('Content-Disposition') ?? '';
        const m = /filename="?([^";]+)"?/.exec(cd);
        return { blob: res.body as Blob, filename: m?.[1] ?? 'variables-desercion.xlsx' };
      }),
    );
  }
}
