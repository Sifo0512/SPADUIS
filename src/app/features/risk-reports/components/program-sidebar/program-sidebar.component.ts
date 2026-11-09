import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { IconComponent } from '../../../../shared/icon/icon.component';
import { SearchInputComponent } from '../../../../shared/search-input/search-input.component';
import { Program } from '../../models/program.model';

/**
 * Panel izquierdo: botón de colapsar + título + buscador + lista de programas.
 *
 * LIB (cada pieza por separado):
 *   - botón de colapsar     -> icon-button
 *   - buscador              -> <app-search-input> (ya es un reemplazo en sí)
 *   - lista de programas    -> list / menu / nav-list con ítem "seleccionado"
 *   - círculo con número    -> badge / counter / chip pequeño
 * Si la librería trae un componente "sidebar" completo, úsalo y borra este.
 */
@Component({
  selector: 'app-program-sidebar',
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
      <h3>Listado de programas académicos</h3>

      <app-search-input placeholder="Buscar registros" (valueChange)="term.set($event)" />

      <!-- BACK: si la lista es muy grande, el filtro puede ir al servidor
           (emitir term como output y pedirlo en getPrograms(term)). -->
      <ul class="list">
        @for (p of filtered(); track p.id) {
          <li>
            <button
              type="button"
              class="item"
              [class.active]="p.id === selectedId()"
              [attr.aria-current]="p.id === selectedId() ? 'true' : null"
              (click)="selectProgram.emit(p)"
            >
              <span class="count">{{ p.studentsCount }}</span>
              <span class="name">{{ p.name }}</span>
            </button>
          </li>
        } @empty {
          <li class="empty">{{ loading() ? 'Cargando programas...' : 'Sin resultados' }}</li>
        }
      </ul>
    }
  `,
  styleUrl: './program-sidebar.component.scss',
})
export class ProgramSidebarComponent {
  readonly programs = input.required<Program[]>();
  readonly selectedId = input<number | null>(null);
  readonly collapsed = input(false);
  readonly loading = input(false);

  readonly selectProgram = output<Program>();
  readonly toggleCollapse = output<void>();

  protected readonly term = signal('');
  protected readonly filtered = computed(() => {
    const t = this.term().trim().toLowerCase();
    return this.programs().filter((p) => p.name.toLowerCase().includes(t));
  });
}
