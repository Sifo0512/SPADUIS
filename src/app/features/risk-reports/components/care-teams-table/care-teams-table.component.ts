import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { IconComponent } from '../../../../shared/icon/icon.component';
import { PageChange, PaginatorComponent } from '../../../../shared/paginator/paginator.component';
import { CareTeam } from '../../models/care-team.model';

/** "2026-02-15" -> "15/02/2026". Se parte el texto (sin Date) para evitar corrimientos de zona horaria. */
function formatDate(iso: string | null): string {
  if (!iso) return '--';
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * ============================================================================
 *  LIB: ESTE COMPONENTE COMPLETO SE REEMPLAZA POR  <app-mat-table-full>
 *       import { MatTableFullModule } from '@uis/uis-lib/components/mat-table-full';
 * ============================================================================
 *
 *  Equivalencias con lo que hay aquí:
 *
 *   Aquí                                  mat-table-full
 *   ------------------------------------  ------------------------------------
 *   <table> + columnas                    [options]  (MatTableFullOptions)
 *   botón lápiz  (edit)                   @Output() edit
 *   botón papelera (remove)               @Output() delete
 *   <app-paginator>                       viene incluido en la tabla
 *   formatDate()                          defaultFormatDate / formato de la columna de fecha
 *   texto "--" si no hay fecha            valor por defecto de la columna
 *
 *  BACK: mat-table-full parece poder pedir los datos por sí sola; si su
 *  `options` acepta un endpoint, el servicio (getCareTeams) y la paginación
 *  manual sobran. Si no, se le pasan los datos desde la página como aquí.
 *
 *  Igual que en la tabla de estudiantes: sin casillas de selección ni filas
 *  expandibles (el mockup no las tiene).
 */
@Component({
  selector: 'app-care-teams-table',
  imports: [IconComponent, PaginatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './care-teams-table.component.html',
  styleUrl: './care-teams-table.component.scss',
})
export class CareTeamsTableComponent {
  readonly rows = input.required<CareTeam[]>();
  readonly total = input(0);
  readonly page = input(0);
  readonly pageSize = input(5);
  readonly pageSizeOptions = input<number[]>([5, 10, 25, 100]);
  readonly loading = input(false);

  readonly pageChange = output<PageChange>();
  /** Botón del lápiz. */
  readonly edit = output<CareTeam>();
  /** Botón de la papelera (se llama `remove` porque `delete` es palabra reservada). */
  readonly remove = output<CareTeam>();

  protected readonly formatDate = formatDate;
}
