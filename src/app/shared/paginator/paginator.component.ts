import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { IconComponent } from '../icon/icon.component';

export interface PageChange {
  /** Base 0. */
  page: number;
  size: number;
}

let nextPaginatorId = 0;

/**
 * Paginador: "Registros por página: [25] 1-5 de 10  < >".
 *
 * LIB: viene incluido en <app-mat-table-full> (no hay que reemplazarlo aparte).
 *      Si se usa una tabla de la librería sin paginador, buscar paginator / pagination.
 *      Opciones de tamaño: input `pageSizeOptions` de mat-table-full ([5, 10, 25, 100] por defecto).
 */
@Component({
  selector: 'app-paginator',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label [attr.for]="selectId">Registros por página:</label>
    <span class="select-box">
      <select [id]="selectId" (change)="onSizeChange($event)">
        @for (opt of pageSizeOptions(); track opt) {
          <option [value]="opt" [selected]="opt === pageSize()">{{ opt }}</option>
        }
      </select>
      <app-icon name="chevron-down" style="--icon-size: 16px" />
    </span>

    <span class="range">{{ from() }}-{{ to() }} de {{ total() }}</span>

    <button type="button" class="nav" aria-label="Página anterior" [disabled]="!hasPrev()" (click)="go(-1)">
      <app-icon name="chevron-left" />
    </button>
    <button type="button" class="nav" aria-label="Página siguiente" [disabled]="!hasNext()" (click)="go(1)">
      <app-icon name="chevron-right" />
    </button>
  `,
  styleUrl: './paginator.component.scss',
})
export class PaginatorComponent {
  readonly total = input(0);
  readonly page = input(0);
  readonly pageSize = input(5);
  readonly pageSizeOptions = input<number[]>([5, 10, 25, 100]);

  readonly pageChange = output<PageChange>();

  /** Id único por instancia, para unir la etiqueta con su select. */
  protected readonly selectId = `paginator-size-${nextPaginatorId++}`;

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
