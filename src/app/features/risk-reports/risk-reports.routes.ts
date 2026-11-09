import { Routes } from '@angular/router';

/**
 * Rutas internas del módulo (relativas: no incluyen el prefijo).
 * El router principal las cuelga de una sola ruta con `loadChildren`
 * (ver guía de migración). Las guardas / roles se ponen en esa ruta padre.
 */
export const RISK_REPORTS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./risk-reports.component').then((m) => m.RiskReportsComponent),
  },
  {
    path: 'crear',
    loadComponent: () => import('./create-report/create-report.component').then((m) => m.CreateReportComponent),
  },
  {
    path: 'parametros',
    loadComponent: () => import('./parameters/parameters.component').then((m) => m.ParametersComponent),
  },
  {
    path: 'alertas',
    loadComponent: () => import('./alerts/alerts.component').then((m) => m.AlertsComponent),
  },
  {
    path: 'alertas/:id',
    loadComponent: () => import('./alert-detail/alert-detail.component').then((m) => m.AlertDetailComponent),
  },
  {
    path: 'estudiante',
    loadComponent: () =>
      import('./student-dashboard/student-dashboard.component').then((m) => m.StudentDashboardComponent),
  },
  {
    path: 'estudiante/:id',
    loadComponent: () =>
      import('./student-dashboard/student-dashboard.component').then((m) => m.StudentDashboardComponent),
  },
];
