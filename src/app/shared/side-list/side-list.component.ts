import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { IconComponent } from '../icon/icon.component';
import { SearchInputComponent } from '../search-input/search-input.component';

export interface SideListItem {
  id: string;
  label: string;
}

/**
 * Panel izquierdo genérico: botón de colapsar + título + buscador + lista de opciones.
 * (Es la versión sin contadores del panel de programas académicos.)
 *
 * LIB (cada pieza por separado):
 *   - botón de colapsar  -> icon-button
 *   - buscador           -> <app-search-input> (ya es un reemplazo en sí)
 *   - lista de opciones  -> list / menu / nav-list con ítem "seleccionado"
 * Si la librería trae un componente "sidebar" completo, úsalo y borra este.
 */
@Component({
  selector: 'app-side-list',
  imports: [IconComponent, SearchInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="toggle"
      [attr.aria-label]="collapsed() ? 'Expandir panel' : 'Colapsar panel'"
      [attr.aria-expanded]="!collapsed()"
      (click)="toggleCollapse.emit()"
    >
      <app-icon [name]="collapsed() ? 'menu' : 'menu-open'" />
    </button>

    @if (!collapsed()) {
      <h3>{{ title() }}</h3>

      <app-search-input [placeholder]="searchPlaceholder()" (valueChange)="term.set($event)" />

      <ul class="list">
        @for (item of filtered(); track item.id) {
          <li>
            <button
              type="button"
              class="item"
              [class.active]="item.id === selectedId()"
              [attr.aria-current]="item.id === selectedId() ? 'true' : null"
              (click)="itemSelect.emit(item)"
            >
              {{ item.label }}
            </button>
          </li>
        } @empty {
          <li class="empty">Sin resultados</li>
        }
      </ul>
    }
  `,
  styleUrl: './side-list.component.scss',
})
export class SideListComponent {
  readonly title = input.required<string>();
  readonly items = input.required<SideListItem[]>();
  readonly selectedId = input<string | null>(null);
  readonly collapsed = input(false);
  readonly searchPlaceholder = input('Buscar registros');

  readonly itemSelect = output<SideListItem>();
  readonly toggleCollapse = output<void>();

  protected readonly term = signal('');
  protected readonly filtered = computed(() => {
    const t = this.term().trim().toLowerCase();
    return this.items().filter((i) => i.label.toLowerCase().includes(t));
  });
}
