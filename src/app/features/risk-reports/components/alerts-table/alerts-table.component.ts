import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { PageChange, PaginatorComponent } from '../../../../shared/paginator/paginator.component';
import { Alert } from '../../models/alert.model';
import { RiskTagComponent } from '../risk-tag/risk-tag.component';

/** "2024-05-02T10:00:00" -> { day: "02/05/2024", time: "10:00 a.m." }. Se parte el texto para evitar zonas horarias. */
function splitDate(iso: string): { day: string; time: string } {
  const [date, time = '00:00:00'] = iso.split('T');
  const [year, month, day] = date.split('-');
  const [h, m] = time.split(':').map(Number);
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return {
    day: `${day}/${month}/${year}`,
    time: `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h < 12 ? 'a.m.' : 'p.m.'}`,
  };
}

/**
 * ============================================================================
 *  LIB: ESTE COMPONENTE COMPLETO SE REEMPLAZA POR  <app-mat-table-full>
 *       import { MatTableFullModule } from '@uis/uis-lib/components/mat-table-full';
 * ============================================================================
 *   Columnas: Estudiante ("código - nombre"), Nivel (tag), Tipo, Índice (número
 *   alineado a la derecha, 2 decimales), Fecha (día y hora en dos líneas).
 *   El clic en la fila equivale al @Output de selección de fila de la tabla
 *   (si no tiene, usar una columna de acción o una celda custom con enlace).
 *   El paginador viene incluido en la tabla.
 */
@Component({
  selector: 'app-alerts-table',
  imports: [DecimalPipe, PaginatorComponent, RiskTagComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './alerts-table.component.html',
  styleUrl: './alerts-table.component.scss',
})
export class AlertsTableComponent {
  readonly rows = input.required<Alert[]>();
  readonly total = input(0);
  readonly page = input(0);
  readonly pageSize = input(25);
  readonly pageSizeOptions = input<number[]>([5, 10, 25, 100]);
  readonly loading = input(false);

  readonly pageChange = output<PageChange>();
  /** Clic en una fila (o Enter / Espacio con el foco en ella). */
  readonly rowSelect = output<Alert>();

  protected readonly splitDate = splitDate;
}
