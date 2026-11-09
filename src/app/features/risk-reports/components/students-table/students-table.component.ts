import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { IconComponent } from '../../../../shared/icon/icon.component';
import { StudentRisk } from '../../models/student-risk.model';
import { RiskTagComponent } from '../risk-tag/risk-tag.component';

export interface PageChange {
  /** Base 0. */
  page: number;
  size: number;
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
 *   <table> + columnas                    [options]  (columnas dentro de MatTableFullOptions)
 *   botón "ojo"  (view)                   @Output() view
 *   botón "doc +" (createRecord)          @Output() add
 *   [pageSizeOptions]                     @Input()  pageSizeOptions  ([5,10,25,100] por defecto)
 *   paginador (Registros por página)      viene incluido en la tabla
 *   estado "sin datos"                    @Output() emptyContent
 *   estado "error"                        @Output() errorLoadData
 *   <app-risk-tag> en la columna riesgo   celda personalizada (matCellCustom) o la
 *                                         opción de la columna tipo "tag/chip" si existe
 *
 *  BACK: mat-table-full parece poder pedir los datos por sí sola (tiene
 *  destroyHttpRequests$, subscriptionLoadDataPaginada, headers...). Hay que
 *  revisar en `MatTableFullOptions` si acepta una URL/endpoint: en ese caso el
 *  servicio y la paginación manual de aquí sobran. Si no, se le pasan los datos
 *  desde el componente padre exactamente como se hace aquí.
 *
 *  En el mockup NO se ven casillas de selección ni filas expandibles:
 *  hay que desactivarlas en `options` (general.checkeable / rows.expandable).
 */
@Component({
  selector: 'app-students-table',
  imports: [IconComponent, RiskTagComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './students-table.component.html',
  styleUrl: './students-table.component.scss',
})
export class StudentsTableComponent {
  readonly rows = input.required<StudentRisk[]>();
  readonly total = input(0);
  readonly page = input(0);
  readonly pageSize = input(5);
  readonly pageSizeOptions = input<number[]>([5, 10, 25, 100]);
  readonly loading = input(false);

  readonly pageChange = output<PageChange>();
  /** Botón del ojo. */
  readonly view = output<StudentRisk>();
  /** Botón de documento con "+". */
  readonly createRecord = output<StudentRisk>();

  protected readonly from = computed(() => (this.total() === 0 ? 0 : this.page() * this.pageSize() + 1));
  protected readonly to = computed(() => Math.min((this.page() + 1) * this.pageSize(), this.total()));
  protected readonly hasPrev = computed(() => this.page() > 0);
  protected readonly hasNext = computed(() => this.to() < this.total());

  protected onSizeChange(event: Event): void {
    const size = Number((event.target as HTMLSelectElement).value);
    // Al cambiar el tamaño se vuelve a la primera página.
    this.pageChange.emit({ page: 0, size });
  }

  protected go(delta: number): void {
    this.pageChange.emit({ page: this.page() + delta, size: this.pageSize() });
  }
}
