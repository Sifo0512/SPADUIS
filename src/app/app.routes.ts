import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'reportes-desercion' },
  {
    path: 'reportes-desercion',
    loadChildren: () =>
      import('./features/risk-reports/risk-reports.routes').then((m) => m.RISK_REPORTS_ROUTES),
  },
];
